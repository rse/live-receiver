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
    <div v-bind:style="style" class="login">
        <!-- Your Portrait -->
        <div class="login-row portrait">
            <div class="login-col label">
                <i class="icon fa fa-portrait"></i>
                Your Portrait <span class="footnote">*</span>:
            </div>
            <div class="login-col input">
                <portrait class="portrait"
                    ref="personPortrait"
                    v-model="intPersonPortrait"
                ></portrait>
            </div>
        </div>

        <!-- Your Name -->
        <div class="login-row name">
            <div class="login-col label">
                <i class="icon fa fa-file-signature"></i>
                Your Name <span class="footnote">*</span>:
            </div>
            <div class="login-col input">
                <input
                    ref="personName"
                    type="text"
                    placeholder="Enter your personal name..."
                    v-model="intPersonName"
                    v-on:keyup.escape="intPersonName = ''"
                    v-on:keyup.enter="$refs.liveRelayServer.focus()"
                />
            </div>
        </div>

        <!-- LiVE Relay Server -->
        <div class="login-row server">
            <div class="login-col label">
                <i class="icon fa fa-globe"></i>
                LiVE Relay Server (FQDN):
            </div>
            <div class="login-col input">
                <input
                    ref="liveRelayServer"
                    type="text"
                    placeholder="Enter your LiVE relay server FQDN..."
                    v-model="intLiveRelayServer"
                    v-on:keyup.escape="intLiveRelayServer = ''"
                    v-on:keyup.enter="$refs.liveAccessToken.focus()"
                />
            </div>
        </div>

        <!-- LiVE Access Token -->
        <div class="login-row token">
            <div class="login-col label">
                <i class="icon fa fa-key"></i>
                LiVE Access Token:
            </div>
            <div class="login-col input">
                <input
                    ref="liveAccessToken"
                    type="text"
                    placeholder="Enter your LiVE access token..."
                    v-model="intLiveAccessToken"
                    v-on:keyup.escape="intLiveAccessToken = ''"
                    v-on:keyup.enter="$refs.login.focus()"
                />
            </div>
        </div>

        <!-- LiVE Stream Resolution -->
        <!--
        <div class="login-row resolution">
            <div class="login-col label">
                <i class="icon fa fa-expand-alt"></i>
                LiVE Stream Resolution:
            </div>
            <div class="login-col input">
                <div class="selbox-container">
                    <div class="selbox"
                        v-bind:class="{ active: intLiveStreamResolution === '480p' }"
                        v-on:click="intLiveStreamResolution = '480p'">
                        480p
                    </div>
                    <div class="selbox"
                        v-bind:class="{ active: intLiveStreamResolution === '720p' }"
                        v-on:click="intLiveStreamResolution = '720p'">
                        720p
                    </div>
                    <div class="selbox"
                        v-bind:class="{ active: intLiveStreamResolution === '1080p' }"
                        v-on:click="intLiveStreamResolution = '1080p'">
                        1080p
                    </div>
                </div>
            </div>
        </div>
        -->

        <!-- LiVE Stream Buffering -->
        <div class="login-row buffering">
            <div class="login-col label">
                <i class="icon fa fa-clock"></i>
                LiVE Stream Buffering (ms):
            </div>
            <div class="login-col input">
                <div class="selbox-container">
                    <div class="selbox"
                        v-bind:class="{ active: intLiveStreamBuffering === 500 }"
                        v-on:click="intLiveStreamBuffering = 500">
                        500
                    </div>
                    <div class="selbox"
                        v-bind:class="{ active: intLiveStreamBuffering === 1000 }"
                        v-on:click="intLiveStreamBuffering = 1000">
                        1000
                    </div>
                    <div class="selbox"
                        v-bind:class="{ active: intLiveStreamBuffering === 1500 }"
                        v-on:click="intLiveStreamBuffering = 1500">
                        1500
                    </div>
                    <div class="selbox"
                        v-bind:class="{ active: intLiveStreamBuffering === 2000 }"
                        v-on:click="intLiveStreamBuffering = 2000">
                        2000
                    </div>
                    <div class="selbox"
                        v-bind:class="{ active: intLiveStreamBuffering === 2500 }"
                        v-on:click="intLiveStreamBuffering = 2500">
                        2500
                    </div>
                    <div class="selbox"
                        v-bind:class="{ active: intLiveStreamBuffering === 3000 }"
                        v-on:click="intLiveStreamBuffering = 3000">
                        3000
                    </div>
                </div>
            </div>
        </div>

        <!-- Audio Input Device -->
        <div class="login-row audio-input-device">
            <div class="login-col label">
                <i class="icon fa fa-microphone-alt"></i>
                Audio Input Device:
            </div>
            <div class="login-col input device">
                <div class="selbox-container">
                    <v-multiselect
                        v-bind:options="audioInputDevices"
                        v-model="intAudioInputDevice"
                        track-by="id"
                        label="name"
                        placeholder="Select audio input device..."
                        v-bind:searchable="false"
                        v-bind:allow-empty="true"
                        v-bind:open-direction="'below'"
                    ></v-multiselect>
                    <div class="selbox"
                        v-on:click="audioInputTest"
                        v-bind:class="{ disabled: intAudioInputDevice === null, active: audioInputTestActive }">
                        <span v-show="!audioInputTestActive" class="icon"><i class="fa fa-dot-circle"></i></span>
                        <span v-show="audioInputTestActive"  class="icon"><i class="fa fa-stop-circle"></i></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Audio Output Device -->
        <div class="login-row audio-output-device">
            <div class="login-col label">
                <i class="icon fa fa-volume-up"></i>
                Audio Output Device:
            </div>
            <div class="login-col input device">
                <div class="selbox-container">
                    <v-multiselect
                        v-bind:options="audioOutputDevices"
                        v-model="intAudioOutputDevice"
                        track-by="id"
                        label="name"
                        placeholder="Select audio output device..."
                        v-bind:searchable="false"
                        v-bind:allow-empty="true"
                        v-bind:open-direction="'bottom'"
                    ></v-multiselect>
                    <div class="selbox"
                        v-on:click="audioOutputTest"
                        v-bind:class="{ disabled: intAudioOutputDevice === null || audioBlob === null, active: audioOutputTestActive }">
                        <span v-show="!audioOutputTestActive" class="icon"><i class="fa fa-play-circle"></i></span>
                        <span v-show="audioOutputTestActive" class="icon"><i class="fa fa-stop-circle"></i></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Connect -->
        <div class="login-row submit">
            <div class="login-col label">
            </div>
            <div class="login-col input">
                <input
                    v-bind:disabled="
                        intPersonPortrait  === '' ||
                        intPersonName      === '' ||
                        intLiveRelayServer === '' ||
                        intLiveAccessToken === '' ||
                        !allowConnect"
                    ref="login"
                    type="submit"
                    value="Connect"
                    v-on:click="login"
                />
            </div>
        </div>

        <!-- Optional Error -->
        <div v-show="error !== ''" class="login-row error">
            <div class="login-col label">
            </div>
            <div class="login-col error">
                ERROR: {{ error }}
            </div>
        </div>

        <!-- Logo & GDPR Notice -->
        <div class="login-row notice">
            <div class="login-col label">
                <img v-bind:src="logo" class="logo" alt="LiVE"/>
                <div class="version">Receiver {{ version }}</div>
            </div>
            <div class="login-col notice">
                <span class="footnote">
                    * Your portrait image and name are stored locally
                    in <i>LiVE Receiver</i> (trainee-side) and are
                    only transmitted to the <i>LiVE Relay</i>
                    (server-side) and <i>LiVE Sender</i> (trainer-side)
                    when you explicitly send a message to the
                    trainer.  Choose a standard avatar as your
                    portrait and an arbitrary nickname if you wish
                    to remain anomymous.
                </span>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.login {
    background-color: var(--color-std-bg-4);
    border-top:    1px solid var(--color-std-bg-5);
    border-left:   1px solid var(--color-std-bg-5);
    border-right:  1px solid var(--color-std-bg-1);
    border-bottom: 1px solid var(--color-std-bg-1);
    padding: 20px;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    font-size: 12pt;
    .login-row {
        margin-bottom: 4px;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        .login-col {
            display: flex;
            flex-direction: column;
            &.label {
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                width: 220px;
                .icon {
                    color: var(--color-std-fg-1);
                    margin-right: 10px;
                    position: relative;
                    top: 4px;
                    width: 20px;
                }
            }
            &.input {
                width: 300px;
            }
            &.device {
                .selbox-container {
                    .multiselect {
                        width: 250px;
                        min-width: 250px;
                    }
                    .selbox {
                        width: 50px;
                        margin-left: 5px;
                        position: relative;
                        .icon {
                            position: absolute;
                            left: 10px;
                            top: 2px;
                            display: block;
                            font-size: 25px;
                        }
                        &.disabled {
                            color: var(--color-std-fg-1);
                            &:hover {
                                background-color:        var(--color-std-bg-4);
                                border-top:    1px solid var(--color-std-bg-5);
                                border-left:   1px solid var(--color-std-bg-5);
                                border-right:  1px solid var(--color-std-bg-1);
                                border-bottom: 1px solid var(--color-std-bg-1);
                            }
                        }
                    }
                }
            }
        }
    }
    input[type="text"] {
        color:            var(--color-std-fg-3);
        background-color: var(--color-std-bg-4);
        border-top:    1px solid var(--color-std-bg-1);
        border-left:   1px solid var(--color-std-bg-1);
        border-right:  1px solid var(--color-std-bg-5);
        border-bottom: 1px solid var(--color-std-bg-5);
        font-size: 12pt;
        padding: 0px 10px 0px 10px;
        position: relative;
        height: 20pt;
        &::placeholder {
            color: var(--color-std-fg-1);
            font-size: 10pt;
            position: relative;
            top: -2px;
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
    input[type="submit"] {
        color:            var(--color-std-fg-3);
        background-color: var(--color-std-bg-4);
        border-top:    1px solid var(--color-std-bg-5);
        border-left:   1px solid var(--color-std-bg-5);
        border-right:  1px solid var(--color-std-bg-1);
        border-bottom: 1px solid var(--color-std-bg-1);
        font-size: 12pt;
        padding: 5px 10px 5px 10px;
        border-radius: 5px;
        &:focus {
            border: 0;
            outline: none;
            color:                   var(--color-sig-fg-4);
            background-color:        var(--color-sig-bg-5);
            border-top:    1px solid var(--color-sig-bg-5);
            border-left:   1px solid var(--color-sig-bg-5);
            border-right:  1px solid var(--color-sig-bg-1);
            border-bottom: 1px solid var(--color-sig-bg-1);
        }
        &:hover {
            color:                   var(--color-sig-fg-3);
            background-color:        var(--color-sig-bg-4);
            border-top:    1px solid var(--color-sig-bg-5);
            border-left:   1px solid var(--color-sig-bg-5);
            border-right:  1px solid var(--color-sig-bg-1);
            border-bottom: 1px solid var(--color-sig-bg-1);
        }
        &:disabled {
            color:            var(--color-std-fg-1);
            background-color: var(--color-std-bg-4);
            border-top:    1px solid var(--color-std-bg-5);
            border-left:   1px solid var(--color-std-bg-5);
            border-right:  1px solid var(--color-std-bg-1);
            border-bottom: 1px solid var(--color-std-bg-1);
        }
    }
    .login-row > .portrait {
        width: 300px;
        height: 150px;
    }
    .login-row > .notice {
        width: 300px;
    }
    .login-col.error {
        font-size: 12pt;
        padding: 5px 10px 5px 10px;
        color: var(--color-sig-fg-1);
        border: 1px solid var(--color-sig-bg-5);
        width: calc(300px - 20px);
    }
    .footnote {
        font-size: 8pt;
        color: var(--color-std-fg-1);
    }
    .login-row.notice {
        margin-top: 10px;
    }
    .login-row.notice > .login-col.label {
        display: block;
        .logo {
            padding-left: 40px;
            width: 100px;
        }
        .version {
            padding-left: 40px;
        }
    }
    .selbox-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        .selbox {
            margin-right: 4px;
            &:last-child {
                margin-right: 0;
            }
            width: 100%;
            color:                   var(--color-std-fg-3);
            background-color:        var(--color-std-bg-4);
            border-top:    1px solid var(--color-std-bg-5);
            border-left:   1px solid var(--color-std-bg-5);
            border-right:  1px solid var(--color-std-bg-1);
            border-bottom: 1px solid var(--color-std-bg-1);
            text-align: center;
            border-radius: 5px;
            &:hover {
                color:                   var(--color-sig-fg-3);
                background-color:        var(--color-sig-bg-3);
                border-top:    1px solid var(--color-sig-bg-5);
                border-left:   1px solid var(--color-sig-bg-5);
                border-right:  1px solid var(--color-sig-bg-1);
                border-bottom: 1px solid var(--color-sig-bg-1);
            }
            &.active {
                color:                   var(--color-acc-fg-3);
                background-color:        var(--color-acc-bg-3);
                border-top:    1px solid var(--color-acc-bg-5);
                border-left:   1px solid var(--color-acc-bg-5);
                border-right:  1px solid var(--color-acc-bg-1);
                border-bottom: 1px solid var(--color-acc-bg-1);
            }
        }
    }
    .multiselect {
        background-color: inherit;
    }
    .multiselect__tags {
        color:            var(--color-std-fg-3);
        background-color: var(--color-std-bg-4);
        border-top:    1px solid var(--color-std-bg-5);
        border-left:   1px solid var(--color-std-bg-5);
        border-right:  1px solid var(--color-std-bg-1);
        border-bottom: 1px solid var(--color-std-bg-1);
        font-size: 12pt;
        .multiselect__placeholder {
            color: var(--color-std-fg-1);
            font-size: 11pt;
        }
        &:hover {
            color:            var(--color-sig-fg-3);
            background-color: var(--color-sig-bg-4);
            border-top:    1px solid var(--color-sig-bg-5);
            border-left:   1px solid var(--color-sig-bg-5);
            border-right:  1px solid var(--color-sig-bg-1);
            border-bottom: 1px solid var(--color-sig-bg-1);
            .multiselect__placeholder {
                color: var(--color-sig-fg-1);
            }
        }
    }
    .multiselect__content-wrapper {
        color:            var(--color-std-fg-3);
        background-color: var(--color-std-bg-4);
        border-top:    1px solid var(--color-std-bg-5);
        border-left:   1px solid var(--color-std-bg-5);
        border-right:  1px solid var(--color-std-bg-1);
        border-bottom: 1px solid var(--color-std-bg-1);
        font-size: 12pt;
    }
    .multiselect__single {
        color:            var(--color-std-fg-3);
        background-color: inherit;
        border: 0px;
        font-size: 12pt;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
    .multiselect__tags {
        &:hover {
            .multiselect__single {
                color: var(--color-sig-fg-3);
            }
        }
    }
    .multiselect__option {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
    .multiselect__option::after {
        display: none;
    }
    .multiselect__option--highlight {
        color:            var(--color-sig-fg-3);
        background-color: var(--color-sig-bg-4);
        border-top:    1px solid var(--color-sig-bg-5);
        border-left:   1px solid var(--color-sig-bg-5);
        border-right:  1px solid var(--color-sig-bg-1);
        border-bottom: 1px solid var(--color-sig-bg-1);
    }
    .multiselect__option--selected {
        color:            var(--color-acc-fg-3);
        background-color: var(--color-acc-bg-4);
        border-top:    1px solid var(--color-acc-bg-5);
        border-left:   1px solid var(--color-acc-bg-5);
        border-right:  1px solid var(--color-acc-bg-1);
        border-bottom: 1px solid var(--color-acc-bg-1);
        font-size: 12pt;
        font-weight: normal;
    }
}
</style>

<script>
module.exports = {
    name: "login",
    props: {
        personPortrait:       { type: String, default: "" },
        personName:           { type: String, default: "" },
        liveRelayServer:      { type: String, default: "" },
        liveAccessToken:      { type: String, default: "" },
        liveStreamResolution: { type: String, default: "1080p" },
        liveStreamBuffering:  { type: Number, default: 2000 },
        audioInputDevice:     { type: String, default: "" },
        audioOutputDevice:    { type: String, default: "" }
    },
    data: function () {
        return {
            intPersonPortrait:       this.personPortrait,
            intPersonName:           this.personName,
            intLiveRelayServer:      this.liveRelayServer,
            intLiveAccessToken:      this.liveAccessToken,
            intLiveStreamResolution: this.liveStreamResolution,
            intLiveStreamBuffering:  this.liveStreamBuffering,
            intAudioInputDevice:     null,
            intAudioOutputDevice:    null,
            audioInputDevices:       [],
            audioOutputDevices:      [],
            audioInputTestActive:    false,
            audioOutputTestActive:   false,
            audioBlob:               null,
            audioBlobChunks:         [],
            allowConnect:            true,
            logo:                    ui.logo,
            version:                 ui.pkg.version,
            error:                   ""
        }
    },
    watch: {
        intPersonPortrait:       function (v) { this.$emit("update:person-portrait", v) },
        intPersonName:           function (v) { this.$emit("update:person-name", v) },
        intLiveRelayServer:      function (v) { this.$emit("update:live-relay-server", v) },
        intLiveAccessToken:      function (v) { this.$emit("update:live-access-token", v) },
        intLiveStreamResolution: function (v) { this.$emit("update:live-stream-resolution", v) },
        intLiveStreamBuffering:  function (v) { this.$emit("update:live-stream-buffering", v) },
        intAudioInputDevice:     function (v) { this.$emit("update:audio-input-device",  this.deviceObj2Id(v)) },
        intAudioOutputDevice:    function (v) { this.$emit("update:audio-output-device", this.deviceObj2Id(v)) }
    },
    computed: {
        style: ui.vueprop2cssvar()
    },
    components: {
        "portrait": "url:app-ui-3-widget-portrait.vue"
    },
    methods: {
        login () {
            this.allowConnect = false
            setTimeout(() => {
                this.allowConnect = true
            }, 2 * 1000)
            this.$emit("login")
        },
        deviceId2Obj (id, list) {
            if (id === "")
                return null
            const x = list.find((device) => device.id === id)
            return x !== undefined ? x : null
        },
        deviceObj2Id (obj) {
            if (obj === null)
                return ""
            return obj.id
        },
        deviceUpdate () {
            if (!ui.devices)
                return
            this.audioInputDevices = ui.devices
                .filter((device) => device.kind === "audioinput")
                .map((device) => ({ id: device.deviceId, name: device.label }))
            this.audioOutputDevices = ui.devices
                .filter((device) => device.kind === "audiooutput")
                .map((device) => ({ id: device.deviceId, name: device.label }))
            if (this.intAudioInputDevice === null)
                this.intAudioInputDevice = this.deviceId2Obj(
                    this.audioInputDevice, this.audioInputDevices)
            else
                this.intAudioInputDevice = this.deviceId2Obj(
                    this.deviceObj2Id(this.intAudioInputDevice), this.audioInputDevices)
            if (this.intAudioOutputDevice === null)
                this.intAudioOutputDevice = this.deviceId2Obj(
                    this.audioOutputDevice, this.audioOutputDevices)
            else
                this.intAudioOutputDevice = this.deviceId2Obj(
                    this.deviceObj2Id(this.intAudioOutputDevice), this.audioOutputDevices)
        },
        async audioInputTest () {
            if (this.intAudioInputDevice === null)
                return
            this.audioInputTestActive = !this.audioInputTestActive
            if (this.audioInputTestActive) {
                /*  start recording  */
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: { deviceId: this.intAudioInputDevice.id },
                        video: false
                    })
                    this.recorder = new MediaRecorder(stream, {
                        mimeType: "audio/webm; codecs=\"opus\"",
                        audioBitsPerSecond: 128000
                    })
                }
                catch (err) {
                    console.log(`ERROR: audio input test: ${err}`)
                    this.audioInputTestActive = false
                    return
                }
                this.audioBlob = null
                this.audioBlobChunks = []
                this.recorder.addEventListener("dataavailable", (event) => {
                    this.audioBlobChunks.push(event.data)
                })
                this.recorder.start()
            }
            else {
                /*  stop recording  */
                this.recorder.addEventListener("stop", (event) => {
                    this.audioBlob = new Blob(this.audioBlobChunks,
                        { "type" : "audio/webm; codecs=\"opus\"" })
                })
                this.recorder.stop()
            }
        },
        audioOutputTest () {
            if (this.intAudioOutputDevice === null)
                return
            if (this.audioBlob === null)
                return
            this.audioOutputTestActive = !this.audioOutputTestActive
            if (this.audioOutputTestActive) {
                /*  play recording  */
                this.audioElement = new Audio()
                this.audioElement.setSinkId(this.intAudioOutputDevice.id)
                this.audioElement.src = URL.createObjectURL(this.audioBlob)
                this.audioElement.addEventListener("paused", (event) => {
                    this.audioOutputTestActive = false
                })
                this.audioElement.addEventListener("ended", (event) => {
                    this.audioOutputTestActive = false
                })
                this.audioElement.play()
            }
            else {
                /*  stop recording  */
                this.audioElement.pause()
            }
        }
    },
    created () {
        this.deviceUpdate()
    },
    mounted () {
        this.$on("error", (error) => {
            this.error = error
            setTimeout(() => {
                this.error = ""
            }, 4 * 1000)
        })
        this.$on("updated-devices", () => {
            this.deviceUpdate()
        })
    }
}
</script>

