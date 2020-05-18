<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0>
**
-->

<template>
    <div v-bind:style="style" class="settings">
        <!-- title -->
        <div class="col-2 notice">
        </div>
        <div class="title">
            Your LiVE Receiver Settings
        </div>

        <!-- Your Portrait -->
        <i class="icon fa fa-portrait"></i>
        <div class="label">Your Portrait <span class="footnote">*</span></div>
        <portrait
            ref="personPortrait"
            v-model="intPersonPortrait"
        ></portrait>

        <!-- Your Name -->
        <i class="icon fa fa-file-signature"></i>
        <div class="label">Your Name <span class="footnote">*</span></div>
        <input
            ref="personName"
            type="text"
            placeholder="Enter your personal name..."
            v-model="intPersonName"
            v-on:keyup.escape="intPersonName = ''"
            v-on:keyup.enter="$refs.liveRelayServer.focus()"
        />

        <!-- Video Stream Buffering -->
        <i class="icon fa fa-clock"></i>
        <div class="label">Video Stream Buffering (ms)</div>
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

        <!-- Audio Input Device -->
        <i class="icon fa fa-microphone-alt"></i>
        <div class="label">Audio Input Device</div>
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

        <!-- Audio Output Device -->
        <i class="icon fa fa-volume-up"></i>
        <div class="label">Audio Output Device</div>
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

        <!-- Save -->
        <input class="col-3"
            v-bind:disabled="!allowSave"
            ref="save"
            type="submit"
            value="Save & Close"
            v-on:click="save"
        />

        <!-- Logo & GDPR Notice -->
        <div class="col-2 notice">
        </div>
        <span class="footnote notice">
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
</template>

<style lang="less" scoped>
.settings {
    background-color: var(--color-std-bg-4);
    border-top:    1px solid var(--color-std-bg-5);
    border-left:   1px solid var(--color-std-bg-5);
    border-right:  1px solid var(--color-std-bg-1);
    border-bottom: 1px solid var(--color-std-bg-1);
    padding: 20px;
    border-radius: 5px;
    display: grid;
    grid-template-columns: 30px 200px 300px;
    row-gap: 4px;
    font-size: 12pt;

    >.icon {
        color: var(--color-std-fg-1);
        padding-top: 4px;
    }
    .label {
        display: flex;
        &:after {
            content: ':';
        }
    }
    >.col-2 {
        grid-column-start: 2;
    }
    >.col-3 {
        grid-column-start: 3;
    }
    .title {
        margin-bottom: 10px;
        font-size: 18pt;
        font-weight: 200;
    }
    .notice {
        margin-top: 6px;
    }
    >.selbox-container {
        display: flex;
        .multiselect {
            width: 250px;
            min-width: 250px;
            .multiselect__tags {
                height: 40px;
                min-height: 40px;
            }
        }
        .selbox {
            display: flex;
            margin-left: 5px;
            width: 46px;
            justify-content: center;
            .icon {
                padding-top: 3px;
                width: 100%;
                font-size: 24px;
            }
        }
        .selbox:first-child {
            margin-left: 0px;
        }
        .selbox:last-child {
            margin-left: 4px;
            width: 46px;
        }
    }

    /*  text input field  */
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
        &:hover, &:focus {
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

    /*  submit button  */
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
    .footnote {
        font-size: 8pt;
        color: var(--color-std-fg-1);
    }

    /*  select-box row  */
    .selbox-container {
        .selbox {
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
</style>

<script>
module.exports = {
    name: "settings",

    /*  component static properties  */
    props: {
        personPortrait:       { type: String, default: "" },
        personName:           { type: String, default: "" },
        liveStreamBuffering:  { type: Number, default: 2000 },
        audioInputDevice:     { type: String, default: "" },
        audioOutputDevice:    { type: String, default: "" }
    },

    /*  component variable properties  */
    data: function () {
        return {
            intPersonPortrait:       this.personPortrait,
            intPersonName:           this.personName,
            intLiveStreamBuffering:  this.liveStreamBuffering,
            intAudioInputDevice:     null,
            intAudioOutputDevice:    null,
            audioInputDevices:       [],
            audioOutputDevices:      [],
            audioInputTestActive:    false,
            audioOutputTestActive:   false,
            audioBlob:               null,
            audioBlobChunks:         [],
            allowSave:               true
        }
    },

    /*  component computed properties  */
    computed: {
        style: ui.vueprop2cssvar()
    },

    /*  component property observation  */
    watch: {
        intPersonPortrait:       function (v) { this.$emit("update:person-portrait", v) },
        intPersonName:           function (v) { this.$emit("update:person-name", v) },
        intLiveStreamBuffering:  function (v) { this.$emit("update:live-stream-buffering", v) },
        intAudioInputDevice:     function (v) { this.$emit("update:audio-input-device",  this.deviceObj2Id(v)) },
        intAudioOutputDevice:    function (v) { this.$emit("update:audio-output-device", this.deviceObj2Id(v)) }
    },

    /*  component sub-components  */
    components: {
        "portrait": "url:app-ui-4-widget-portrait.vue"
    },

    /*  component methods  */
    methods: {
        /*  handle save  */
        save () {
            /*  prevent hammering connect button  */
            this.allowSave = false
            setTimeout(() => {
                this.allowSave = true
            }, 2 * 1000)

            /*  raise login event  */
            this.$emit("save")
        },

        /*  audio device handling  */
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

            /*  filter audio input devices  */
            this.audioInputDevices = ui.devices
                .filter((device) => device.kind === "audioinput")
                .map((device) => ({ id: device.deviceId, name: device.label }))

            /*  filter audio output devices  */
            this.audioOutputDevices = ui.devices
                .filter((device) => device.kind === "audiooutput")
                .map((device) => ({ id: device.deviceId, name: device.label }))

            /*  (re)select audio input devices  */
            let deviceId = ""
            if (this.intAudioInputDevice !== null)
                deviceId = this.deviceObj2Id(this.intAudioInputDevice)
            else if (this.audioInputDevice !== "")
                deviceId = this.audioInputDevice
            else
                deviceId = "default"
            this.intAudioInputDevice = this.deviceId2Obj(deviceId, this.audioInputDevices)

            /*  (re)select audio output devices  */
            deviceId = ""
            if (this.intAudioOutputDevice !== null)
                deviceId = this.deviceObj2Id(this.intAudioOutputDevice)
            else if (this.audioOutputDevice !== "")
                deviceId = this.audioOutputDevice
            else
                deviceId = "default"
            this.intAudioOutputDevice = this.deviceId2Obj(deviceId, this.audioOutputDevices)
        },

        /*  audio input device test-driving  */
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
                    ui.log.error(`ui: audio input test: error: ${err}`)
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

        /*  audio output device test-driving  */
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

    /*  component creation hook  */
    created () {
        /*  update audio devices (initially)  */
        this.deviceUpdate()
    },

    /*  component DOM mounting hook  */
    mounted () {
        /*  update audio devices (subsequently)  */
        this.$on("updated-devices", () => {
            this.deviceUpdate()
        })
    }
}
</script>

