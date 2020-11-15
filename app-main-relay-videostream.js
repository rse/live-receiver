/*
**  Live Video Experience (LiVE)
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
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

/*  determine path to embedded ffmpeg(1) executable  */
let ffmpeg
if (os.platform() === "win32")
    ffmpeg = path.resolve(path.join(app.getAppPath(), "app-main-relay-videostream.d", "ffmpeg.exe")
        .replace("app.asar", "app.asar.unpacked"))
else if (os.platform() === "darwin")
    ffmpeg = path.resolve(path.join(app.getAppPath(), "app-main-relay-videostream.d", "ffmpeg")
        .replace("app.asar", "app.asar.unpacked"))
else if (os.platform() === "linux") {
    ffmpeg = which.sync("ffmpeg", { nothrow: true })
    if (ffmpeg === null)
        ffmpeg = path.resolve(path.join(app.getAppPath(), "app-main-relay-videostream.d", "ffmpeg")
            .replace("app.asar", "app.asar.unpacked"))
}
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
        this.proc.stdout.on("data", (chunk) => {
            const ab = chunk.buffer
            ab.fileStart = offset
            offset = this.mp4box.appendBuffer(ab)
            this.mp4box.flush()
        })
        this.proc.stdout.on("end", () => {
            this.emit("end")
        })
        this.proc.stderr.on("data", (line) => {
            this.emit("error", `videostream: FFmpeg: ${line.toString()}`)
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

        this.processing = false
        return Promise.resolve(true)
    }
}

