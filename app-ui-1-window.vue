<!--
**
**  Live Video Experience (LiVE)
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
    <div v-if="loaded" v-bind:style="style" class="win" v-on:mousemove="resizeMove" v-on:mouseup="resizeEnd">
        <div ref="header" class="header">
            <div class="box button logout" v-on:click="logout" v-bind:class="{ disabled: inLogin || !allowDisconnect }">
                <i class="icon fa fa-arrow-alt-circle-left"></i>
                <span class="title">Disconnect</span>
            </div>
            <!--
            <div class="box button small" v-on:click="resolution('480p')" v-bind:class="{ active: resolutionId === '480p', disabled: inLogin }">
                <span class="word">480p</span>
                <span class="title">Small-Res</span>
            </div>
            <div class="box button medium" v-on:click="resolution('720p')" v-bind:class="{ active: resolutionId === '720p', disabled: inLogin }">
                <span class="word">720p</span>
                <span class="title">Medium-Res</span>
            </div>
            <div class="box button large" v-on:click="resolution('1080p')" v-bind:class="{ active: resolutionId === '1080p', disabled: inLogin }">
                <span class="word">1080p</span>
                <span class="title">Large-Res</span>
            </div>
            <div class="box slider buffer" v-bind:class="{ disabled: inLogin }">
                <input ref="buffer"
                    v-bind:disabled="inLogin"
                    class="buffer"
                    type="range"
                    min="500" max="2500" step="500"
                    v-model="buffer"/>
                <span class="title">Stream Buffer</span>
            </div>
            <div class="box slider volume" v-bind:class="{ disabled: inLogin }">
                <input ref="volume"
                    v-bind:disabled="inLogin"
                    class="volume"
                    type="range"
                    min="0" max="100"
                    v-model="volume"/>
                <span class="title">Audio Volume</span>
            </div>
            -->
            <div class="box bandwidth" v-bind:class="{ disabled: inLogin, active: !inLogin }">
                <span class="word">{{ bandwidthText }}</span>
                <span class="title">kbps</span>
            </div>
            <div class="box logo">
                <img v-bind:src="logo" alt="LiVE"/>
                <span class="title">Receiver</span>
            </div>
            <div class="box move">
                <span class="grab grab-1"></span>
                <span class="grab grab-2"></span>
                <span class="grab grab-3"></span>
                <span class="grab grab-4"></span>
                <span class="grab grab-5"></span>
                <!-- <span class="name">Receiver</span> -->
                <span class="title">Move Window</span>
            </div>
            <div class="box button fit" v-on:click="sourceSize" v-bind:class="{ disabled: inLogin || fullscreened }">
                <i class="icon fa fa-expand"></i>
                <span class="title">Source-Size</span>
            </div>
            <div class="box button minimize" v-on:click="minimize" v-bind:class="{ disabled: fullscreened }">
                <i class="icon fa fa-window-minimize"></i>
                <span class="title">Min-Size</span>
            </div>
            <div class="box button maximize" v-on:click="maximize" v-bind:class="{ disabled: fullscreened }">
                <i class="icon fa fa-window-maximize"></i>
                <span class="title">Max-Size</span>
            </div>
            <div class="box button fullscreen" v-on:click="fullscreen" v-bind:class="{ active: fullscreened }">
                <i class="icon fa fa-expand-arrows-alt"></i>
                <span class="title">Fullscreen</span>
            </div>
            <div class="box button quit" v-on:click="quit">
                <i class="icon fa fa-times"></i>
                <span class="title">Quit</span>
            </div>
        </div>
        <div ref="content" class="content">
            <div ref="video"
                v-bind:style="{ width: videoSize.w + 'px', height: videoSize.h + 'px'}"
                v-show="!inLogin"
                class="video">
                <videostream
                    ref="videostream"
                />
            </div>
            <div v-show="inLogin" class="login">
                <login
                    ref="login"
                    v-bind:person-portrait.sync="personPortrait"
                    v-bind:person-name.sync="personName"
                    v-bind:live-relay-server.sync="liveRelayServer"
                    v-bind:live-access-token.sync="liveAccessToken"
                    v-on:login="login"
                />
            </div>
        </div>
        <div ref="footer" class="footer">
            <div class="box message-icon" v-bind:class="{ disabled: inLogin }">
                <i class="icon fa fa-comment-dots"></i>
            </div>
            <div class="box message-text" v-bind:class="{ disabled: inLogin }">
                <input
                    v-bind:disabled="inLogin"
                    ref="message"
                    type="text"
                    placeholder="Type your message to the trainer here..."
                    v-model="message"
                    v-on:keyup.enter="sendMessage"
                    v-on:keyup.escape="clearMessage"
                />
            </div>
            <div class="box button message-send" v-on:click="sendMessage" v-bind:class="{ disabled: inLogin }">
                <i class="icon fa fa-share"></i>
                <span class="title">Send Message</span>
            </div>
            <!--
            <div class="box button resize"
                v-on:mousedown="resizeBegin"
                v-on:mousemove="resizeMove"
                v-bind:class="{ disabled: fullscreened }"
            >
                <i class="icon fa fa-expand-alt"></i>
                <span class="title">Re-Size</span>
            </div>
            -->
        </div>
    </div>
</template>

<style lang="less" scoped>
.win {
    height: 100vh;
    width:  100vw;
    -webkit-user-select: none;
    user-select: none;
    cursor: default;
    background-color: var(--color-std-bg-3);
    border-radius: 5px;
    color: var(--color-std-fg-3);
    font-family: "TypoPRO Source Sans Pro";
    font-size: 10pt;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;
    .box {
        width: 55px;
        height: 100%;
        position: relative;
        background-color:        var(--color-std-bg-3);
        border-top:    1px solid var(--color-std-bg-5);
        border-left:   1px solid var(--color-std-bg-5);
        border-right:  1px solid var(--color-std-bg-1);
        border-bottom: 1px solid var(--color-std-bg-1);
        .icon {
            position: absolute;
            font-size: 16pt;
            width: 100%;
            text-align: center;
            left: 0;
            top: 2px;
            color: var(--color-std-fg-3);
        }
        .name {
            position: absolute;
            font-size: 12pt;
            width: 100%;
            text-align: center;
            left: 0;
            top: 3px;
            color: var(--color-std-fg-3);
            text-shadow:
                -5px 0   5px var(--color-std-bg-3),
                 0   5px 5px var(--color-std-bg-3),
                 5px 0   5px var(--color-std-bg-3),
                 0  -5px 5px var(--color-std-bg-3);
        }
        .word {
            position: absolute;
            font-size: 12pt;
            width: 100%;
            text-align: center;
            left: 0;
            top: 2px;
            color: var(--color-std-fg-3);
        }
        .title {
            position: absolute;
            font-size: 6pt;
            width: 100%;
            text-align: center;
            left: 0;
            bottom: 2px;
            color: var(--color-std-fg-1);
        }
        &.active {
            background-color:        var(--color-acc-bg-3);
            border-top:    1px solid var(--color-acc-bg-5);
            border-left:   1px solid var(--color-acc-bg-5);
            border-right:  1px solid var(--color-acc-bg-1);
            border-bottom: 1px solid var(--color-acc-bg-1);
            .icon  { color:          var(--color-acc-fg-3); }
            .word  { color:          var(--color-acc-fg-3); }
            .title { color:          var(--color-acc-fg-1); }
        }
    }
    .button {
        &:hover {
            background-color:        var(--color-sig-bg-3);
            border-top:    1px solid var(--color-sig-bg-5);
            border-left:   1px solid var(--color-sig-bg-5);
            border-right:  1px solid var(--color-sig-bg-1);
            border-bottom: 1px solid var(--color-sig-bg-1);
            .icon  { color:          var(--color-sig-fg-3); }
            .word  { color:          var(--color-sig-fg-3); }
            .title { color:          var(--color-sig-fg-1); }
        }
        &.disabled {
            background-color:        var(--color-std-bg-3);
            border-top:    1px solid var(--color-std-bg-5);
            border-left:   1px solid var(--color-std-bg-5);
            border-right:  1px solid var(--color-std-bg-1);
            border-bottom: 1px solid var(--color-std-bg-1);
            .icon  { color:          var(--color-std-fg-1); }
            .word  { color:          var(--color-std-fg-1); }
            .title { color:          var(--color-std-fg-1); }
        }
    }
    .slider {
        width: 100px;
        input[type="range"] {
            position: absolute;
            width: calc(100% - 8px);
            left: 3px;
            top: 4px;
            color: var(--color-acc-fg-3);
            -webkit-appearance: none;
            background-color: var(--color-std-bg-3);
            outline: none;
            &::-webkit-slider-thumb {
                -webkit-appearance: none;
                height: 14px;
                width: 14px;
                border-radius: 10px;
                background-color: var(--color-std-fg-2);
                border-top:    1px solid var(--color-std-fg-3);
                border-left:   1px solid var(--color-std-fg-3);
                border-right:  1px solid var(--color-std-fg-1);
                border-bottom: 1px solid var(--color-std-fg-1);
                cursor: pointer;
            }
            &::-webkit-slider-runnable-track {
                -webkit-appearance: none;
                border-radius: 10px;
                background-color: var(--color-std-bg-3);
                border-top:    1px solid var(--color-std-bg-1);
                border-left:   1px solid var(--color-std-bg-1);
                border-right:  1px solid var(--color-std-bg-5);
                border-bottom: 1px solid var(--color-std-bg-5);
            }
        }
    }
    .header {
        width: 100vw;
        height: 36px;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        .move {
            -webkit-app-region: drag;
            -webkit-user-select: none;
            flex-grow: 1;
            padding-top: 6px;
            height: calc(100% - 6px);
            position: relative;
            .name {
            }
            .grab {
                height: 1px;
                width: calc(100% - 40px);
                margin: 0px 20px 0px 20px;
                display: block;
                border-top:    1px solid var(--color-std-bg-1);
                border-bottom: 1px solid var(--color-std-bg-5);
            }
            &:hover {
                cursor: grab;
            }
        }
        .logo {
            position: relative;
            img {
                position: absolute;
                top: 6px;
                left: 14px;
                width: 55%;
            }
        }
    }
    .content {
        flex-grow: 1;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }
    .footer {
        width: 100vw;
        height: 36px;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        overflow: hidden;
        .message-icon {
            .icon {
                top: 7px;
            }
        }
        .message-text {
            flex-grow: 1;
            input {
                width: calc(100% - 20px);
                height: 100%;
                font-size: 14pt;
                border: 0;
                color:                   var(--color-std-fg-3);
                background-color:        var(--color-std-bg-3);
                border-top:    1px solid var(--color-std-bg-1);
                border-left:   1px solid var(--color-std-bg-1);
                border-right:  1px solid var(--color-std-bg-5);
                border-bottom: 1px solid var(--color-std-bg-5);
                padding: 0px 10px 4px 10px;
                position: relative;
                &::placeholder {
                    color: var(--color-std-fg-1);
                    font-size: 10pt;
                    position: relative;
                    top: -4px;
                }
                &:focus {
                    border: 0;
                    outline: none;
                    color:                   var(--color-sig-fg-5);
                    background-color:        var(--color-sig-bg-3);
                    border-top:    1px solid var(--color-sig-bg-1);
                    border-left:   1px solid var(--color-sig-bg-1);
                    border-right:  1px solid var(--color-sig-bg-5);
                    border-bottom: 1px solid var(--color-sig-bg-5);
                    &::placeholder {
                        color:               var(--color-sig-fg-1);
                    }
                }
            }
        }
        .resize {
            .icon {
                cursor: grab;
                transform: rotate(-90deg);
            }
        }
    }
}
</style>

<script>
module.exports = {
    name: "win",
    data: () => ({
        loaded:          false,
        inLogin:         true,
        allowDisconnect: true,
        personPortrait:  "",
        personName:      "",
        liveRelayServer: "",
        liveAccessToken: "",
        logo:            ui.logo,
        buffer:          2000,
        message:         "",
        resizing:        false,
        resizingPos:     { x: 0, y: 0 },
        fullscreened:    false,
        volume:          100,
        bandwidthBytes:  0,
        bandwidthText:   "",
        videoSize:       { w: 0, h: 0 },
        resolutionId:    "1080p",
        resolutions: {
            "480p":  { w:  854, h:  480 },
            "720p":  { w: 1280, h:  720 },
            "1080p": { w: 1920, h: 1080 }
        }
    }),
    computed: {
        style: ui.vueprop2cssvar()
    },
    watch: {
        buffer: ui.debounce(1000, false, function (v) {
            this.$emit("stream-buffering", v)
        }),
        resolutionId: ui.debounce(1000, false, function (v) {
            this.$emit("video-resolution", v)
        }),
        volume: function (v) {
            this.$refs.videostream.$emit("volume", v / 100)
        },
        personPortrait:   function (v) { ui.settings("person-portrait", v) },
        personName:       function (v) { ui.settings("person-name", v) },
        liveRelayServer:  function (v) { ui.settings("live-relay-server", v) },
        liveAccessToken:  function (v) { ui.settings("live-access-token", v) },
        liveStreamBuffer: function (v) { ui.settings("live-stream-buffer", v) }
    },
    components: {
        "login":       "url:app-ui-2-widget-login.vue",
        "videostream": "url:app-ui-4-widget-videostream.vue"
    },
    methods: {
        sendMessage () {
            if (this.message !== "") {
                this.$emit("message", this.message)
                this.message = ""
            }
            this.$refs.message.blur()
        },
        clearMessage () {
            this.message = ""
            this.$refs.message.blur()
        },
        login () {
            if (!this.inLogin)
                return
            this.$emit("login", {
                personPortrait:  this.personPortrait,
                personName:      this.personName,
                liveRelayServer: this.liveRelayServer,
                liveAccessToken: this.liveAccessToken
            })
        },
        logout () {
            if (this.inLogin)
                return
            if (!this.allowDisconnect)
                return
            this.allowDisconnect = true
            this.$emit("logout")
        },
        resizeBegin (event) {
            if (this.fullscreened || this.resizing)
                return
            this.resizing = true
            this.resizingPos.x = event.screenX
            this.resizingPos.y = event.screenY
        },
        resizeMove (event) {
            if (this.fullscreened || !this.resizing)
                return
            if (this.resizingPos.x === event.screenX && this.resizingPos.y === event.screenY)
                return
            const diffX = event.screenX - this.resizingPos.x
            const diffY = event.screenY - this.resizingPos.y
            this.$emit("resize", { x: diffX, y: diffY })
            this.resizingPos.x = event.screenX
            this.resizingPos.y = event.screenY
        },
        resizeEnd (event) {
            if (this.fullscreened || !this.resizing)
                return
            this.resizing = false
        },
        minimize (event) {
            if (this.fullscreened)
                return
            this.$emit("minimize")
        },
        maximize (event) {
            if (this.fullscreened)
                return
            this.$emit("maximize")
        },
        fullscreen (event) {
            this.$emit("fullscreen")
            this.fullscreened = !this.fullscreened
        },
        sourceSize () {
            if (this.fullscreened || this.inLogin)
                return
            const res = this.resolutions[this.resolutionId]
            let w = res.w
            let h = res.h
            h += this.$refs.header.clientHeight
            h += this.$refs.footer.clientHeight
            w += 2 * 20
            h += 2 * 20
            this.$emit("set-size", { w, h })
        },
        handleResize () {
            if (this.$refs.content === undefined) {
                setTimeout(this.handleResize, 10)
                return
            }
            const vw = this.$refs.content.clientWidth  - 2 * 10
            const vh = this.$refs.content.clientHeight - 2 * 10
            const vr = vw / vh
            const r = this.resolutions[this.resolutionId]
            const dr = r.w / r.h
            let dw, dh
            if (vr > dr) {
                dh = vh
                dw = dh * dr
            }
            else {
                dw = vw
                dh = dw / dr
            }
            this.videoSize.w = dw
            this.videoSize.h = dh
        },
        resolution (id) {
            this.resolutionId = id
        },
        quit () {
            this.$emit("quit")
        }
    },
    async created () {
        this.personPortrait   = await ui.settings("person-portrait"),
        this.personName       = await ui.settings("person-name"),
        this.liveRelayServer  = await ui.settings("live-relay-server"),
        this.liveAccessToken  = await ui.settings("live-access-token"),
        this.liveStreamBuffer = await ui.settings("live-stream-buffer")
        this.loaded = true
    },
    mounted () {
        this.$on("login-error", (error) => {
            this.$refs.login.$emit("error", error)
        })
        this.$on("state", (state) => {
            if (state === "login")
                this.inLogin = true
            else if (state === "video")
                this.inLogin = false
        })

        this.$on("stream-begin", () => {
            this.$refs.videostream.$emit("stream-begin")
            this.allowDisconnect = false
        })
        setTimeout(() => {
            this.$refs.videostream.$on("stream-begin:done", () => {
                this.allowDisconnect = true
            })
        }, 400)
        this.$on("stream-data", (data) => {
            this.bandwidthBytes += data.buffer.byteLength
            this.$refs.videostream.$emit("stream-data", data)
        })
        const interval = 2
        setInterval(() => {
            const kbps = Math.ceil((this.bandwidthBytes * 8) / 1024 / interval)
            this.bandwidthText = kbps
            this.bandwidthBytes = 0
        }, interval * 1000)
        this.$on("stream-end", () => {
            this.allowDisconnect = false
            this.$refs.videostream.$emit("stream-end")
        })

        window.addEventListener("resize", () => this.handleResize())
        this.$nextTick(() => {
            this.handleResize()
        })

    },
    beforeDestroy () {
        window.removeEventListener("resize", () => this.handleResize())
    }
}
</script>

