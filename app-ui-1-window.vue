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
    <div v-if="loaded" v-bind:style="style" class="win"
        v-on:mousemove="resizeMove" v-on:mouseup="resizeEnd">
        <!-- ---- HEADER ---- -->
        <div ref="header" class="header">
            <!-- disconnect -->
            <div class="box button logout" v-on:click="logout"
                v-bind:class="{ disabled: inLogin || !allowDisconnect }">
                <i class="icon fa fa-arrow-alt-circle-left"></i>
                <span class="title">Disconnect</span>
            </div>

            <!-- logo -->
            <div class="box logo">
                <img v-bind:src="logo" alt="LiVE"/>
                <span class="title">Receiver</span>
            </div>

            <!-- bandwidth -->
            <div class="box bandwidth"
                v-bind:class="{ disabled: inLogin, active: !inLogin }">
                <span class="word">{{ inLogin ? "---" : bandwidthText }}</span>
                <span class="title">kbps</span>
            </div>

            <!-- audio mute -->
            <div class="box button mute" v-on:click="volumeMute = !volumeMute"
                v-bind:class="{ disabled: inLogin, active: volume === 0 || volumeMute }">
                <span v-show="volumeMute"><i class="icon fa fa-volume-mute"></i></span>
                <span v-show="!volumeMute"><i class="icon fa fa-volume-up"></i></span>
                <span class="title">Volume Mute</span>
            </div>

            <!-- audio volume -->
            <div class="box slider volume" v-bind:class="{ disabled: inLogin }">
                <input ref="volume"
                    v-bind:disabled="inLogin"
                    class="volume"
                    type="range"
                    min="0" max="100"
                    v-model="volume"/>
                <span class="title">Audio Volume</span>
            </div>

            <!-- move window -->
            <div class="box move">
                <span class="grab grab-1"></span>
                <span class="grab grab-2"></span>
                <span class="grab grab-3"></span>
                <span class="grab grab-4"></span>
                <span class="grab grab-5"></span>
                <span class="title">Move Window</span>
            </div>

            <!-- source size -->
            <div class="box button fit" v-on:click="sourceSize"
                v-bind:class="{ disabled: inLogin || fullscreened }">
                <i class="icon fa fa-expand"></i>
                <span class="title">Source-Size</span>
            </div>

            <!-- minimize -->
            <div class="box button minimize" v-on:click="minimize"
                v-bind:class="{ disabled: fullscreened }">
                <i class="icon fa fa-window-minimize"></i>
                <span class="title">Min-Size</span>
            </div>

            <!-- maximize -->
            <div class="box button maximize" v-on:click="maximize"
                v-bind:class="{ disabled: fullscreened }">
                <i class="icon fa fa-window-maximize"></i>
                <span class="title">Max-Size</span>
            </div>

            <!-- fullscreen -->
            <div class="box button fullscreen" v-on:click="fullscreen"
                v-bind:class="{ active: fullscreened }">
                <i class="icon fa fa-expand-arrows-alt"></i>
                <span class="title">Fullscreen</span>
            </div>

            <!-- quit -->
            <div class="box button quit" v-on:click="quit">
                <i class="icon fa fa-times"></i>
                <span class="title">Quit</span>
            </div>
        </div>

        <!-- ---- CONTENT ---- -->
        <div ref="content" class="content">
            <!-- video stream -->
            <div ref="video"
                v-bind:style="{ width: videoSize.w + 'px', height: videoSize.h + 'px'}"
                v-show="!inLogin"
                class="video">
                <videostream
                    ref="videostream"
                />
            </div>

            <!-- login dialog -->
            <div v-show="inLogin" class="login">
                <login
                    ref="login"
                    v-bind:person-portrait.sync="personPortrait"
                    v-bind:person-name.sync="personName"
                    v-bind:live-relay-server.sync="liveRelayServer"
                    v-bind:live-access-token.sync="liveAccessToken"
                    v-bind:live-stream-resolution.sync="liveStreamResolution"
                    v-bind:live-stream-buffering.sync="liveStreamBuffering"
                    v-bind:audio-input-device.sync="audioInputDevice"
                    v-bind:audio-output-device.sync="audioOutputDevice"
                    v-on:login="login"
                />
            </div>
        </div>

        <!-- ---- FOOTER ---- -->
        <div ref="footer" class="footer">
            <!-- audio message icon -->
            <div class="box message-icon"
                v-bind:class="{ disabled: inLogin, active: audioBlob !== null }">
                <i class="icon fa fa-voicemail"></i>
                <span class="title">Audio Message</span>
            </div>

            <!-- audio record -->
            <div class="box button audio-record" v-on:click="audioRecord"
                v-bind:class="{ disabled: inLogin || audioInputDevice === '', active: audioRecording }">
                <i class="icon fa fa-dot-circle"></i>
                <span class="title">Record Message</span>
            </div>

            <!-- audio play -->
            <div class="box button audio-play" v-on:click="audioPlay"
                v-bind:class="{ disabled: inLogin || audioInputDevice === '' || audioBlob === null,
                    active: audioPlaying }">
                <i class="icon fa fa-play-circle"></i>
                <span class="title">Play Message</span>
            </div>

            <!-- message icon -->
            <div class="box message-icon" v-bind:class="{ disabled: inLogin, active: message !== '' }">
                <i class="icon fa fa-comment-dots"></i>
                <span class="title">Text Message</span>
            </div>

            <!-- enter message -->
            <div class="box message-text" v-bind:class="{ disabled: inLogin }">
                <input
                    v-bind:disabled="inLogin"
                    ref="message"
                    type="text"
                    placeholder="Type message..."
                    v-model="message"
                    v-on:keyup.enter="sendMessage"
                    v-on:keyup.escape="clearMessage(false)"
                />
            </div>

            <!-- clear message -->
            <div class="box button message-clear" v-on:click="clearMessage(true)"
                v-bind:class="{ disabled: inLogin || (audioBlob === null && message === '') }">
                <i class="icon fa fa-trash-alt"></i>
                <span class="title">Clear Messages</span>
            </div>

            <!-- send message -->
            <div class="box button message-send" v-on:click="sendMessage"
                v-bind:class="{ disabled: inLogin || (message === '' && audioBlob === null) }">
                <i class="icon fa fa-share"></i>
                <span class="title">Send Messages</span>
            </div>

            <!-- move window -->
            <div class="box move">
                <span class="grab grab-1"></span>
                <span class="grab grab-2"></span>
                <span class="grab grab-3"></span>
                <span class="grab grab-4"></span>
                <span class="grab grab-5"></span>
                <span class="title">Move Window</span>
            </div>

            <!-- send smile -->
            <div class="box button message-send" v-on:click="feedback('smile')"
                v-bind:class="{ disabled: inLogin }">
                <i class="icon fa fa-smile"></i>
                <span class="title">Show Smile</span>
            </div>

            <!-- send frown -->
            <div class="box button message-send" v-on:click="feedback('frown')"
                v-bind:class="{ disabled: inLogin }">
                <i class="icon fa fa-angry"></i>
                <span class="title">Show Frown</span>
            </div>

            <!-- challenge -->
            <div class="box slider challenge" v-bind:class="{ disabled: inLogin }"
                v-tooltip.top-center="{
                    html: true,
                    content: challengeText,
                    show: challengeTextShow && !inLogin,
                    trigger: 'manual',
                    hideOnTargetClick: false,
                    autoHide: false,
                    offset: 10
                }"
                v-on:mouseover="challengeTextShow = true"
                v-on:mouseleave="challengeTextShow = false">
                <input ref="challenge"
                    v-bind:class="[ 'challenge', 'range' + challenge ]"
                    v-bind:disabled="inLogin"
                    type="range"
                    min="1" max="5" step="1"
                    v-model="challenge"/>
                <span class="title">Show Challenge</span>
            </div>

            <!-- mood -->
            <div class="box slider mood" v-bind:class="{ disabled: inLogin }"
                v-tooltip.top-center="{
                    html: true,
                    content: moodText,
                    show: moodTextShow && !inLogin,
                    trigger: 'manual',
                    hideOnTargetClick: false,
                    autoHide: false,
                    offset: 10
                }"
                v-on:mouseover="moodTextShow = true"
                v-on:mouseleave="moodTextShow = false">
                <input ref="mood"
                    v-bind:class="[ 'mood', 'range' + mood ]"
                    v-bind:disabled="inLogin"
                    type="range"
                    min="1" max="5" step="1"
                    v-model="mood"/>
                <span class="title">Show Mood</span>
            </div>

            <!-- window resize (FIXME: still unused) -->
            <!--
            <div class="box button resize"
                v-on:mousedown="resizeBegin"
                v-on:mousemove="resizeMove"
                v-bind:class="{ disabled: fullscreened }">
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

    /*  header/footer box  */
    .box {
        width: 60px;
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

    /*  button widget  */
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

    /*  slider widget  */
    .slider {
        width: 100px;
        position: relative;
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
            &.challenge.range1,
            &.challenge.range5 {
                &::-webkit-slider-thumb {
                    background-color:        var(--color-sig-bg-4);
                    border-top:    1px solid var(--color-sig-bg-5);
                    border-left:   1px solid var(--color-sig-bg-5);
                    border-right:  1px solid var(--color-sig-bg-3);
                    border-bottom: 1px solid var(--color-sig-bg-3);
                }
            }
            &.challenge.range2,
            &.challenge.range4 {
                &::-webkit-slider-thumb {
                    background-color:        var(--color-sig-fg-2);
                    border-top:    1px solid var(--color-sig-fg-3);
                    border-left:   1px solid var(--color-sig-fg-3);
                    border-right:  1px solid var(--color-sig-fg-1);
                    border-bottom: 1px solid var(--color-sig-fg-1);
                }
            }
            &.mood.range1 {
                &::-webkit-slider-thumb {
                    background-color:        var(--color-sig-bg-4);
                    border-top:    1px solid var(--color-sig-bg-5);
                    border-left:   1px solid var(--color-sig-bg-5);
                    border-right:  1px solid var(--color-sig-bg-3);
                    border-bottom: 1px solid var(--color-sig-bg-3);
                }
            }
            &.mood.range2 {
                &::-webkit-slider-thumb {
                    background-color:        var(--color-sig-fg-2);
                    border-top:    1px solid var(--color-sig-fg-3);
                    border-left:   1px solid var(--color-sig-fg-3);
                    border-right:  1px solid var(--color-sig-fg-1);
                    border-bottom: 1px solid var(--color-sig-fg-1);
                }
            }
            &.mood.range3 {
                &::-webkit-slider-thumb {
                    background-color:        var(--color-std-fg-2);
                    border-top:    1px solid var(--color-std-fg-3);
                    border-left:   1px solid var(--color-std-fg-3);
                    border-right:  1px solid var(--color-std-fg-1);
                    border-bottom: 1px solid var(--color-std-fg-1);
                }
            }
            &.mood.range4 {
                &::-webkit-slider-thumb {
                    background-color:        var(--color-acc-fg-2);
                    border-top:    1px solid var(--color-acc-fg-3);
                    border-left:   1px solid var(--color-acc-fg-3);
                    border-right:  1px solid var(--color-acc-fg-1);
                    border-bottom: 1px solid var(--color-acc-fg-1);
                }
            }
            &.mood.range5 {
                &::-webkit-slider-thumb {
                    background-color:        var(--color-acc-bg-4);
                    border-top:    1px solid var(--color-acc-bg-5);
                    border-left:   1px solid var(--color-acc-bg-5);
                    border-right:  1px solid var(--color-acc-bg-3);
                    border-bottom: 1px solid var(--color-acc-bg-3);
                }
            }
        }
        &.mood {
            width: 70px;
        }
        &.challenge {
            width: 70px;
        }
    }

    /*  header area  */
    .header {
        width: 100vw;
        height: 36px;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
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

    /*  move window  */
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
    .header .move {
    }
    .footer .move {
        width: 150px;
        max-width: 150px;
    }

    /*  content area  */
    .content {
        flex-grow: 1;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }

    /*  footer area  */
    .footer {
        width: 100vw;
        height: 36px;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        overflow: hidden;
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

    /*  component variable properties  */
    data: () => ({
        loaded:               false,
        inLogin:              true,
        allowDisconnect:      true,
        personPortrait:       "",
        personName:           "",
        liveRelayServer:      "",
        liveAccessToken:      "",
        liveStreamResolution: "",
        liveStreamBuffering:  "",
        audioInputDevice:     "",
        audioOutputDevice:    "",
        logo:                 ui.logo,
        audioBlob:            null,
        audioBlobChunks:      [],
        audioRecording:       false,
        audioPlaying:         false,
        message:              "",
        resizing:             false,
        resizingPos:          { x: 0, y: 0 },
        fullscreened:         false,
        volume:               100,
        volumeMute:           false,
        mood:                 3,
        moodTextShow:         false,
        challenge:            3,
        challengeTextShow:    false,
        bandwidthBytes:       0,
        bandwidthText:        "",
        videoSize:            { w: 0, h: 0 }
    }),

    /*  component computed properties  */
    computed: {
        style: ui.vueprop2cssvar(),
        challengeText () {
            let html = "I am contentual<br/><b>"
            switch (parseInt(this.challenge)) {
                case 1: html += "sub-challenged";  break
                case 2: html += "less-challenged"; break
                case 3: html += "challenged";      break
                case 4: html += "much-challenged"; break
                case 5: html += "over-challenged"; break
            }
            html += "</b>!"
            return html
        },
        moodText () {
            let html = "I am mentally<br/><b>"
            switch (parseInt(this.mood)) {
                case 1: html += "knocked-off";   break
                case 2: html += "tired";         break
                case 3: html += "good";          break
                case 4: html += "refreshed";     break
                case 5: html += "excited";       break
            }
            html += "</b>!"
            return html
        }
    },

    /*  component properties observation  */
    watch: {
        volume: function (v) {
            this.$refs.videostream.$emit("volume", v)
            this.volumeMute = (v > 0)
        },
        volumeMute: function (v) {
            this.$refs.videostream.$emit("mute", v)
        },
        challenge: ui.debounce(2000, function (v) { this.sendFeeling() }),
        mood:      ui.debounce(2000, function (v) { this.sendFeeling() }),
        personPortrait:       function (v) { ui.settings("person-portrait", v) },
        personName:           function (v) { ui.settings("person-name", v) },
        liveRelayServer:      function (v) { ui.settings("live-relay-server", v) },
        liveAccessToken:      function (v) { ui.settings("live-access-token", v) },
        liveStreamResolution: function (v) { ui.settings("live-stream-resolution", v) },
        liveStreamBuffering:  function (v) { ui.settings("live-stream-buffering", v) },
        audioInputDevice:     function (v) { ui.settings("audio-input-device", v) },
        audioOutputDevice:    function (v) {
            ui.settings("audio-output-device", v)
            if (this.$refs.videostream)
                this.$refs.videostream.$emit("device", v)
        }
    },

    /*  component sub-components  */
    components: {
        "login":       "url:app-ui-2-widget-login.vue",
        "videostream": "url:app-ui-4-widget-videostream.vue"
    },

    /*  component methods  */
    methods: {
        /*  message handling  */
        async sendMessage () {
            if (this.message !== "" || this.audioBlob !== null) {
                const data = { message: this.message }
                if (this.audioBlob !== null) {
                    data.audio = await new Promise((resolve, reject) => {
                        const fr = new FileReader()
                        fr.addEventListener("load", () => {
                            resolve(fr.result)
                        })
                        fr.readAsDataURL(this.audioBlob)
                    })
                }
                this.$emit("message", data)
                this.message = ""
                this.audioBlob = null
            }
            this.$refs.message.blur()
        },
        clearMessage (withAudio) {
            this.message = ""
            if (withAudio)
                this.audioBlob = null
            this.$refs.message.blur()
        },
        feedback (type) {
            this.$emit("feedback", type)
        },
        sendFeeling () {
            this.$emit("feeling", {
                challenge: this.challenge,
                mood:      this.mood
            })
        },

        /*  login/connect and logout/disconnect handling  */
        login () {
            if (!this.inLogin)
                return
            this.$emit("login", {
                personPortrait:       this.personPortrait,
                personName:           this.personName,
                liveRelayServer:      this.liveRelayServer,
                liveAccessToken:      this.liveAccessToken,
                liveStreamResolution: this.liveStreamResolution,
                liveStreamBuffering:  this.liveStreamBuffering,
                audioInputDevice:     this.audioInputDevice,
                audioOutputDevice:    this.audioOutputDevice
            })
        },
        logout () {
            if (this.inLogin)
                return
            if (!this.allowDisconnect)
                return
            this.allowDisconnect = false
            this.$emit("logout")
        },
        quit () {
            this.$emit("quit")
        },

        /*  window resize handling  */
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
            const res = { w: 1920, h: 1080 } // hardcoded
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
            const dr = 1920 / 1080
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

        /*  audio recording handling  */
        async audioRecord () {
            if (!this.audioRecording) {
                /*  start recording  */
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: { deviceId: this.audioInputDevice },
                        video: false
                    })
                    this.recorder = new MediaRecorder(stream, {
                        mimeType: "audio/webm; codecs=\"opus\"",
                        audioBitsPerSecond: 128000
                    })
                }
                catch (err) {
                    console.log(`ERROR: audio recording: ${err}`)
                    this.audioRecording = false
                    this.audioBlob = null
                    return
                }
                this.audioBlob = null
                this.audioBlobChunks = []
                this.recorder.addEventListener("dataavailable", (event) => {
                    this.audioBlobChunks.push(event.data)
                })
                this.recorder.start()
                this.audioRecording = true
                this.volumeMute = true
            }
            else {
                /*  stop recording  */
                this.recorder.addEventListener("stop", (event) => {
                    this.audioBlob = new Blob(this.audioBlobChunks,
                        { "type" : "audio/webm; codecs=\"opus\"" })
                })
                this.recorder.stop()
                this.audioRecording = false
                this.volumeMute = false
            }
        },
        audioPlay () {
            if (this.audioBlob === null)
                return
            this.audioPlaying = !this.audioPlaying
            if (this.audioPlaying) {
                /*  play recording  */
                this.audioElement = new Audio()
                this.audioElement.setSinkId(this.audioOutputDevice)
                this.audioElement.src = URL.createObjectURL(this.audioBlob)
                this.volumeMute = true
                this.audioElement.addEventListener("paused", (event) => {
                    this.audioPlaying = false
                    this.volumeMute = false
                })
                this.audioElement.addEventListener("ended", (event) => {
                    this.audioPlaying = false
                    this.volumeMute = false
                })
                this.audioElement.play()
            }
            else {
                /*  stop recording  */
                this.audioElement.pause()
                this.volumeMute = false
            }
        }
    },

    /*  component creation hook  */
    async created () {
        this.personPortrait       = await ui.settings("person-portrait")
        this.personName           = await ui.settings("person-name")
        this.liveRelayServer      = await ui.settings("live-relay-server")
        this.liveAccessToken      = await ui.settings("live-access-token")
        this.liveStreamResolution = await ui.settings("live-stream-resolution")
        this.liveStreamBuffering  = await ui.settings("live-stream-buffering")
        this.audioInputDevice     = await ui.settings("audio-input-device")
        this.audioOutputDevice    = await ui.settings("audio-output-device")
        this.loaded = true
    },

    /*  component DOM mounting hook  */
    mounted () {
        /*  receive events  */
        this.$on("updated-devices", () => {
            this.$refs.login.$emit("updated-devices")
        })
        this.$on("login-error", (error) => {
            this.$refs.login.$emit("error", error)
        })
        this.$on("state", (state) => {
            if (state === "login")
                this.inLogin = true
            else if (state === "video")
                this.inLogin = false
        })

        /*  stream handling  */
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

        /*  regular feeling refreshing  */
        setInterval(() => {
            this.sendFeeling()
        }, 10 * 60 * 1000)

        /*  window resize tracking  */
        window.addEventListener("resize", () => this.handleResize())
        this.$nextTick(() => {
            this.handleResize()
        })
    }
}
</script>

