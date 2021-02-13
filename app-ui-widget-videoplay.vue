<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
**
-->

<template>
    <div v-bind:style="style" class="videoplay">
        <!-- <video> container -->
        <video ref="video" class="video"></video>

        <!-- info overlay -->
        <div ref="info" class="info-layer">
            <i class="fas fa-circle"></i> &nbsp; {{ $t("videoplay.replay-label") }}
        </div>

        <!-- control overlay -->
        <div class="control-layer">
            <div class="control-bar">
                <div class="control-row">
                    <!--  play/pause button  -->
                    <div class="pause" v-on:click="togglePaused">
                        <span v-show="paused"><i class="icon fas fa-play"></i></span>
                        <span v-show="!paused"><i class="icon fas fa-pause"></i></span>
                    </div>

                    <!--  timing information  -->
                    <div class="timing">
                        {{ timeWhen }} &nbsp;&nbsp; {{ timeDuration }} / {{ timeTotal }}
                    </div>

                    <!--  playrate button row  -->
                    <div class="playrate">
                        <div class="playrate-button" v-bind:class="{ active: playrate === 0.5 }" v-on:click="playrate = 0.5">0.5x</div>
                        <div class="playrate-button" v-bind:class="{ active: playrate === 0.6 }" v-on:click="playrate = 0.6">0.6x</div>
                        <div class="playrate-button" v-bind:class="{ active: playrate === 0.7 }" v-on:click="playrate = 0.7">0.7x</div>
                        <div class="playrate-button" v-bind:class="{ active: playrate === 0.8 }" v-on:click="playrate = 0.8">0.8x</div>
                        <div class="playrate-button" v-bind:class="{ active: playrate === 0.9 }" v-on:click="playrate = 0.9">0.9x</div>
                        <div class="playrate-button" v-bind:class="{ active: playrate === 1.0 }" v-on:click="playrate = 1.0">1.0x</div>
                        <div class="playrate-button" v-bind:class="{ active: playrate === 1.1 }" v-on:click="playrate = 1.1">1.1x</div>
                        <div class="playrate-button" v-bind:class="{ active: playrate === 1.2 }" v-on:click="playrate = 1.2">1.2x</div>
                        <div class="playrate-button" v-bind:class="{ active: playrate === 1.3 }" v-on:click="playrate = 1.3">1.3x</div>
                        <div class="playrate-button" v-bind:class="{ active: playrate === 1.4 }" v-on:click="playrate = 1.4">1.4x</div>
                        <div class="playrate-button" v-bind:class="{ active: playrate === 1.5 }" v-on:click="playrate = 1.5">1.5x</div>
                    </div>
                </div>
                <div class="control-row">
                    <!--  timeline  -->
                    <div class="timeline" ref="timeline"
                        v-on:mousedown.capture.stop="positioningStart"
                        v-on:mousemove.capture.stop="positioningMove"
                        v-on:mouseup.capture.stop="positioningEnd"
                        v-on:mouseout.capture.stop="positioningOut">
                        <div ref="timelineDuration" class="timeline-duration"></div>
                        <div ref="timelineCursor" class="timeline-cursor"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.videoplay {
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

    /*  video element  */
    .video {
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

    /*  info element  */
    .info-layer {
        position: absolute;
        top: 10px;
        left: 10px;
        text-align: center;
        color: #ff0000;
        font-weight: bold;
        border: 2px solid #ff0000;
        border-radius: 4px;
        padding: 2px 8px 2px 8px;
        opacity: 0.80;
    }

    /*  playrate element  */
    .control-layer {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: auto;
        opacity: 0.0;
        transition: 0.5s;
        &:hover {
            opacity: 0.8;
        }
        .control-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            background-color: var(--color-std-bg-1);
            width: 100%;
            height: auto;
            display: flex;
            flex-direction: column;
            .control-row {
                margin-top: 10px;
                width: 100%;
                height: auto;
                display: flex;
                flex-direction: row;
                justify-items: space-between;
                position: relative;
                .pause {
                    width: 30px;
                    margin-left: 10px;
                    margin-right: 10px;
                    font-size: 10pt;
                    text-align: center;
                    border-radius: 2px;
                    padding-left: 4px;
                    padding-right: 4px;
                    color: var(--color-std-fg-3);
                    &:hover {
                        background-color: var(--color-std-fg-1);
                        color: var(--color-std-bg-1);
                    }
                }
                .timing {
                    flex-grow: 1;
                    font-size: 10pt;
                    color: var(--color-std-fg-3);
                }
                .playrate {
                    display: flex;
                    flex-direction: row;
                    justify-items: flex-start;
                    font-size: 10pt;
                    margin-right: 10px;
                    .playrate-button {
                        color: var(--color-std-fg-3);
                        padding-left: 4px;
                        padding-right: 4px;
                        border-radius: 2px;
                        margin-left: 4px;
                        &:hover {
                            background-color: var(--color-std-fg-1);
                            color: var(--color-std-bg-1);
                        }
                        &.active {
                            background-color: var(--color-std-fg-3);
                            color: var(--color-std-bg-1);
                        }
                    }
                }
                .timeline {
                    position: relative;
                    width: 100%;
                    background-color: var(--color-std-bg-5);
                    margin-left: 10px;
                    margin-right: 10px;
                    margin-bottom: 10px;
                    height: 8px;
                    border-radius: 2px;
                    .timeline-duration {
                        pointer-events: none;
                        position: absolute;
                        top: 0;
                        left: 0;
                        background-color: var(--color-acc-fg-1);
                        border-radius: 2px;
                        height: 8px;
                    }
                    .timeline-cursor {
                        pointer-events: none;
                        position: absolute;
                        top: 0;
                        background-color: var(--color-std-fg-5);
                        border-radius: 2px;
                        width: 12px;
                        height: 8px;
                    }
                }
            }
        }
    }
}
</style>

<script>
module.exports = {
    name: "videoplay",

    /*  component static properties  */
    props: {
        volume: { type: Number,  default: 100 },
        muted:  { type: Boolean, default: false },
        device: { type: String,  default: "" }
    },

    /*  component variable properties  */
    data: function () {
        return {
            intVolume: this.volume ? this.volume : 100,
            intMuted:  this.muted  ? this.muted  : false,
            intDevice: this.device ? this.device : "",
            paused: false,
            timeWhen: "0000-00-00 00:00:00",
            timeDuration: "00:00",
            timeTotal: "00:00",
            playrate: 1.00,
            positioning: false,
            positioningPausedBefore: false
        }
    },

    /*  component computed properties  */
    computed: {
        style: ui.vueprop2cssvar()
    },

    /*  component property observation  */
    watch: {
        intVolume: function (v) {
            this.$refs.video.volume = v / 100
        },
        intMuted: function (v) {
            this.$refs.video.muted = v
        },
        intDevice: function (v) {
            this.$refs.video.setSinkId(v)
        },
        playrate: function (v) {
            this.$refs.video.playbackRate = this.playrate
        },
        paused: function (v) {
            if (v)
                this.$refs.video.pause()
            else
                this.$refs.video.play()
        }
    },

    /*  internal methods  */
    methods: {
        togglePaused () {
            this.paused = !this.paused
        },
        positioningStart () {
            this.positioning = true
            this.positioningPausedBefore = this.paused
            this.paused = true
        },
        positioningMove (ev) {
            if (!this.positioning)
                return
            this.positionUpdate(ev)
        },
        positioningEnd (ev) {
            if (!this.positioning)
                return
            this.positionUpdate(ev)
            this.positioning = false
            this.paused = this.positioningPausedBefore
        },
        positioningOut (ev) {
            if (!this.positioning)
                return
            this.positioning = false
            this.paused = this.positioningPausedBefore
        },
        positionUpdate (ev) {
            const max = ev.target.clientWidth
            let pos = ev.offsetX
            if (pos < 0)
                pos = 0
            else if (pos > max)
                pos = max
            this.$refs.video.currentTime = (pos / max) * this.$refs.video.duration
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

        /*  local state  */
        let hls = null
        let animation = null

        /*  start playing  */
        this.$on("play-begin", async (info) => {
            /*  determine information  */
            const { time } = await ui.recordingInfo(info.recording)

            /*  configure <video> element  */
            const ve = this.$refs.video
            ve.disablePictureInPicture = true
            ve.disableRemotePlayback   = true
            ve.loop = false

            /*  provide a custom Hls.js loader  */
            class CustomLoader extends Hls.DefaultConfig.loader {
                load (context, config, callbacks) {
                    /*  determine recording id and artifact name   */
                    const m = context.url.match(/^app:\/\/-\/([^/]+)\/(.+)$/)
                    if (m === null)
                        callbacks.onError(new Error("invalid url"), context, null)
                    const recording = m[1]
                    const artifact  = m[2]

                    /*  load the artifact via IPC  */
                    const now = Date.now()
                    const stats = { trequest: now, tfirst: now }
                    ui.recordingArtifact(recording, artifact, context.responseType).then((result) => {
                        stats.tload  = Date.now()
                        stats.loaded = result.data.length
                        stats.total  = result.data.length
                        callbacks.onSuccess({ url: context.url, data: result.data }, stats, context, null)
                    }).catch((err) => {
                        callbacks.onError({ code: 500, text: err.toString() }, context, null)
                    })
                }
                abort   () {}
                destroy () {}
            }

            /*  create a new Hls.js instance and attach it to the <video> element  */
            hls = new Hls({
                loader: CustomLoader,
                autoStartLoad: true,
                debug: false
            })
            hls.attachMedia(ve)
            hls.on(Hls.Events.ERROR, (ev, data) => {
                let err = ""
                if (typeof data === "object" && typeof data.reason === "string")
                    err = data.reason
                else
                    err = JSON.stringify(data)
                ui.log.error(`ui: videoplay: hls: ERROR: ${err}`)
            })

            /*  once it is attached, load the manifest and play the media  */
            hls.on(Hls.Events.MEDIA_ATTACHED, (ev) => {
                hls.loadSource(info.url)
                hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    ve.playbackRate = 1.00
                    ve.play()
                })
            })

            /*  track <video> element informations  */
            ve.addEventListener("timeupdate", () => {
                this.timeWhen = dayjs(time).add(ve.currentTime, "second").format("YYYY-MM-DD HH:mm")
                this.timeDuration = dayjs.utc(ve.currentTime * 1000).format("HH:mm:ss")
                const percent = (100 * (ve.currentTime / ve.duration)) + "%"
                this.$refs.timelineDuration.style.width = percent
                this.$refs.timelineCursor.style.left = percent
            })
            ve.addEventListener("durationchange", () => {
                this.timeTotal = dayjs.utc(ve.duration * 1000).format("HH:mm:ss")
            })
            ve.addEventListener("ended", () => {
                this.paused = true
            })

            /*  animate info layer  */
            animation = anime({
                targets:   this.$refs.info,
                duration:  2 * 1000,
                easing:    "easeInOutQuad",
                autoplay:  true,
                loop:      true,
                delay:     0,
                direction: "alternate",
                opacity:   [ 0, 1 ]
            })
        })

        /*  end playing  */
        this.$on("play-end", async () => {
            const ve = this.$refs.video
            ve.pause()
            if (hls !== null)
                hls.destroy()
            if (animation !== null)
                animation.pause()
        })
    }
}
</script>

