<!--
**
**  Live ~~ Live Video-Streaming Frontend
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
**
-->

<template>
    <div v-bind:style="style" class="videostream">
        <div ref="stream"
            class="stream"
            v-show="state === 'playing' || state === 'stalled'">
        </div>
        <div class="overlay"
            v-show="state !== 'playing'">
            <div ref="overlayIcon" class="icon">
                <div v-show="state === 'started'"><i class="icon fa fa-play-circle"></i></div>
                <div v-show="state === 'stalled'"><i class="icon fa fa-pause-circle"></i></div>
                <div v-show="state === 'stopped'"><i class="icon fa fa-stop-circle"></i></div>
            </div>
            <div class="text">
                <div v-show="state === 'started'">Video-Stream Started<br/>(awaiting to receive stream data)</div>
                <div v-show="state === 'stalled'" >Video-Stream Stalled<br/>(awaiting to receive stream data again)</div>
                <div v-show="state === 'stopped'">Video-Stream Stopped</div>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.videostream {
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
        }
    }
}
</style>

<script>
module.exports = {
    name: "videostream",
    props: {
        volume: 100
    },
    data: () => ({
        state:     "stalled",
        intVolume: this.volume
    }),
    computed: {
        style: ui.vueprop2cssvar()
    },
    watch: {
        intVolume: function (v) {
            this.$refs.stream.volume = v
        }
    },
    methods: {
    },
    mounted () {
        /*  allow volume to be adjusted  */
        this.$on("volume", (volume) => {
            this.intVolume = volume
        })

        /*  animate the two icons  */
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
        const queue = []
        let timer = null
        const updating = {}

        /*  start a new stream  */
        const streamBegin = () => {
            this.state = "started"

            /*   create a fresh <video> stream element  */
            let ve = document.createElement("video")
            this.we.appendChild(ve)
            ve.autoplay = true
            ve.addEventListener("loadeddata", () => {
                console.log("videoelement: loadeddata")
            })
            ve.addEventListener("canplay", () => {
                console.log("videoelement: canplay")
            })
            ve.addEventListener("progress", () => {
                console.log("videoelement: progress")
            })
            ve.addEventListener("playing", () => {
                console.log("videoelement: playing")
                this.state = "playing"
            })
            ve.addEventListener("stalled", () => {
                console.log("videoelement: stalled")
                this.state = "stalled"
            })
            ve.addEventListener("waiting", () => {
                console.log("videoelement: waiting")
                this.state = "stalled"
            })
            ve.addEventListener("ended", () => {
                console.log("videoelement: ended")
                this.state = "stopped"
            })
            ve.addEventListener("error", (ev, err) => {
                this.$emit("error", `HTMLMediaElement: ${ev}: ${err}`)
                console.log("videoelement: error", err)
                this.state = "stalled"
            })
            this.ve = ve

            /*   attach a MediaSource to the <video> stream element  */
            const ms = new MediaSource()
            ve.src = window.URL.createObjectURL(ms)
            ms.addEventListener("sourceopen", (ev) => {
                console.log("mediasource: sourceopen")
            })
            ms.addEventListener("sourceended", (ev) => {
                console.log("mediasource: sourceended")
            })
            ms.addEventListener("sourceclose", (ev) => {
                console.log("mediasource: sourceclose")
            })
            ms.addEventListener("error", (ev) => {
                this.$emit("error", `MediaSource: ${ev}`)
                console.log("mediasource: error", ev)
            })
            this.ms = ms
        }

        /*  receive stream data  */
        const streamData = (data) => {
            /*  transfer a stream data chunk into the <video> stream element  */
            const transfer = () => {
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
                        timer = setTimeout(transfer, 1000 / 30 /* = 1s/30fps */)
                    }
                    else if (this.sb[id] !== undefined && queue.length > 0) {
                        /*  feed new data  */
                        const data = queue.shift()
                        if (this.streaming) {
                            updating[data.id] = true
                            this.sb[data.id].appendBuffer(data.buffer)
                        }
                    }
                }
            }

            /*  on-the-fly create SourceBuffer  */
            if (this.sb[data.id] === undefined) {
                if (!MediaSource.isTypeSupported(data.user.mimeCodec))
                    this.$emit("error", `unknown codec "${data.user.mimeCodec}" -- ignoring stream data`)
                else {
                    this.sb[data.id] = this.ms.addSourceBuffer(data.user.mimeCodec)
                    this.sb[data.id].addEventListener("updatestart", () => {
                        updating[data.id] = true
                    })
                    this.sb[data.id].addEventListener("updateend", () => {
                        updating[data.id] = false

                        /*  flush perhaps still pending data  */
                        transfer()
                    })
                    this.sb[data.id].addEventListener("abort", () => {
                        this.$emit("error", "SourceBuffer: abort")
                        updating[data.id] = false
                    })
                    this.sb[data.id].addEventListener("error", (event, err) => {
                        this.$emit("error", `SourceBuffer: ${err}`)
                        updating[data.id] = false
                    })
                }
            }

            /*  queue stream data  */
            queue.push(data)

            /*  flush pending data  */
            transfer()
        }

        /*  end a stream  */
        const streamEnd = () => {
            if (this.ms !== null) {
                this.ms.endOfStream()
                for (const id of Object.keys(this.sb)) {
                    this.ms.removeSourceBuffer(this.sb[id])
                    delete this.sb[id]
                }
                this.ms = null
            }
            this.ve.removeAttribute("src")
            this.ve.load()
            this.we.removeChild(this.ve)
            this.ve = null
            this.state = "stopped"
        }

        /*  provide event entry hooks  */
        this.$on("stream-begin", () => {
            streamBegin()
            this.streaming = true
        })
        this.$on("stream-data", (data) => {
            if (!this.streaming)
                return
            streamData(data)
        })
        this.$on("stream-end", () => {
            if (!this.streaming)
                return
            streamEnd()
            this.streaming = false
        })
    }
}
</script>

