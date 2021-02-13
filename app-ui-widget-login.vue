<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
**
-->

<template>
    <div v-bind:style="style" class="login">
        <!-- title -->
        <div class="col-2 notice">
        </div>
        <div class="headline">
            {{ $t("login.title") }}
        </div>

        <!-- LiVE Relay Server -->
        <i class="icon fas fa-globe"></i>
        <div class="label">{{ $t("login.relay-server") }}</div>
        <input
            ref="liveRelayServer"
            class="input-field"
            type="text"
            v-bind:placeholder="$t('login.relay-server-placeholder')"
            v-tooltip.left="{ content: $t('login.relay-server-tooltip') }"
            v-model="intLiveRelayServer"
            v-on:keyup.escape="intLiveRelayServer = ''"
            v-on:keyup.enter="$refs.liveAccessToken.focus()"
        />

        <!-- LiVE Access Token -->
        <i class="icon fas fa-key"></i>
        <div class="label">{{ $t("login.access-token") }}</div>
        <input
            ref="liveAccessToken"
            class="input-field"
            type="text"
            v-bind:placeholder="$t('login.access-token-placeholder')"
            v-tooltip.left="{ content: $t('login.access-token-tooltip') }"
            v-model="intLiveAccessToken"
            v-on:keyup.escape="intLiveAccessToken = ''"
            v-on:keyup.enter="login"
        />

        <!-- Connect -->
        <div class="col-3 box button login-button"
            v-bind:class="{ disabled: intLiveRelayServer === '' || intLiveAccessToken === '' || !allowConnect }"
            v-tooltip.left="{ content: $t('login.connect-tooltip') }"
            ref="login"
            v-on:click="login"
            v-on:keyup.enter="login">
            <b>{{ $t("login.connect") }}</b> <span class="login-button-icon"><i class="fas fa-arrow-alt-circle-right"></i></span>
        </div>

        <!-- Optional Error -->
        <div v-show="error !== ''" class="col-3 error" v-html="error">
        </div>

        <!-- Optional Recordings -->
        <div v-show="recordings.length > 0" class="col-3 recordings">
            <div class="recordings-list">
                <v-multiselect
                    v-bind:options="recordings"
                    v-model="recording"
                    track-by="id"
                    label="name"
                    v-bind:placeholder="$t('login.recordings-placeholder')"
                    v-tooltip.left="{ content: $t('login.recordings-tooltip') }"
                    v-bind:searchable="false"
                    v-bind:allow-empty="true"
                    v-bind:open-direction="'bottom'"
                    v-bind:max-height="200"
                ></v-multiselect>
            </div>
            <div class="recordings-button-play box button"
                v-on:click="recordingPlay"
                v-tooltip.bottom="{ content: $t('login.recordings-play-tooltip') }"
                v-bind:class="{ disabled: recording === null }">
                <div class="icon">
                    <i class="fas fa-play-circle"></i>
                </div>
            </div>
            <div class="recordings-button-delete box button"
                v-on:click="recordingDelete"
                v-tooltip.right="{ content: $t('login.recordings-delete-tooltip') }"
                v-bind:class="{ disabled: recording === null }">
                <div class="icon">
                    <i class="fas fa-trash-alt"></i>
                </div>
            </div>
        </div>

        <!-- About, Settings, Update -->
        <div class="col-3 button-row">
            <div class="box button settings"
                v-bind:class="{ active: activeSettings }"
                v-tooltip.bottom="{ content: $t('login.settings-tooltip') }"
                v-on:click="settings">
                <i class="icon fas fa-user-cog"></i>
                <div class="title">{{ $t("login.settings-subtitle") }}</div>
            </div>
            <div class="box button logo"
                v-tooltip.bottom="{ content: $t('login.about-tooltip') }"
                v-on:click="about">
                <div ref="logo" class="logo-container">
                    <img v-bind:src="logo1" class="logo logo1" alt="LiVE"/>
                    <img v-bind:src="logo2" class="logo logo2" alt="LiVE"/>
                </div>
                <div class="title">Receiver {{ version }}</div>
            </div>
            <div class="box button update"
                v-bind:class="{ active: activeUpdate }"
                v-tooltip.bottom="{ content: $t('login.updates-tooltip') }"
                v-on:click="update">
                <i class="icon fas fa-cloud-download-alt"></i>
                <div class="title">{{ $t("login.updates-subtitle") }}</div>
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
    box-shadow: 0px 5px 20px var(--color-std-bg-2);
    padding: 20px;
    border-radius: 5px;
    display: grid;
    grid-template-columns: 30px 160px 300px;
    row-gap: 4px;
    font-size: 12pt;

    >.icon {
        color: var(--color-std-fg-1);
        padding-top: 4px;
    }
    .label {
        display: flex;
        font-weight: 300;
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
    .headline {
        margin-bottom: 10px;
        font-size: 18pt;
        font-weight: 300;
    }

    /*  text input field  */
    .input-field {
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
    .box.button.login-button {
        margin-top: 2px;
        width: calc(100% - 20px);
        height: 30px;
        color:            var(--color-std-fg-3);
        background-color: var(--color-std-bg-4);
        border-top:    1px solid var(--color-std-bg-5);
        border-left:   1px solid var(--color-std-bg-5);
        border-right:  1px solid var(--color-std-bg-1);
        border-bottom: 1px solid var(--color-std-bg-1);
        font-size: 16pt;
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
        .login-button-icon {
            position: relative;
            top: 1px;
            padding-left: 10px;
        }
    }
    .error {
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
    .button-row {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-top: 2px;
        .button.logo {
            width: 94px;
            height: 62px;
            background-color: var(--color-std-bg-4);
            border-radius: 5px;
            position: relative;
            .logo-container {
                position: absolute;
                left: 18px;
                perspective: 0px;
                width: 60px;
                margin-top: 10px;
                margin-left: 0px;
                .logo {
                    transform-origin: 50% 50%;
                    transform-style:  preserve-3d;
                    width: 60px;
                    &.logo1 {
                        display: block;
                    }
                    &.logo2 {
                        display: none;
                    }
                }
            }
            &:hover {
                background-color: var(--color-sig-bg-4);
                color: var(--color-sig-fg-3);
                .logo-container {
                    .logo {
                        &.logo1 {
                            display: none;
                        }
                        &.logo2 {
                            display: block;
                        }
                    }
                }
            }
        }
        .button.update,
        .button.settings {
            width: 94px;
            height: 62px;
            background-color: var(--color-std-bg-4);
            border-radius: 5px;
            &.active {
                background-color: var(--color-acc-bg-3);
                color: var(--color-acc-fg-3);
            }
            &:hover {
                background-color: var(--color-sig-bg-4);
                color: var(--color-sig-fg-3);
            }
            .icon {
                margin-top: 4px;
                font-size: 28pt;
            }
        }
        .button .title {
            font-size: 8pt;
        }
    }

    .recordings {
        display: flex;
        flex-direction: row;
        justify-items: flex-start;
        .recordings-list {
            width: 220px;
            height: 40px;
            .multiselect__single {
                font-size: 10pt;
            }
            .multiselect__option {
                font-size: 10pt;
            }
        }
        .recordings-button-play,
        .recordings-button-delete {
            width: 40px;
            height: 40px;
            margin-left: 4px;
            background-color: var(--color-std-bg-4);
            border-radius: 5px;
            position: relative;
            &:hover {
                background-color: var(--color-sig-bg-4);
                color: var(--color-sig-fg-3);
            }
            &.disabled {
                color:            var(--color-std-fg-1);
                background-color: var(--color-std-bg-4);
            }
            .icon {
                position: absolute;
                top: 7px;
                left: 0px;
            }
        }
    }
}
</style>

<script>
module.exports = {
    name: "login",

    /*  component static properties  */
    props: {
        liveRelayServer:      { type: String, default: "" },
        liveAccessToken:      { type: String, default: "" }
    },

    /*  component variable properties  */
    data: function () {
        return {
            intLiveRelayServer:      this.liveRelayServer,
            intLiveAccessToken:      this.liveAccessToken,
            allowConnect:            true,
            logo1:                   ui.logo1,
            logo2:                   ui.logo2,
            version:                 ui.pkg.version,
            error:                   "",
            blinkUpdate:             "none",
            activeUpdate:            false,
            blinkSettings:           false,
            activeSettings:          false,
            recordings:              [],
            recording:               null
        }
    },

    /*  component computed properties  */
    computed: {
        style: ui.vueprop2cssvar()
    },

    /*  component property observation  */
    watch: {
        intLiveRelayServer: function (v) { this.$emit("update:live-relay-server", v) },
        intLiveAccessToken: function (v) { this.$emit("update:live-access-token", v) }
    },

    /*  component sub-components  */
    components: {
        "portrait": "url:app-ui-widget-portrait.vue"
    },

    /*  component methods  */
    methods: {
        /*  handle about  */
        about () {
            this.$emit("about")
        },

        /*  handle settings  */
        settings () {
            this.$emit("settings")
        },

        /*  handle update check  */
        update () {
            this.$emit("update")
        },

        /*  handle login  */
        login () {
            if (this.intLiveRelayServer === "" || this.intLiveAccessToken === "" || !this.allowConnect)
                return

            /*  prevent hammering connect button  */
            this.allowConnect = false
            setTimeout(() => {
                this.allowConnect = true
            }, 2 * 1000)

            /*  raise login event  */
            this.$emit("login")
        },

        /*  handle recording play  */
        recordingPlay () {
            if (this.recording === null)
                return

            /*  raise play event  */
            this.$emit("recording-play", this.recording.id)
        },

        /*  handle recording delete  */
        recordingDelete () {
            if (this.recording === null)
                return

            /*  raise delete event  */
            this.$emit("recording-delete", this.recording.id)
        }
    },

    /*  component DOM mounting hook  */
    async mounted () {
        /*  raise errors  */
        this.$on("error", (error) => {
            ui.soundfx.play("error3")
            this.error = error
            setTimeout(() => {
                this.error = ""
            }, 4 * 1000)
        })

        /*  react on deep-link scenario  */
        this.$on("deep-link", (liveRelayServer, liveAccessToken) => {
            this.intLiveRelayServer = liveRelayServer
            this.intLiveAccessToken = liveAccessToken
            this.$refs.login.focus()
        })

        /*  load recordings  */
        const loadRecordings = async () => {
            this.recordings = (await ui.recordings())
                .map((x) => {
                    x.start = dayjs(x.start)
                    const duration = dayjs.utc(x.duration * 1000)
                    x.name = `${x.start.format("YYYY-MM-DD HH:mm:ss")} ${duration.format("HH:mm:ss")}`
                    return x
                })
                .sort((a, b) => {
                    if (a.start.isSame(b.start))
                        return 0
                    else if (a.start.isAfter(b.start))
                        return -1
                    else
                        return +1
                })
            if (this.recordings.length > 0 && this.recording === null)
                this.recording = this.recordings[0]
        }
        this.$on("recordings-update", () => {
            loadRecordings()
        })
        this.$on("recordings-renew", () => {
            this.recording = null
            loadRecordings()
        })
        await loadRecordings()

        /*  animate logo  */
        const animation = anime({
            targets:  this.$refs.logo,
            duration: 4 * 1000,
            easing:   "easeInOutQuad",
            autoplay: false,
            loop:     true,
            delay:    10 * 1000,
            rotateY:  [ 0, 360 ]
        })
        animation.play()
        this.$on("enable", async () => {
            animation.play()
            await loadRecordings()
        })
        this.$on("disable", () => {
            animation.pause()
        })

        /*  support blinking update button  */
        let timerUpdate = null
        this.$on("blink-update", (type) => {
            this.blinkUpdate = type
            if (this.blinkUpdate !== "none" && !timerUpdate)
                timerUpdate = setInterval(() => { this.activeUpdate = !this.activeUpdate },
                    this.blinkUpdate === "soft" ? 1200 : 300)
            else if (this.blinkUpdate === "none" && timerUpdate) {
                clearTimeout(timerUpdate)
                timerUpdate = null
                this.activeUpdate = false
            }
        })

        /*  support blinking settings button  */
        let timerSettings = null
        this.$on("blink-settings", (enable) => {
            this.blinkSettings = enable
            if (this.blinkSettings && !timerSettings)
                timerSettings = setInterval(() => { this.activeSettings = !this.activeSettings }, 1000)
            else if (!this.blinkSettings && timerSettings) {
                clearTimeout(timerSettings)
                timerSettings = null
                this.activeSettings = false
            }
        })
    }
}
</script>

