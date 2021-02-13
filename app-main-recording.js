/*
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
*/

/*  standard requirements  */
const fs           = require("fs")
const path         = require("path")
const crypto       = require("crypto")
const EventEmitter = require("events")

/*  external requirements  */
const UUID         = require("pure-uuid")
const dayjs        = require("dayjs")
const mkdirp       = require("mkdirp")
const getHostId    = require("hostid")
const rimraf       = require("rimraf")
const m3u8Parser   = require("m3u8-parser")

/*  the exported API  */
module.exports = class Recording extends EventEmitter {
    constructor (options = {}) {
        super()

        /*  determine default option values  */
        this.options = Object.assign({}, {
            basedir:    "",
            secret:     "",
            log:        (level, msg) => {}
        }, options)

        /*  internal state  */
        this.hostid   = getHostId()
        this.chunks   = []
        this.lastTime = null
    }

    /*  make a new recoding context  */
    makeCtx (time, channel) {
        const id     = `${time}-${channel}`
        const key    = (new UUID(3, "ns:URL", `urn:live:${id}-${this.hostid}`)).format("b16")
        const iv     = (new UUID(3, "ns:URL", `urn:live:${id}-${this.hostid}`)).format("b16")
        const dir    = path.join(this.options.basedir, id)
        return { id, key, iv, dir }
    }

    /*  check whether a pathname really exists on the filesystem  */
    async pathExists (pathname) {
        return fs.promises.access(pathname, fs.constants.F_OK)
            .then(()  => true)
            .catch(() => false)
    }

    /*  generate the HLS M3U8 index file  */
    async reindex (ctx, chunks) {
        /*  generate HLS M3U8 index  */
        let targetDuration = 1
        for (let i = 1; i < chunks.length; i++)
            targetDuration = Math.max(targetDuration, chunks[i].duration)
        const mediaSequence = chunks.length >= 2 ? chunks[1].sequence : -1
        let m3u8 =
            "#EXTM3U\n" +
            "#EXT-X-VERSION:7\n" +
            "#EXT-X-PLAYLIST-TYPE:EVENT\n" +
            `#EXT-X-TARGETDURATION:${targetDuration.toFixed(6)}\n` +
            `#EXT-X-MEDIA-SEQUENCE:${mediaSequence}\n` +
            `#EXT-X-MAP:URI="${chunks[0].filename}"\n`
        for (let i = 1; i < chunks.length; i++) {
            if (chunks[i].duration === -1)
                continue
            m3u8 +=
                `#EXT-X-PROGRAM-DATE-TIME:${dayjs(chunks[i].time).format("YYYY-MM-DDTHH:mm:ss.SSSZ")}\n` +
                `#EXTINF:${chunks[i].duration.toFixed(6)},\n` +
                `${chunks[i].filename}\n`
        }
        m3u8 += "#EXT-X-ENDLIST\n"
        await fs.promises.writeFile(path.join(ctx.dir, "index.m3u8"), m3u8, { encoding: "utf8" })
    }

    /*  encrypt a buffer  */
    encrypt (key, iv, buffer) {
        const cipher = crypto.createCipheriv("aes-128-cbc", Buffer.from(key, "hex"), Buffer.from(iv, "hex"))
        return Buffer.concat([ cipher.update(buffer), cipher.final() ])
    }

    /*  decrypt a buffer  */
    decrypt (key, iv, buffer) {
        const cipher = crypto.createDecipheriv("aes-128-cbc", Buffer.from(key, "hex"), Buffer.from(iv, "hex"))
        return Buffer.concat([ cipher.update(buffer), cipher.final() ])
    }

    /*  store a recording chunk  */
    async store (chunk) {
        /*  determine context  */
        const time = dayjs(chunk.started).format("YYYY-MM-DD-HH-mm-ss")
        const ctx = this.makeCtx(time, chunk.channel)

        /*  dispatch according to chunk type  */
        if (chunk.type === "init") {
            /*  handle timing  */
            const now = Date.now()
            this.lastTime = now

            /*  initialize recording by creating recording directory  */
            await mkdirp(ctx.dir, { mode: 0o755 })

            /*  store init segment  */
            const filename = "init.mp4"
            const data = this.encrypt(ctx.key, ctx.iv, chunk.buffer)
            await fs.promises.writeFile(path.join(ctx.dir, filename), data, { encoding: null })

            /*  remember meta information for indexing  */
            this.chunks = []
            this.chunks.push({
                time:     now,
                sequence: -1,
                duration: 0,
                filename
            })

            /*  update index  */
            await this.reindex(ctx, this.chunks)
        }
        else if (chunk.type === "segment") {
            /*  handle timing  */
            const now = Date.now()
            const duration = (now - this.lastTime) / 1000
            this.lastTime = now

            /*  store regular segment  */
            const filename = `segment${chunk.sequence}.m4s`
            const data = this.encrypt(ctx.key, ctx.iv, chunk.buffer)
            await fs.promises.writeFile(path.join(ctx.dir, filename), data, { encoding: null })

            /*  post-adjust the duration of the previous segment  */
            this.chunks[this.chunks.length - 1].duration = duration

            /*  remember meta information for indexing  */
            this.chunks.push({
                time:     now,
                sequence: chunk.sequence,
                duration: -1,
                filename
            })

            /*  update index  */
            await this.reindex(ctx, this.chunks)
        }
    }

    /*  determine URL path to recording index artifact  */
    url (recording) {
        return `app://-/${recording}/index.m3u8`
    }

    /*  determine recordings  */
    async recordings () {
        /*  iterate over all recording directories  */
        const dirs = await fs.promises.readdir(this.options.basedir)
        const recordings = []
        for (const dir of dirs) {
            /*  determine start time and channel from recording directory  */
            const m = dir.match(/^(\d{4}-\d{2}-\d{2})-(\d{2})-(\d{2})-(\d{2})-(.+)$/)
            if (m === null)
                continue
            const start = dayjs(`${m[1]} ${m[2]}:${m[3]}:${m[4]}`).valueOf()
            const channel = m[5]

            /*  determine duration from recording index  */
            const index = await fs.promises.readFile(path.join(this.options.basedir, dir, "index.m3u8"), { encoding: "utf8" })
            const parser = new m3u8Parser.Parser()
            parser.push(index)
            parser.end()
            let duration = 0
            for (const segment of parser.manifest.segments)
                duration += segment.duration
            duration = Math.round(duration)

            /*  provide results  */
            recordings.push({ id: dir, channel, start, duration })
        }
        return recordings
    }

    /*  determine information about a recording  */
    async info (recording) {
        const m = recording.match(/^(\d{4}-\d{2}-\d{2})-(\d{2})-(\d{2})-(\d{2})-(.+)$/)
        if (m === null)
            throw new Error("invalid recording name")
        const time    = `${m[1]} ${m[2]}:${m[3]}:${m[4]}`
        const channel = m[5]
        return { time, channel }
    }

    /*  load a recording artifact  */
    async load (recording, filename, type) {
        this.options.log("info", `loading artifact: recording="${recording}" filename="${filename}" type="${type}"`)

        /*  parse recording name  */
        const m = recording.match(/^(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})-(.+)$/)
        if (m === null)
            throw new Error("invalid recording name")

        /*  determine context  */
        const time    = m[1]
        const channel = m[2]
        const ctx = this.makeCtx(time, channel)

        /*  ensure recording exists  */
        if (!(await this.pathExists(ctx.dir)))
            throw new Error("recording not found")

        /*  ensure recording artifact exists  */
        const file = path.join(ctx.dir, filename)
        if (!(await this.pathExists(file)))
            throw new Error("recording artifact not found")

        /*  dispatch according to artifact  */
        let response
        if (filename.match(/\.m3u8$/)) {
            const data = await fs.promises.readFile(file, { encoding: null })
            response = { data, type: "application/x-mpegURL" }
        }
        else if (filename.match(/\.mp4$/)) {
            let data = await fs.promises.readFile(file, { encoding: null })
            data = this.decrypt(ctx.key, ctx.iv, data)
            response = { data, type: "video/mp4" }
        }
        else if (filename.match(/\.m4s$/)) {
            let data = await fs.promises.readFile(file, { encoding: null })
            data = this.decrypt(ctx.key, ctx.iv, data)
            response = { data, type: "video/iso.segment" }
        }

        /*  handle response type  */
        if (type === "text" && typeof response.data !== "string")
            response.data = response.data.toString()

        return response
    }

    /*  delete a single recording  */
    async delete (recording) {
        /*  determine pathname  */
        const pathname = path.join(this.options.basedir, recording)

        /*  ensure recording exists  */
        if (!(await this.pathExists(pathname)))
            throw new Error("recording not found")

        /*  delete entire recording  */
        await new Promise((resolve, reject) => {
            rimraf(pathname, { disableGlob: true }, (err) => {
                if (err) reject(err)
                else     resolve()
            })
        })
    }

    /*  prune all recordings  */
    async prune (after) {
        /*  iterate over all expired recordings  */
        const recordings = await this.recordings()
        for (const recording of recordings) {
            /*  ensure recording (still) exists  */
            const pathname = path.join(this.options.basedir, recording.id)
            if (!(await this.pathExists(pathname)))
                continue

            /*  in case the recording expired...  */
            const now = dayjs()
            const expires = dayjs(recording.start)
                .add(recording.duration, "second")
                .add(after, "hour")
            if (expires.isBefore(now)) {
                /*  ...remove it  */
                this.options.log("info", `pruning recording "${recording.id}"`)
                await new Promise((resolve, reject) => {
                    rimraf(pathname, { disableGlob: true }, (err) => {
                        if (err) reject(err)
                        else     resolve()
                    })
                })
            }
        }
    }
}

