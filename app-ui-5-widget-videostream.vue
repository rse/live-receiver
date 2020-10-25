<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
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
            <div ref="overlayIcon" class="icon">
                <div v-show="state === 'started'"><i class="icon fas fa-play-circle" ></i></div>
                <div v-show="state === 'stalled'"><i class="icon fas fa-pause-circle"></i></div>
                <div v-show="state === 'stopped'"><i class="icon fas fa-stop-circle" ></i></div>
                <div v-show="state === 'error'"  ><i class="icon fas fa-times-circle"></i></div>
            </div>
            <div class="text">
                <div v-show="state === 'started'">
                    Video-Stream Started<br/>
                    <div class="sub">(awaiting to receive stream data)</div>
                </div>
                <div v-show="state === 'stalled'">
                    Video-Stream Stalled<br/>
                    <div class="sub">(awaiting to receive stream data again)</div>
                </div>
                <div v-show="state === 'stopped'">
                    Video-Stream Stopped<br/>
                    <div class="sub">(awaiting internal shutdown)</div>
                </div>
                <div v-show="state === 'error'">
                    Video-Stream Failed<br/>
                    <div class="sub">(awaiting internal recovery)</div>
                </div>
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
        text-align: center;
        perspective: 0px;
        opacity: 0.9;
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
            intDevice: this.device ? this.device : ""
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

        /*  animate the icon  */
        anime({
            targets:  this.$refs.overlayIcon,
            duration: 5000,
            easing:   "easeInOutQuad",
            autoplay: true,
            loop:     true,
            delay:    1000,
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
                ui.log.debug("ui: videoelement: loadeddata")
            })
            ve.addEventListener("canplay", () => {
                ui.log.debug("ui: videoelement: canplay")
            })
            ve.addEventListener("progress", () => {
                ui.log.debug("ui: videoelement: progress")
            })
            ve.addEventListener("playing", () => {
                ui.log.debug("ui: videoelement: playing")
                this.state = "playing"
            })
            ve.addEventListener("stalled", () => {
                ui.log.debug("ui: videoelement: stalled")
                this.state = "stalled"
            })
            ve.addEventListener("waiting", () => {
                ui.log.debug("ui: videoelement: waiting")
                this.state = "stalled"
            })
            ve.addEventListener("ended", () => {
                ui.log.debug("ui: videoelement: ended")
                this.state = "stopped"
            })
            ve.addEventListener("error", (ev) => {
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
                ui.log.debug("ui: mediasource: sourceopen")
            })
            ms.addEventListener("sourceended", (ev) => {
                ui.log.debug("ui: mediasource: sourceended")
            })
            ms.addEventListener("sourceclose", (ev) => {
                ui.log.debug("ui: mediasource: sourceclose")
            })
            ms.addEventListener("error", (ev) => {
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
                /*  ensure we are handling just one transfer per time  */
                if (transferProgress) {
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
                    const id = queue[0].id
                    if (this.sb[id] !== undefined && (updating[id] || this.sb[id].updating)) {
                        /*  the <video> element is still updating, so repeat  */
                        timer = setTimeout(transfer, 1000 / 60 /* = 1s/60fps */)
                    }
                    else if (this.sb[id] !== undefined && queue.length > 0) {
                        /*  feed new data  */
                        const data = queue.shift()
                        if (this.streaming) {
                            /*  STRANGE: on the first appendBuffer() of the first SourceBuffer
                                we have to wait a little bit (think: race condition!), or the second
                                addSourceBuffer() of the MediaSource (see below) raised an exception!  */
                            if (this.sb[data.id].buffered.length === 0)
                                await new Promise((resolve) => setTimeout(resolve, 50))

                            /*  track updating on our own, too */
                            updating[data.id] = true

                            /*  now finally feed the data into the SourceBuiffer  */
                            try {
                                this.sb[data.id].appendBuffer(data.buffer)
                            }
                            catch (err) {
                                ui.log.error(`ui: sourcebuffer: appendBuffer: exception: ${err}`)
                                this.$emit("error", `SourceBuffer: ${err}`)
                            }
                        }
                    }
                }
                transferProgress = false
            }

            /*  on-the-fly create SourceBuffer  */
            if (this.sb[data.id] === undefined) {
                if (!MediaSource.isTypeSupported(data.user.mimeCodec))
                    this.$emit("error", `unknown codec "${data.user.mimeCodec}" -- ignoring stream data`)
                else {
                    try {
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
                            ui.log.debug("ui: sourcebuffer: abort")
                            this.$emit("error", "SourceBuffer: abort")
                            updating[data.id] = false
                        })
                        this.sb[data.id].addEventListener("error", (event, err) => {
                            ui.log.error(`ui: sourcebuffer: error: ${err}`)
                            this.$emit("error", `SourceBuffer: ${err}`)
                            updating[data.id] = false
                        })
                    }
                    catch (err) {
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
            ui.log.info("ui: stream-begin: begin")
            if (!this.streaming) {
                await streamBegin().catch(() => true)
                this.streaming = true
            }
            this.$emit("stream-begin:done")
            ui.log.info("ui: stream-begin: end")
        })
        this.$on("stream-data", async (data) => {
            if (this.streaming)
                streamData(data)
        })
        this.$on("stream-reset", async () => {
            if (this.streaming) {
                ui.log.info("ui: stream-reset: begin")
                this.streaming = false
                await streamReset()
                this.streaming = true
                ui.log.info("ui: stream-reset: end")
            }
        })
        this.$on("stream-end", async () => {
            ui.log.info("ui: stream-end: begin")
            if (this.streaming) {
                this.streaming = false
                await streamEnd().catch(() => true)
            }
            this.$emit("stream-end:done")
            ui.log.info("ui: stream-end: end")
        })

        /*  allow rebooting on Video element or MediaSource errors  */
        this.$on("stream-reboot", async () => {
            ui.log.info("ui: stream-reboot: begin")
            this.streaming = false
            await streamEnd().catch(() => true)
            await streamBegin().catch(() => true)
            this.streaming = true
            ui.log.info("ui: stream-reboot: end")
        })
    }
}
</script>

