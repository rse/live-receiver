<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
**
-->

<template>
    <div v-bind:style="style" class="videostream">
        <!-- <video> container -->
        <div ref="stream"
            class="stream"
            v-show="state === 'playing' || state === 'stalled'">
        </div>

        <!-- video overlay -->
        <div class="overlay"
            v-show="state !== 'playing'">
            <div class="overlay-canvas">
                <div ref="overlayIcon" class="icon">
                    <div v-show="state === 'started'"><i class="icon fas fa-play-circle" ></i></div>
                    <div v-show="state === 'stalled'"><i class="icon fas fa-pause-circle"></i></div>
                    <div v-show="state === 'stopped'"><i class="icon fas fa-stop-circle" ></i></div>
                    <div v-show="state === 'error'"  ><i class="icon fas fa-times-circle"></i></div>
                </div>
                <div class="text">
                    <div v-show="state === 'started'">
                        {{ $t("videostream.state-started-title") }}<br/>
                        <div class="sub">{{ $t("videostream.state-started-subtitle") }}</div>
                    </div>
                    <div v-show="state === 'stalled'">
                        {{ $t("videostream.state-stalled-title") }}<br/>
                        <div class="sub">{{ $t("videostream.state-stalled-subtitle") }}</div>
                    </div>
                    <div v-show="state === 'stopped'">
                        {{ $t("videostream.state-stopped-title") }}<br/>
                        <div class="sub">{{ $t("videostream.state-stopped-subtitle") }}</div>
                    </div>
                    <div v-show="state === 'error'">
                        {{ $t("videostream.state-error-title") }}<br/>
                        <div class="sub">{{ $t("videostream.state-error-subtitle") }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- video closure -->
        <div class="closure"
            v-show="closure">
            <div class="closure-canvas">
                <div ref="closureIcon" class="icon">
                    <div><i class="icon fas fa-times-circle"></i></div>
                </div>
                <div class="text">
                    {{ $t("videostream.state-closure-title") }}<br/>
                    <div class="sub">{{ $t("videostream.state-closure-subtitle") }}</div>
                </div>
            </div>
        </div>

        <!-- video debug console -->
        <div class="debug"
            v-if="debug">
            <div v-for="item of debugLog" v-bind:key="item.id" v-bind:class="[ 'debug-item', 'debug-item-' + item.type ]">
                [{{ item.time }}]: {{ item.type.toUpperCase() }}: {{ item.text }}
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.videostream {
    /*  outer container  */
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    background-color:        var(--color-std-bg-2);
    border-top:    1px solid var(--color-std-bg-1);
    border-left:   1px solid var(--color-std-bg-1);
    border-right:  1px solid var(--color-std-bg-4);
    border-bottom: 1px solid var(--color-std-bg-4);
    position: relative;

    /*  video stream  */
    .stream {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        video {
            width: 100%;
            height: 100%;
        }
    }

    /*  video overlay  */
    .overlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        opacity: 0.9;
        display: flex;
        justify-content: center;
        align-items: center;
        .overlay-canvas {
            text-align: center;
            perspective: 0px;
            .icon {
                transform-origin: 50% 50%;
                transform-style:  preserve-3d;
                color: var(--color-sig-bg-5);
                font-size: 100pt;
            }
            .text {
                color: var(--color-std-fg-3);
                font-size: 16pt;
                .sub {
                    font-weight: 200;
                }
            }
        }
    }

    /*  video closure  */
    .closure {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        opacity: 1.0;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #000000;
        .closure-canvas {
            text-align: center;
            perspective: 0px;
            .icon {
                transform-origin: 50% 50%;
                transform-style:  preserve-3d;
                color: var(--color-std-bg-5);
                font-size: 100pt;
            }
            .text {
                color: var(--color-std-fg-1);
                font-size: 16pt;
                .sub {
                    font-weight: 200;
                }
            }
        }
    }

    /*  video debug console  */
    .debug {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 70%;
        opacity: 0.9;
        background-color: #000000;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        .debug-item {
            color: var(--color-std-fg-3);
            font-family: "TypoPRO Source Code Pro";
            font-size: 7pt;
            &.debug-item-error {
                color: var(--color-sig-fg-3);
            }
            &.debug-item-warning {
                color: var(--color-acc-fg-3);
            }
            &.debug-item-info {
            }
        }
    }
}
</style>

<script>
module.exports = {
    name: "videostream",

    /*  component static properties  */
    props: {
        volume: { type: Number,  default: 100 },
        muted:  { type: Boolean, default: false },
        device: { type: String,  default: "" }
    },

    /*  component variable properties  */
    data: function () {
        return {
            state:     "stalled",
            intVolume: this.volume ? this.volume : 100,
            intMuted:  this.muted  ? this.muted  : false,
            intDevice: this.device ? this.device : "",
            closure:   false,
            debug:     false,
            debugId:   0,
            debugLog:  []
        }
    },

    /*  component computed properties  */
    computed: {
        style: ui.vueprop2cssvar()
    },

    /*  component property observation  */
    watch: {
        intVolume: function (v) {
            if (this.ve !== null)
                this.ve.volume = v / 100
        },
        intMuted: function (v) {
            if (this.ve !== null)
                this.ve.muted = v
        },
        intDevice: function (v) {
            if (this.ve !== null && v !== "")
                this.ve.setSinkId(v)
        }
    },

    /*  internal methods  */
    methods: {
        log (type, text) {
            if (!this.debug)
                return
            if (this.debugLog.length > 50)
                this.debugLog.unshift()
            const time = ui.dayjs().format("HH:mm:ss.SSS")
            this.debugLog.push({ id: this.debugId++, time, type, text })
        }
    },

    /*  component DOM mounting hook  */
    mounted () {
        /*  allow volume to be adjusted  */
        this.$on("volume", (volume) => {
            this.intVolume = volume
        })

        /*  allow volume to be muted  */
        this.$on("mute", (muted) => {
            this.intMuted = muted
        })

        /*  allow device to be switched  */
        this.$on("device", (device) => {
            this.intDevice = device
        })

        /*  animate the icons  */
        anime({
            targets:  this.$refs.overlayIcon,
            duration: 5000,
            easing:   "easeInOutQuad",
            autoplay: true,
            loop:     true,
            delay:    1000,
            rotateY:  [ 0, 360 ]
        })
        anime({
            targets:  this.$refs.closureIcon,
            duration: 5000,
            easing:   "easeInOutQuad",
            autoplay: true,
            loop:     true,
            delay:    5000,
            rotateY:  [ 0, 360 ]
        })

        /*  the internal streaming state  */
        this.streaming = false
        this.we = this.$refs.stream
        this.ve = null
        this.ms = null
        this.sb = {}
        let queue = []
        let timer = null
        let updating = {}

        /*  start a new stream  */
        const streamBegin = async () => {
            this.state = "started"

            /*  reset state  */
            queue = []
            updating = {}

            /*   create a fresh <video> stream element  */
            while (this.we.lastElementChild)
                this.we.removeChild(this.we.lastElementChild)
            const ve = document.createElement("video")
            this.we.appendChild(ve)
            ve.autoplay = true
            ve.preload  = "none"
            ve.volume   = this.intVolume / 100
            ve.muted    = this.intMuted
            if (this.device !== "")
                ve.setSinkId(this.device)
            ve.addEventListener("loadeddata", () => {
                const width  = ve.videoWidth
                const height = ve.videoHeight
                this.log("info", `event: videoelement: loadeddata (width=${width} height=${height})`)
                ui.log.debug(`ui: videoelement: loadeddata (width=${width} height=${height})`)
                this.$emit("stream-video-size", { width, height })
            })
            ve.addEventListener("canplay", () => {
                this.log("info", "event: videoelement: canplay")
                ui.log.debug("ui: videoelement: canplay")
            })
            ve.addEventListener("progress", () => {
                this.log("info", "event: videoelement: progress")
                ui.log.debug("ui: videoelement: progress")
            })
            ve.addEventListener("playing", () => {
                this.log("info", "event: videoelement: playing")
                ui.log.debug("ui: videoelement: playing")
                this.state = "playing"
            })
            ve.addEventListener("stalled", () => {
                this.log("info", "event: videoelement: stalled")
                ui.log.debug("ui: videoelement: stalled")
                this.state = "stalled"
            })
            ve.addEventListener("waiting", () => {
                this.log("info", "event: videoelement: waiting")
                ui.log.debug("ui: videoelement: waiting")
                this.state = "stalled"
            })
            ve.addEventListener("ended", () => {
                this.log("info", "event: videoelement: ended")
                ui.log.debug("ui: videoelement: ended")
                this.state = "stopped"
            })
            ve.addEventListener("error", (ev) => {
                this.log("error", `event: videoelement: ${ev}`)
                this.$emit("error", `HTMLMediaElement: ${ev}`)
                ui.log.debug("ui: videoelement: error", ev)
                this.state = "error"
                this.$emit("stream-reboot")
            })
            this.ve = ve

            /*   attach a MediaSource to the <video> stream element  */
            const ms = new MediaSource()
            ve.src = window.URL.createObjectURL(ms)
            ms.addEventListener("sourceopen", (ev) => {
                this.log("info", "event: mediasource: sourceopen")
                ui.log.debug("ui: mediasource: sourceopen")
            })
            ms.addEventListener("sourceended", (ev) => {
                this.log("info", "event: mediasource: sourceended")
                ui.log.debug("ui: mediasource: sourceended")
            })
            ms.addEventListener("sourceclose", (ev) => {
                this.log("info", "event: mediasource: sourceclose")
                ui.log.debug("ui: mediasource: sourceclose")
            })
            ms.addEventListener("error", (ev) => {
                this.log("error", `event: MediaSource: ${ev}`)
                this.$emit("error", `MediaSource: ${ev}`)
                ui.log.debug(`ui: mediasource: error: ${ev}`)
                this.state = "error"
                this.$emit("stream-reboot")
            })
            this.ms = ms

            /*  ensure that the MediaSource is really ready to receive data  */
            while (this.ms.readyState !== "open")
                await new Promise((resolve) => setTimeout(resolve, 100))
        }

        /*  reset stream position  */
        const streamReset = async () => {
            /*  reset the source buffers and video element to ensure that a
                new stream (after FFmpeg restarted) immediately plays
                and no old content is still displayed  */
            for (const id of Object.keys(this.sb)) {
                if (this.sb[id].updating) {
                    this.sb[id].abort()
                    while (this.sb[id].updating)
                        await new Promise((resolve) => setTimeout(resolve, 10))
                }
                const range = this.sb[id].buffered
                for (let i = 0; i < range.length; i++)
                    this.sb[id].remove(range.start(i), range.end(i))
            }
            this.ve.currentTime = 0.0
        }

        /*  receive stream data  */
        const streamData = async (data) => {
            /*  transfer a stream data chunk into the <video> stream element  */
            let transferProgress = false
            const transfer = async () => {
                /*  ensure we are starting transfer only if video and audio source buffers both exist  */
                if (Object.keys(this.sb).length !== 2) {
                    this.log("info", "streamData: transfer: waiting to have exactly two source buffers available")
                    ui.log.debug("streamData: transfer: waiting to have exactly two source buffers available")
                    return
                }

                /*  ensure we are handling just one transfer per time  */
                if (transferProgress) {
                    this.log("info", "streamData: transfer still in progress (waiting & repeating)")
                    ui.log.debug("streamData: transfer still in progress (waiting & repeating)")
                    timer = setTimeout(transfer, 1000 / 60 /* = 1s/60fps */)
                    return
                }
                transferProgress = true

                /*  remove a still pending timer  */
                if (timer !== null) {
                    clearTimeout(timer)
                    timer = null
                }

                /*  act only if there is still data
                    (notice the repeat timer)  */
                if (queue.length > 0) {
                    this.log("info", `streamData: pending segment in queue (queue length: ${queue.length})`)
                    ui.log.debug(`streamData: pending segment in queue (queue length: ${queue.length})`)
                    const id = queue[0].id
                    if (this.sb[id] !== undefined && (updating[id] || this.sb[id].updating)) {
                        /*  the <video> element is still updating, so repeat  */
                        this.log("info", "streamData: video element still updating (waiting & repeating)")
                        timer = setTimeout(transfer, 1000 / 60 /* = 1s/60fps */)
                    }
                    else if (this.sb[id] !== undefined && queue.length > 0) {
                        /*  feed new data  */
                        const data = queue.shift()
                        if (this.streaming) {
                            /*  now finally feed the data into the SourceBuffer  */
                            this.log("info", `streamData: sourcebuffer: appendBuffer (length: ${data.buffer.byteLength})`)
                            ui.log.debug(`streamData: sourcebuffer: appendBuffer (length: ${data.buffer.byteLength})`)
                            try {
                                this.sb[data.id].appendBuffer(data.buffer)
                            }
                            catch (err) {
                                this.log("error", `streamData: sourcebuffer: appendBuffer: exception: ${err}`)
                                ui.log.error(`ui: sourcebuffer: appendBuffer: exception: ${err}`)
                                this.$emit("error", `SourceBuffer: ${err}`)
                            }
                        }
                        else {
                            this.log("warning", "streamData: sourcebuffer: not streaming (skipping data)")
                            ui.log.debug("streamData: sourcebuffer: not streaming (skipping data)")
                        }
                    }
                }
                transferProgress = false
            }

            /*  on-the-fly create SourceBuffer  */
            if (this.sb[data.id] === undefined) {
                this.log("info", "streamData: on-the-fly creating sourcebufffer")
                if (!MediaSource.isTypeSupported(data.user.mimeCodec)) {
                    this.log("error", `unknown codec "${data.user.mimeCodec}" -- ignoring stream data`)
                    ui.log.error(`unknown codec "${data.user.mimeCodec}" -- ignoring stream data`)
                    this.$emit("error", `unknown codec "${data.user.mimeCodec}" -- ignoring stream data`)
                }
                else {
                    try {
                        this.log("info", `streamData: mediasource: addSourceBuffer (codec: ${data.user.mimeCodec})`)
                        ui.log.debug(`streamData: mediasource: addSourceBuffer (codec: ${data.user.mimeCodec})`)
                        const sb = this.ms.addSourceBuffer(data.user.mimeCodec)
                        this.sb[data.id] = sb
                        this.sb[data.id].addEventListener("updatestart", () => {
                            updating[data.id] = true
                        })
                        this.sb[data.id].addEventListener("updateend", () => {
                            updating[data.id] = false

                            /*  flush perhaps still pending data  */
                            transfer()
                        })
                        this.sb[data.id].addEventListener("abort", () => {
                            this.log("error", "event: sourcebuffer: abort")
                            ui.log.debug("ui: sourcebuffer: abort")
                            this.$emit("error", "SourceBuffer: abort")
                            updating[data.id] = false
                        })
                        this.sb[data.id].addEventListener("error", (event, err) => {
                            this.log("error", `event: sourcebuffer: error: ${err}`)
                            ui.log.error(`ui: sourcebuffer: error: ${err}`)
                            this.$emit("error", `SourceBuffer: ${err}`)
                            updating[data.id] = false
                        })
                    }
                    catch (err) {
                        this.log("error", `mediasource: addSourceBuffer: exception: ${err}`)
                        ui.log.debug(`ui: mediasource: addSourceBuffer: exception: ${err}`)
                        this.$emit("error", `SourceBuffer: ${err}`)
                    }
                }
            }

            /*  queue stream data  */
            queue.push(data)

            /*  flush pending data  */
            transfer()
        }

        /*  end a stream  */
        const streamEnd = async () => {
            if (this.ms !== null) {
                this.ms.endOfStream()
                for (const id of Object.keys(this.sb)) {
                    this.ms.removeSourceBuffer(this.sb[id])
                    delete this.sb[id]
                    delete updating[id]
                }
                this.ms = null
            }
            this.ve.removeAttribute("src")
            this.ve.load()
            this.we.removeChild(this.ve)
            this.ve = null
            while (this.we.lastElementChild)
                this.we.removeChild(this.we.lastElementChild)
            this.state = "stopped"
        }

        /*  provide event entry hooks  */
        this.$on("stream-begin", async () => {
            this.log("info", "event: stream-begin: begin")
            ui.log.info("ui: stream-begin: begin")
            if (!this.streaming) {
                await streamBegin().catch(() => true)
                this.streaming = true
            }
            this.$emit("stream-begin:done")
            this.log("info", "event: stream-begin: end")
            ui.log.info("ui: stream-begin: end")
        })
        this.$on("stream-data", async (data) => {
            this.log("info", `event: stream-data (num: ${data.num}, id: ${data.id}, ` +
                `codec: ${data.user.mimeCodec}, size: ${data.buffer.byteLength})`)
            if (this.streaming)
                streamData(data)
            else
                this.log("warning", "event: stream-data: not streaming (skipping data)")
        })
        this.$on("stream-reset", async () => {
            if (this.streaming) {
                this.log("info", "event: stream-reset: begin")
                ui.log.info("ui: stream-reset: begin")
                this.streaming = false
                await streamReset()
                this.streaming = true
                this.log("info", "event: stream-reset: end")
                ui.log.info("ui: stream-reset: end")
            }
            else
                this.log("warning", "event: stream-reset: not streaming (skipping event)")
        })
        this.$on("stream-end", async () => {
            this.log("info", "event: stream-end: begin")
            ui.log.info("ui: stream-end: begin")
            if (this.streaming) {
                this.streaming = false
                await streamEnd().catch(() => true)
            }
            this.$emit("stream-end:done")
            this.log("info", "event: stream-end: end")
            ui.log.info("ui: stream-end: end")
        })

        /*  allow rebooting on Video element or MediaSource errors  */
        this.$on("stream-reboot", async () => {
            this.log("info", "event: stream-reboot: begin")
            ui.log.info("ui: stream-reboot: begin")
            this.streaming = false
            await streamEnd().catch(() => true)
            await streamBegin().catch(() => true)
            this.streaming = true
            this.log("info", "event: stream-reboot: end")
            ui.log.info("ui: stream-reboot: end")
        })

        /*  allow closure to be toggled  */
        this.$on("closure", async (enabled) => {
            this.closure = enabled
        })

        /*  allow debug console to be toggled  */
        this.$on("debug", async (enabled) => {
            this.debug = enabled
        })
        this.log("info", "video stream element created")
    }
}
</script>

