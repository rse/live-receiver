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
        <!-- title -->
        <div class="col-2 notice">
        </div>
        <div class="title">
            Your Connection
        </div>

        <!-- LiVE Relay Server -->
        <i class="icon fa fa-globe"></i>
        <div class="label">LiVE Relay Server</div>
        <input
            ref="liveRelayServer"
            type="text"
            placeholder="Enter your LiVE relay server FQDN..."
            v-model="intLiveRelayServer"
            v-on:keyup.escape="intLiveRelayServer = ''"
            v-on:keyup.enter="$refs.liveAccessToken.focus()"
        />

        <!-- LiVE Access Token -->
        <i class="icon fa fa-key"></i>
        <div class="label">LiVE Access Token</div>
        <input
            ref="liveAccessToken"
            type="text"
            placeholder="Enter your LiVE access token..."
            v-model="intLiveAccessToken"
            v-on:keyup.escape="intLiveAccessToken = ''"
            v-on:keyup.enter="$refs.login.focus()"
        />

        <!-- Connect -->
        <input class="col-3"
            v-bind:disabled="
                intLiveRelayServer === '' ||
                intLiveAccessToken === '' ||
                !allowConnect"
            ref="login"
            type="submit"
            value="Connect"
            v-on:click="login"
        />

        <!-- Optional Error -->
        <div v-show="error !== ''" class="col-3 error" v-html="error">
        </div>

        <!-- Logo & GDPR Notice -->
        <div class="col-2 notice">
            <img v-bind:src="logo" class="logo" alt="LiVE"/>
            <div class="version">Receiver {{ version }}</div>
        </div>
        <div class="footnote notice">
            Please enter the <b>LiVE Relay Server</b> Fully Qualified
            Domain Name (FQDN) like <tt>live.example.com</tt>) and
            the <b>LiVE Access Token</b>, like <tt>example-XXXX-XXXX</tt>, you received.
            Alternatively, you can deep-link into this dialog of <b>LiVE Receiver</b>
            through an external URL, like <tt>live://live.example.com/example-XXXX-XXXX</tt>.
        </div>

        <div class="col-2 settings">
            <div class="box button" v-on:click="settings">
                <i class="icon fa fa-users-cog"></i>
            </div>
        </div>
        <div class="footnote notice">
            At first use of <b>LiVE Receiver</b>, or at least before you are connecting
            the first time, please ensure that you have configured your personal name
            and local audio devices in the user settings correctly. Please open the
            <b>Settings</b> dialog with the button on the left side or in the top-left
            corner of the window for this.
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
        font-size: 20pt;
        font-weight: bold;
    }
    .notice {
        margin-top: 10px;
        .logo {
            width: 100px;
        }
    }
    .logo-container {
        margin-left: 100px;
        margin-bottom: 20px;
        .logo {
            height: 50px;
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
    .settings {
        .button {
            margin-top: 10px;
            width: 50px;
            height: 50px;
            padding-left: 10px;
            background-color: var(--color-std-bg-4);
            &:hover {
                background-color: var(--color-sig-bg-4);
            }
            .icon {
                margin-top: 5px;
                font-size: 24pt;
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
            logo:                    ui.logo,
            version:                 ui.pkg.version,
            error:                   ""
        }
    },

    /*  component computed properties  */
    computed: {
        style: ui.vueprop2cssvar()
    },

    /*  component property observation  */
    watch: {
        intLiveRelayServer:      function (v) { this.$emit("update:live-relay-server", v) },
        intLiveAccessToken:      function (v) { this.$emit("update:live-access-token", v) }
    },

    /*  component sub-components  */
    components: {
        "portrait": "url:app-ui-3-widget-portrait.vue"
    },

    /*  component methods  */
    methods: {
        /*  handle settings  */
        settings () {
            this.$emit("settings")
        },

        /*  handle login  */
        login () {
            /*  prevent hammering connect button  */
            this.allowConnect = false
            setTimeout(() => {
                this.allowConnect = true
            }, 2 * 1000)

            /*  raise login event  */
            this.$emit("login")
        }
    },

    /*  component DOM mounting hook  */
    mounted () {
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
    }
}
</script>

