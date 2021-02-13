/*
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
*/

/*  standard requirements  */
const os           = require("os")
const path         = require("path")
const EventEmitter = require("events")

/*  external requirements  */
const { app }      = require("electron")
const execa        = require("execa")
const which        = require("which")
const UUID         = require("pure-uuid")
const MP4Box       = require("mp4box")
const MP4Frag      = require("mp4frag")

/*  internal requirements  */
const { reachable }   = require("./app-main-relay-util.js")

/*  determine path to embedded ffmpeg(1) executable  */
let ffmpeg
if (os.platform() === "win32")
    ffmpeg = path.resolve(path.join(app.getAppPath(), "app-main-relay-videostream.d", "ffmpeg.exe")
        .replace("app.asar", "app.asar.unpacked"))
else if (os.platform() === "darwin")
    ffmpeg = path.resolve(path.join(app.getAppPath(), "app-main-relay-videostream.d", "ffmpeg")
        .replace("app.asar", "app.asar.unpacked"))
else if (os.platform() === "linux")
    ffmpeg = path.resolve(path.join(app.getAppPath(), "app-main-relay-videostream.d", "ffmpeg")
        .replace("app.asar", "app.asar.unpacked"))
else
    throw new Error(`operating system platform ${os.platform()} not supported`)

/*  the exported API  */
module.exports = class VideoStream extends EventEmitter {
    constructor (options = {}) {
        super()

        /*  determine default option values  */
        const id = (new UUID(1)).format("std")
        this.options = Object.assign({}, {
            ffmpeg:     ffmpeg,
            client:     id,
            server:     "",
            channel:    "",
            token1:     "",
            token2:     "",
            timeout:    15 * 1000,
            buffering:  2000,        /* FIXME: INTENTIONALLY UNUSED! */
            log:        (level, msg) => {}
        }, options)

        /*  initialize state  */
        this.initial    = false
        this.timer      = null
        this.proc       = null
        this.processing = false
        this.mp4box     = null
        this.mp4frag    = null
    }
    async reachable () {
        return reachable(this.options.server, 443, 4 * 1000)
    }
    async start () {
        this.processing = true

        /*  cleanup if necessary  */
        if (this.proc !== null)
            await this.stop()

        /*  reset state  */
        this.initial = true
        this.timer   = null

        /*  determine RTMPS URL  */
        let url = `rtmps://${this.options.server}/stream/${this.options.channel}`
        url += `?key=${this.options.token1}-${this.options.token2}`

        /*  start ffmpeg(1) sub-process  */
        const options = [
            /*  top-level options  */
            "-loglevel",      "0",

            /*  input options  */
            "-probesize",     "1000000",  /*  1MB   */
            "-max_delay",     "2000000",  /*  2.0s  */
            "-rtmp_live",     "live",
            "-rtmp_buffer",   "2000",     /*  2.0s  */ /* FIXME: this.options.buffering INTENTIONALLY UNUSED! */
            "-fflags",        "nobuffer",
            "-tls_verify",    "0",
            "-i",             url,

            /*  output options  */
            "-threads",       "4",
            "-c:a",           "copy",     /*  no re-encoding */
            "-c:v",           "copy",     /*  no re-encoding */
            "-f",             "mp4",
            "-muxdelay",      "0.5",      /*  0.5s  */
            "-movflags",      "frag_keyframe+omit_tfhd_offset+empty_moov+default_base_moof",
            "-fflags",        "flush_packets",
            "-flush_packets", "1",
            "-y",
            "pipe:1"
        ]
        this.options.log("info", `videostream: starting FFmpeg process: ${this.options.ffmpeg} ${options.join(" ")}`)
        this.proc = execa(this.options.ffmpeg, options)

        /*  timeout handler  */
        const onTimeout = async () => {
            this.options.log("info", `videostream: data receiving timeout (${this.options.timeout / 1000}s) ` +
                "-- restarting FFMpeg subprocess")
            await this.stop()
            this.start()
        }
        this.timer = setTimeout(onTimeout, this.options.timeout)

        /*  establish fragmentation of the bytestream into MP4 fragments
            (reason: keeping the recent fragments for snapshotting and recording)  */
        this.mp4frag = new MP4Frag({ segmentCount: 5 })
        this.mp4frag.on("error", (err) => {
            this.emit("error", `videostream: mp4frag: ${err}`)
        })
        const started = Date.now()
        this.mp4frag.on("initialized", (init) => {
            this.emit("fragment", {
                type:     "init",
                started:  started,
                channel:  this.options.channel,
                sequence: -1,
                duration: -1,
                buffer:   init.initialization
            })
        })
        this.mp4frag.on("segment", (segment) => {
            this.emit("fragment", {
                type:     "segment",
                started:  started,
                channel:  this.options.channel,
                sequence: segment.sequence,
                duration: parseInt(segment.duration),
                buffer:   segment.segment
            })
        })

        /*  establish segmentation of the bytestream into MP4 boxes
            (reason: the <video> element later accepts only valid and complete MP4 segments)  */
        this.mp4box = MP4Box.createFile()
        this.mp4box.onReady = (info) => {
            let segment = 0
            if (!this.processing) {
                if (this.timer !== null)
                    clearTimeout(this.timer)
                this.timer = setTimeout(onTimeout, this.options.timeout)
            }
            this.mp4box.onSegment = (id, user, buffer) => {
                if (!this.processing) {
                    if (this.timer !== null)
                        clearTimeout(this.timer)
                    this.timer = setTimeout(onTimeout, this.options.timeout)
                }
                this.emit("segment", segment++, id, user, buffer)
            }
            for (const track of info.tracks) {
                let mimeCodec
                if (track.type === "video")
                    mimeCodec = `video/mp4; codecs="${track.codec}"`
                else if (track.type === "audio")
                    mimeCodec = `audio/mp4; codecs="${track.codec}"`
                else
                    continue
                const user = { info: track, mimeCodec }
                this.mp4box.setSegmentOptions(track.id, user, {
                    nbSamples:     track.type === "video" ? 30 : 60,
                    rapAlignement: true
                })
            }
            const segs = this.mp4box.initializeSegmentation()
            for (const seg of segs)
                this.emit("segment", segment++, seg.id, seg.user, seg.buffer)
            this.mp4box.start()
        }
        this.mp4box.onError = (err) => {
            this.emit("error", `videostream: mp4box: ${err}`)
        }

        /*  process output of ffmpeg(1) subprocess  */
        let offset = 0
        this.proc.stdout.on("data", (data) => {
            /*  feed into MP4Box for segmentation  */
            const ab = data.buffer
            ab.fileStart = offset
            offset = this.mp4box.appendBuffer(ab)
            this.mp4box.flush()

            /*  feed into MP4Frag for fragmentation  */
            try { this.mp4frag.write(Buffer.from(data.buffer)) }
            catch (ex) {}
        })
        this.proc.stdout.on("end", () => {
            this.emit("end")
        })
        this.proc.stderr.on("data", (line) => {
            this.emit("error", `videostream: FFmpeg: ${line.toString()}`)
        })

        /*  process exit of ffmpeg(1) subprocess  */
        let workaround = false
        this.proc.on("exit", async (code, signal) => {
            /*  just log the information  */
            this.options.log("error", `videostream: FFmpeg: exit (code: ${code}, signal: ${signal})`)

            /*  NASTY WORKAROUND: on some Linux platforms (e.g. Ubuntu 20.10) the statically built
                ffmpeg(1) executable (built under Debian AFAIK) unfortunately segfaults, so at
                least once try to use an externally installed "native" ffmpeg(1) of the system  */
            if (code === null && signal === "SIGSEGV" && !workaround) {
                workaround = true
                const ffmpeg = which.sync("ffmpeg", { nothrow: true })
                if (ffmpeg !== null) {
                    this.options.ffmpeg = ffmpeg
                    await this.stop()
                    this.start()
                }
                else {
                    /*  no chance, we have to tell the user that we need a system-native FFmpeg  */
                    this.emit("fatal", "sorry, the embedded FFmpeg program unfortunately crashes under " +
                        "your particular operating system. Please install a native FFmpeg in your system, " +
                        "ensure that the executable \"ffmpeg\" is in your $PATH and then restart this " +
                        "LiVE Receiver application again, please.")
                }
            }
        })

        this.processing = false
        return Promise.resolve(true)
    }
    async stop () {
        this.processing = true

        /*  clear a still running timer  */
        if (this.timer !== null) {
            clearTimeout(this.timer)
            this.timer = null
        }

        /*  kill ffmpeg(1) subprocess  */
        if (this.proc !== null) {
            this.options.log("info", "videostream: stopping FFmpeg process")
            this.proc.kill("SIGTERM", { forceKillAfterTimeout: 2 * 1000 })
            try {
                await this.proc
            }
            catch (err) {
                /*  no-op  */
            }
            this.proc = null
        }

        /*  remove state  */
        this.mp4box  = null
        this.mp4frag = null

        this.processing = false
        return Promise.resolve(true)
    }
    async record (filename) {
        if (this.mp4frag === null || this.mp4frag.buffer === null)
            return

        /*  start ffmpeg(1) re-muxing sub-process  */
        const options = [
            /*  top-level options  */
            "-loglevel",      "0",

            /*  input options  */
            "-f",             "mp4",
            "-i",             "pipe:0",

            /*  output options  */
            "-threads",       "4",
            "-c:a",           "copy",     /*  no re-encoding */
            "-c:v",           "copy",     /*  no re-encoding */
            "-f",             "mp4",
            "-y",
            filename
        ]
        this.options.log("info", `videostream: starting FFmpeg process: ${this.options.ffmpeg} ${options.join(" ")}`)
        const proc = execa(this.options.ffmpeg, options, {
            stdio: [ "pipe", "inherit", "inherit" ]
        })
        proc.stdin.on("error", (err) => {
            this.emit("error", `videostream: recording: FFmpeg process: ERROR: ${err}`)
        })

        /*  send down the buffered MP4 fragment  */
        const buffer = this.mp4frag.buffer
        await new Promise((resolve) => proc.stdin.write(buffer, null, resolve))
        await new Promise((resolve) => proc.stdin.end(resolve))
        await proc
    }
}

