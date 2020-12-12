<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
**
-->

<template>
    <div v-bind:style="style" class="settings">
        <!-- title -->
        <div class="col-2 notice">
        </div>
        <div class="title">
            Your LiVE Settings
        </div>

        <!-- Your Portrait -->
        <i class="icon fas fa-portrait"></i>
        <div class="label">
            <div>
                Your Portrait: <span class="footnote">*</span>
            </div>
            <div class="footnote notice">
                * Privacy Notice: Your portrait and name are transmitted
                when you connect to a <b>LiVE Session</b>. Set your maximum
                privacy level below to indicate up to (and including) which level
                your attendee identity is disclosed to the audience.
            </div>
        </div>
        <portrait
            ref="personPortrait"
            v-model="intPersonPortrait"
        ></portrait>

        <!-- Your Name -->
        <i class="icon fas fa-file-signature"></i>
        <div class="label">
            <div>Your Name: <span class="footnote">*</span></div>
        </div>
        <input
            ref="personName"
            type="text"
            placeholder="Enter your personal name..."
            v-tooltip.left="{ content: 'Your personal name. It is disclosed<br/>according to the privacy level below.' }"
            v-model="intPersonName"
            v-on:keyup.escape="intPersonName = ''"
            v-on:keyup.enter="$refs.liveRelayServer.focus()"
        />

        <!-- Data Privacy -->
        <i class="icon fas fa-user-shield"></i>
        <div class="label">
            <div>
                Your Privacy Level: <span class="footnote">*</span>
            </div>
        </div>
        <div class="selbox-container">
            <div class="selbox"
                v-tooltip.top="{ content: 'Your attendee identity (portrait and name) is disclosed<br/>in all types of audiences, including<br/><span class=attention-boxed>public/open-group</span> kind of audiences.' }"
                v-bind:class="{ active: intPersonPrivacy === 'public' }"
                v-on:click="intPersonPrivacy = 'public'">
                Public
            </div>
            <div class="selbox"
                v-tooltip.top="{ content: 'Your attendee identity (portrait and name) is disclosed<br/>in <span class=attention-boxed>private/closed-group</span> kind of audiences only.' }"
                v-bind:class="{ active: intPersonPrivacy === 'private' }"
                v-on:click="intPersonPrivacy = 'private'">
                Private
            </div>
            <div class="selbox"
                v-tooltip.top="{ content: 'Your attendee identity (portrait and name)<br/>is <span class=attention-boxed>never</span> disclosed at all.' }"
                v-bind:class="{ active: intPersonPrivacy === 'anonymous' }"
                v-on:click="intPersonPrivacy = 'anonymous'">
                Anonymous
            </div>
        </div>

        <!-- Video Stream Buffering -->
        <!--
        <i class="icon fas fa-clock"></i>
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
        -->

        <!-- Stream Recording -->
        <i class="icon fas fa-user-shield"></i>
        <div class="label">
            <div>
                Your Stream Recordings:
            </div>
        </div>
        <div class="selbox-container">
            <div class="selbox"
                v-tooltip.top="{ content: 'Your streams will be stored locally<br/>in order to be replayed within <span class=attention-boxed>48</span> hours.<br/>' +
                    'Please ensure that your free disk space<br/>allows storing about 1 GB/hour.' }"
                v-bind:class="{ active: intRecordingHours === 48 }"
                v-on:click="intRecordingHours = 48">
                48 Hours
            </div>
            <div class="selbox"
                v-tooltip.top="{ content: 'Your streams will be stored locally<br/>in order to be replayed within <span class=attention-boxed>24</span> hours.<br/>' +
                    'Please ensure that your free disk space<br/>allows storing about 1 GB/hour.' }"
                v-bind:class="{ active: intRecordingHours === 24 }"
                v-on:click="intRecordingHours = 24">
                24 Hours
            </div>
            <div class="selbox"
                v-tooltip.top="{ content: 'Your streams will not be stored locally.<br/>You will not be able to replay them.' }"
                v-bind:class="{ active: intRecordingHours === 0 }"
                v-on:click="intRecordingHours = 0">
                None
            </div>
        </div>

        <!-- Audio Input Device -->
        <i class="icon fas fa-microphone-alt"></i>
        <div class="label">Audio Input Device:</div>
        <div class="selbox-container">
            <v-multiselect
                v-bind:options="audioInputDevices"
                v-model="intAudioInputDevice"
                track-by="id"
                label="name"
                placeholder="Select audio input device..."
                v-tooltip.left="{ content: 'Your local audio input device (microphone).<br/>' +
                    'Use the record button to the right for testing the device.' }"
                v-bind:searchable="false"
                v-bind:allow-empty="true"
                v-bind:open-direction="'bottom'"
            ></v-multiselect>
            <div class="selbox"
                v-on:click="audioInputTest"
                v-tooltip.right="{ content: 'Press to record a test message.' }"
                v-bind:class="{ disabled: intAudioInputDevice === null, active: audioInputTestActive }">
                <span v-show="!audioInputTestActive" class="icon"><i class="fas fa-microphone-alt"></i></span>
                <span v-show="audioInputTestActive"  class="icon"><i class="fas fa-microphone-alt-slash"></i></span>
            </div>
        </div>

        <!-- Audio Output Device -->
        <i class="icon fas fa-volume-up"></i>
        <div class="label">Audio Output Device:</div>
        <div class="selbox-container">
            <v-multiselect
                v-bind:options="audioOutputDevices"
                v-model="intAudioOutputDevice"
                track-by="id"
                label="name"
                placeholder="Select audio output device..."
                v-tooltip.left="{ content: 'Your local audio output device (speaker).<br/>' +
                    'Use the play button to the right for testing the device.' }"
                v-bind:searchable="false"
                v-bind:allow-empty="true"
                v-bind:open-direction="'bottom'"
            ></v-multiselect>
            <div class="selbox"
                v-on:click="audioOutputTest"
                v-tooltip.right="{ content: 'Press to play a previously<br/>recorded test message.' }"
                v-bind:class="{ disabled: intAudioOutputDevice === null || audioBlob === null, active: audioOutputTestActive }">
                <span v-show="!audioOutputTestActive" class="icon"><i class="fas fa-play-circle"></i></span>
                <span v-show="audioOutputTestActive" class="icon"><i class="fas fa-stop-circle"></i></span>
            </div>
        </div>

        <!-- Save -->
        <div class="col-3 box button button-save"
            v-bind:class="{ disabled: !allowSave }"
            ref="save"
            v-tooltip.bottom="{ content: 'Press to save your settings<br/>and close the dialog.' }"
            v-on:click="save">
            <i class="fas fa-times-circle"></i>
            &nbsp;
            Close Dialog
        </div>

        <!-- Logo & GDPR Notice -->
        <div class="col-2 notice">
        </div>
    </div>
</template>

<style lang="less" scoped>
.settings {
    background-color: var(--color-std-bg-4);
    border-top:    1px solid var(--color-std-bg-5);
    border-left:   1px solid var(--color-std-bg-5);
    border-right:  1px solid var(--color-std-bg-1);
    border-bottom: 1px solid var(--color-std-bg-1);
    box-shadow: 0px 5px 20px var(--color-std-bg-2);
    padding: 20px;
    border-radius: 5px;
    display: grid;
    grid-template-columns: 30px 200px 300px;
    row-gap: 6px;
    font-size: 12pt;

    >.icon {
        color: var(--color-std-fg-1);
        padding-top: 4px;
    }
    .label {
        display: flex;
        flex-direction: column;
        font-weight: 300;
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
        font-weight: 300;
    }
    .notice {
        margin-top: 6px;
    }
    >.selbox-container {
        display: flex;
        justify-content: flex-start;
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
            flex-grow: 1;
            justify-content: center;
            width: 15%;
            cursor: pointer;
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
    .box.button.button-save {
        width: calc(100% - 20px);
        color:            var(--color-std-fg-3);
        background-color: var(--color-std-bg-4);
        border-top:    1px solid var(--color-std-bg-5);
        border-left:   1px solid var(--color-std-bg-5);
        border-right:  1px solid var(--color-std-bg-1);
        border-bottom: 1px solid var(--color-std-bg-1);
        font-size: 12pt;
        padding: 5px 10px 5px 10px;
        border-radius: 5px;
        text-align: center;
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
        &.disabled {
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
        personPrivacy:        { type: String, default: "" },
        liveStreamBuffering:  { type: Number, default: 2000 },
        recordingHours:       { type: Number, default: 0 },
        audioInputDevice:     { type: String, default: "" },
        audioOutputDevice:    { type: String, default: "" }
    },

    /*  component variable properties  */
    data: function () {
        return {
            intPersonPortrait:       this.personPortrait,
            intPersonName:           this.personName,
            intPersonPrivacy:        this.personPrivacy,
            intLiveStreamBuffering:  this.liveStreamBuffering,
            intRecordingHours:       this.recordingHours,
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
        intPersonPrivacy:        function (v) { this.$emit("update:person-privacy", v) },
        intLiveStreamBuffering:  function (v) { this.$emit("update:live-stream-buffering", v) },
        intRecordingHours:       function (v) { this.$emit("update:recording-hours", v) },
        intAudioInputDevice:     function (v) { this.$emit("update:audio-input-device",  this.deviceObj2Id(v)) },
        intAudioOutputDevice:    function (v) { this.$emit("update:audio-output-device", this.deviceObj2Id(v)) }
    },

    /*  component sub-components  */
    components: {
        "portrait": "url:app-ui-widget-portrait.vue"
    },

    /*  component methods  */
    methods: {
        /*  handle save  */
        save () {
            /*  prevent hammering connect button  */
            if (!this.allowSave)
                return
            this.allowSave = false
            setTimeout(() => {
                this.allowSave = true
            }, 1 * 1000)

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
                    /*  get audio stream from audio input device  */
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: this.intAudioInputDevice.id,
                            echoCancellation: true,
                            noiseSuppression: true
                        },
                        video: false
                    })

                    /*  create audio graph  */
                    const ac = new AudioContext()
                    const src = ac.createMediaStreamSource(stream)
                    const dst = ac.createMediaStreamDestination()

                    /*  create Voice filter  */
                    const voicefilter = new AudioNodeSuite.AudioNodeVoice(ac)

                    /*  connect the audio graph nodes  */
                    src.connect(voicefilter)
                    voicefilter.connect(dst)

                    /*  record the resulting audio stream  */
                    this.recorder = new MediaRecorder(dst.stream, {
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

