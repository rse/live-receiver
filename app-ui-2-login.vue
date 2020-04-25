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
    <div v-bind:style="style" class="login">
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
        <div class="login-row server">
            <div class="login-col label">
                <i class="icon fa fa-globe"></i>
                LiVE Relay Server:
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
        <div class="login-row submit">
            <div class="login-col label">
            </div>
            <div class="login-col input">
                <input
                    v-bind:disabled="
                        intPersonPortrait  === '' ||
                        intPersonName      === '' ||
                        intLiveRelayServer === '' ||
                        intLiveAccessToken === ''   "
                    ref="login"
                    type="submit"
                    value="Connect"
                    v-on:click="login"
                />
            </div>
        </div>
        <div v-show="error !== ''" class="login-row error">
            <div class="login-col label">
            </div>
            <div class="login-col error">
                ERROR: {{ error }}
            </div>
        </div>
        <div class="login-row notice">
            <div class="login-col label">
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
        margin-bottom: 10px;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        .login-col {
            display: flex;
            flex-direction: column;
            &.label {
                display: flex;
                flex-direction: row;
                width: 180px;
                .icon {
                    color: var(--color-std-fg-1);
                    margin-right: 10px;
                    position: relative;
                    top: 4px;
                }
            }
            &.input {
                width: 300px;
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
}
</style>

<script>
module.exports = {
    name: "login",
    props: {
        personPortrait:  "",
        personName:      "",
        liveRelayServer: "",
        liveAccessToken: ""
    },
    data: function () {
        return {
            intPersonPortrait:  this.personPortrait,
            intPersonName:      this.personName,
            intLiveRelayServer: this.liveRelayServer,
            intLiveAccessToken: this.liveAccessToken,
            error:              ""
        }
    },
    watch: {
        personPortrait:     function (v) { this.intPersonPortrait = v },
        personName:         function (v) { this.intPersonName = v },
        liveRelayServer:    function (v) { this.intLiveRelayServer = v },
        liveAccessToken:    function (v) { this.intLiveAccessToken = v },
        intPersonPortrait:  function (v) { this.$emit("update:person-portrait", v) },
        intPersonName:      function (v) { this.$emit("update:person-name", v) },
        intLiveRelayServer: function (v) { this.$emit("update:live-relay-server", v) },
        intLiveAccessToken: function (v) { this.$emit("update:live-access-token", v) }
    },
    computed: {
        style: ui.vueprop2cssvar()
    },
    components: {
        "portrait": "url:app-ui-2-portrait.vue"
    },
    methods: {
        login () {
            this.$emit("login")
        }
    },
    mounted () {
        this.$on("error", (error) => {
            this.error = error
            setTimeout(() => {
                this.error = ""
            }, 4 * 1000)
        })
    }
}
</script>

