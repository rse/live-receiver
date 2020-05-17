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
    <div ref="win" v-if="loaded" v-bind:style="style" class="win">
        <!-- ---- HEADER ---- -->
        <div ref="header" class="header">
            <!-- disconnect -->
            <div class="box button logout" v-on:click="logout"
                v-bind:class="{ disabled: inLogin || !allowDisconnect }">
                <i class="icon fa fa-arrow-alt-circle-left"></i>
                <span class="title">Disconnect</span>
            </div>

            <!-- bandwidth -->
            <div class="box bandwidth"
                v-bind:class="{ disabled: inLogin, active: !inLogin }">
                <span class="word">{{ inLogin ? "---" : bandwidthText }}</span>
                <span class="title">kbps</span>
            </div>

            <!-- audio mute -->
            <div class="box button mute" v-on:click="volumeMute = volume === 0 ? volumeMute : !volumeMute"
                v-bind:class="{ disabled: inLogin || volume === 0, active: volumeMute }">
                <span v-show="volumeMute"><i class="icon fa fa-volume-mute"></i></span>
                <span v-show="!volumeMute && volume < 30"><i class="icon fa fa-volume-down"></i></span>
                <span v-show="!volumeMute && volume >= 30"><i class="icon fa fa-volume-up"></i></span>
                <span class="title">Audio Mute</span>
            </div>

            <!-- audio volume -->
            <div class="box slider volume" v-bind:class="{ disabled: inLogin }">
                <input ref="volume"
                    v-bind:disabled="inLogin"
                    class="volume"
                    type="range"
                    min="0" max="100"
                    v-model.number="volume"/>
                <span class="title">Audio Volume</span>
            </div>

            <!-- move window -->
            <div class="box move">
                <div class="logo">
                    <img v-bind:src="logo" alt="LiVE"/>
                </div>
                <div class="grab-container">
                    <span class="grab grab-1"></span>
                    <span class="grab grab-2"></span>
                    <span class="grab grab-3"></span>
                    <span class="grab grab-4"></span>
                    <span class="grab grab-5"></span>
                    <span class="title">Move Window</span>
                </div>
            </div>

            <!-- smallest size -->
            <div class="box button fit" v-on:click="smallestSize"
                v-bind:class="{ disabled: isWinSmallest || fullscreened || maximized }">
                <i class="icon fa fa-compress"></i>
                <span class="title">Smallest Size</span>
            </div>

            <!-- source size -->
            <div class="box button fit" v-on:click="sourceSize"
                v-bind:class="{ disabled: inLogin || fullscreened || maximized }">
                <i class="icon fa fa-expand"></i>
                <span class="title">Native Size</span>
            </div>

            <!-- minimize -->
            <div class="box button minimize" v-on:click="minimize"
                v-bind:class="{ disabled: fullscreened || maximized }">
                <i class="icon fa fa-window-minimize"></i>
                <span class="title">Minimize</span>
            </div>

            <!-- maximize -->
            <div class="box button maximize" v-on:click="maximize"
                v-bind:class="{ disabled: fullscreened, active: maximized }">
                <i class="icon fa fa-window-maximize"></i>
                <span class="title">Maximize</span>
            </div>

            <!-- fullscreen -->
            <div class="box button fullscreen" v-on:click="fullscreen"
                v-bind:class="{ disabled: maximized, active: fullscreened }">
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
                v-show="!inLogin && !inSettings"
                class="video">
                <videostream
                    ref="videostream"
                />
            </div>

            <!-- login dialog -->
            <div v-show="inLogin && !inSettings" class="login">
                <login
                    ref="login"
                    v-bind:live-relay-server.sync="liveRelayServer"
                    v-bind:live-access-token.sync="liveAccessToken"
                    v-on:settings="settingsOpen"
                    v-on:login="login"
                />
            </div>

            <!-- settings dialog -->
            <div v-show="inSettings" class="settings">
                <settings
                    ref="settings"
                    v-bind:person-portrait.sync="personPortrait"
                    v-bind:person-name.sync="personName"
                    v-bind:live-stream-buffering.sync="liveStreamBuffering"
                    v-bind:audio-input-device.sync="audioInputDevice"
                    v-bind:audio-output-device.sync="audioOutputDevice"
                    v-on:save="settingsClose"
                />
            </div>
        </div>

        <!-- ---- FOOTER ---- -->
        <div ref="footer" class="footer">
            <!-- audio record -->
            <div class="box button audio-record" v-on:click="audioRecordOrPlay"
                v-tooltip.top-center="{
                    html: true,
                    content: recordText,
                    show: recordTextShow && !inLogin || recordState > 0 || audioRecording,
                    trigger: 'manual',
                    hideOnTargetClick: false,
                    autoHide: false,
                    offset: 10
                }"
                v-on:mouseover="recordTextShow = true"
                v-on:mouseleave="recordTextShow = false"
                v-bind:class="{
                    disabled: inLogin || audioInputDevice === '' || audioOutputDevice === '' || votingActive,
                    active: audioRecording || audioPlaying || audioBlob !== null
                }">
                <span v-show="!audioRecording && audioBlob === null"><i class="icon fa fa-dot-circle"></i></span>
                <span v-show=" audioRecording && audioBlob === null"><i class="icon fa fa-stop-circle"></i></span>
                <span v-show="!audioPlaying   && audioBlob !== null"><i class="icon fa fa-play-circle"></i></span>
                <span v-show=" audioPlaying   && audioBlob !== null"><i class="icon fa fa-stop-circle"></i></span>
                <span v-show="!audioRecording && audioBlob === null" class="title">Record Message</span>
                <span v-show=" audioRecording && audioBlob === null" class="title">Stop Recording</span>
                <span v-show="!audioPlaying   && audioBlob !== null" class="title">Play Message</span>
                <span v-show=" audioPlaying   && audioBlob !== null" class="title">Stop Playing</span>
            </div>

            <!-- enter message -->
            <div class="box message-text" v-bind:class="{ disabled: inLogin, active: message !== '' }">
                <span v-show="!votingActive || votingActive && votingType === 'propose'">
                    <input
                        v-bind:disabled="inLogin"
                        ref="message"
                        type="text"
                        v-bind:placeholder="votingActive ? 'Type vote...' : 'Type message...'"
                        v-model="message"
                        v-on:keyup.enter="sendMessage"
                        v-on:keyup.escape="clearMessage(false)"
                    />
                </span>
                <div v-show="votingActive && votingType === 'judge'"
                    v-bind:class="{ 'choice-row': true, disabled: votingDone }">
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 1 }"
                        v-on:click="sendChoice(1, 'yes')">
                        <span class="choice-icon"><i class="fa fa-thumbs-up"></i></span>Yes
                    </div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 2 }"
                        v-on:click="sendChoice(2, 'no')">
                        <span class="choice-icon"><i class="fa fa-thumbs-down"></i></span>No
                    </div>
                </div>
                <div v-show="votingActive && votingType === 'evaluate'"
                    v-bind:class="{ 'choice-row': true, disabled: votingDone }">
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 1 }"
                        v-on:click="sendChoice(1, '-2')">
                        <span class="choice-icon"><i class="fa fa-sad-cry"></i></span>-2
                    </div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 2 }"
                        v-on:click="sendChoice(2, '-1')">
                        <span class="choice-icon"><i class="fa fa-frown"></i></span>-1
                    </div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 3 }"
                        v-on:click="sendChoice(3, '0')">
                        <span class="choice-icon"><i class="fa fa-meh"></i></span>0
                    </div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 4 }"
                        v-on:click="sendChoice(4, '+1')">
                        <span class="choice-icon"><i class="fa fa-smile"></i></span>+1
                    </div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 5 }"
                        v-on:click="sendChoice(5, '+2')">
                        <span class="choice-icon"><i class="fa fa-grin-stars"></i></span>+2
                    </div>
                </div>
                <div v-show="votingActive && votingType === 'choose'"
                    v-bind:class="{ 'choice-row': true, disabled: votingDone }">
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 1 }"
                         v-on:click="sendChoice(1, '1')">1</div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 2 }"
                         v-on:click="sendChoice(2, '2')">2</div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 3 }"
                         v-on:click="sendChoice(3, '3')">3</div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 4 }"
                         v-on:click="sendChoice(4, '4')">4</div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 5 }"
                         v-on:click="sendChoice(5, '5')">5</div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 6 }"
                         v-on:click="sendChoice(6, '6')">6</div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 7 }"
                         v-on:click="sendChoice(7, '7')">7</div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 8 }"
                         v-on:click="sendChoice(8, '8')">8</div>
                    <div v-bind:class="{ 'choice-box': true, active: votingChoice === 9 }"
                         v-on:click="sendChoice(9, '9')">9</div>
                </div>
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

            <!-- send surprise -->
            <div class="box button message-send" v-on:click="feedback('surprise')"
                v-bind:class="{ disabled: inLogin || feedbackDisabled }">
                <i class="icon fa fa-surprise"></i>
                <span class="title">Show Surprise</span>
            </div>

            <!-- send smile -->
            <div class="box button message-send" v-on:click="feedback('smile')"
                v-bind:class="{ disabled: inLogin || feedbackDisabled }">
                <i class="icon fa fa-grin-wink"></i>
                <span class="title">Show Smile</span>
            </div>

            <!-- send frown -->
            <div class="box button message-send" v-on:click="feedback('frown')"
                v-bind:class="{ disabled: inLogin || feedbackDisabled }">
                <i class="icon fa fa-angry"></i>
                <span class="title">Show Frown</span>
            </div>

            <!-- send sadness -->
            <div class="box button message-send" v-on:click="feedback('sadness')"
                v-bind:class="{ disabled: inLogin || feedbackDisabled }">
                <i class="icon fa fa-sad-tear"></i>
                <span class="title">Show Sadness</span>
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
                    v-model.number="challenge"/>
                <span class="title">My Challenge</span>
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
                    v-model.number="mood"/>
                <span class="title">My Mood</span>
            </div>

            <!-- move window -->
            <div class="box move">
                <div class="grab-container">
                    <span class="grab grab-1"></span>
                    <span class="grab grab-2"></span>
                    <span class="grab grab-3"></span>
                    <span class="grab grab-4"></span>
                    <span class="grab grab-5"></span>
                </div>
                <span class="title">Move Window</span>
            </div>
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
    color: var(--color-std-fg-3);
    font-family: "TypoPRO Source Sans Pro";
    font-size: 10pt;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;

    /*  header/footer box  */
    .box {
        width: 58px;
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
        &:hover.disabled {
            background-color:        var(--color-std-bg-3);
            border-top:    1px solid var(--color-std-bg-5);
            border-left:   1px solid var(--color-std-bg-5);
            border-right:  1px solid var(--color-std-bg-1);
            border-bottom: 1px solid var(--color-std-bg-1);
            .icon  { color:          var(--color-std-fg-1); }
            .word  { color:          var(--color-std-fg-1); }
            .title { color:          var(--color-std-fg-1); }
        }
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
                    background-color:        var(--color-std-fg-2);
                    border-top:    1px solid var(--color-std-fg-3);
                    border-left:   1px solid var(--color-std-fg-3);
                    border-right:  1px solid var(--color-std-fg-1);
                    border-bottom: 1px solid var(--color-std-fg-1);
                }
            }
            &.challenge.range3 {
                &::-webkit-slider-thumb {
                    background-color:        var(--color-acc-bg-5);
                    border-top:    1px solid var(--color-acc-bg-5);
                    border-left:   1px solid var(--color-acc-bg-5);
                    border-right:  1px solid var(--color-acc-bg-4);
                    border-bottom: 1px solid var(--color-acc-bg-4);
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
                    background-color:        var(--color-sig-bg-5);
                    border-top:    1px solid var(--color-sig-bg-5);
                    border-left:   1px solid var(--color-sig-bg-5);
                    border-right:  1px solid var(--color-sig-bg-4);
                    border-bottom: 1px solid var(--color-sig-bg-4);
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
                    background-color:        var(--color-acc-bg-5);
                    border-top:    1px solid var(--color-acc-bg-5);
                    border-left:   1px solid var(--color-acc-bg-5);
                    border-right:  1px solid var(--color-acc-bg-4);
                    border-bottom: 1px solid var(--color-acc-bg-4);
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
        &:hover {
            input[type="range"] {
                background-color: var(--color-sig-bg-3);
                &::-webkit-slider-runnable-track {
                    background-color: var(--color-sig-bg-3);
                    border-top:    1px solid var(--color-sig-bg-1);
                    border-left:   1px solid var(--color-sig-bg-1);
                    border-right:  1px solid var(--color-sig-bg-5);
                    border-bottom: 1px solid var(--color-sig-bg-5);
                }
            }
            &.disabled {
                input[type="range"] {
                    background-color: var(--color-std-bg-3);
                    &::-webkit-slider-runnable-track {
                        background-color: var(--color-std-bg-3);
                        border-top:    1px solid var(--color-std-bg-1);
                        border-left:   1px solid var(--color-std-bg-1);
                        border-right:  1px solid var(--color-std-bg-5);
                        border-bottom: 1px solid var(--color-std-bg-5);
                    }
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
    }

    /*  move window  */
    .move {
        flex-grow: 1;
        padding-top: 6px;
        height: calc(100% - 6px);
        position: relative;
        .logo {
            position: absolute;
            left: 0;
            top: 6px;
            width: 100%;
            text-align: center;
            img {
                height: 13px;
            }
        }
        .grab-container {
             -webkit-app-region: drag;
             -webkit-user-select: none;
            .grab {
                height: 1px;
                width: calc(100% - 20px);
                margin: 0px 10px 0px 10px;
                display: block;
                border-top:    1px solid var(--color-std-bg-1);
                border-bottom: 1px solid var(--color-std-bg-5);
            }
            &:hover {
                cursor: grab;
            }
        }
    }
    .header .move {
    }
    .footer .move {
        width: 60px;
        max-width: 60px;
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
            input[type="text"] {
                width: calc(100% - 20px);
                height: 100%;
                font-size: 12pt;
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
            &.active {
                input[type="text"] {
                    color:                   var(--color-acc-fg-3);
                    background-color:        var(--color-acc-bg-3);
                    border-top:    1px solid var(--color-acc-bg-1);
                    border-left:   1px solid var(--color-acc-bg-1);
                    border-right:  1px solid var(--color-acc-bg-5);
                    border-bottom: 1px solid var(--color-acc-bg-5);
                }
            }
            &.disabled {
                input[type="text"] {
                    &::placeholder {
                        color: var(--color-std-bg-5);
                    }
                    &:hover, &:focus {
                        color:                   var(--color-std-fg-3);
                        background-color:        var(--color-std-bg-3);
                        border-top:    1px solid var(--color-std-bg-1);
                        border-left:   1px solid var(--color-std-bg-1);
                        border-right:  1px solid var(--color-std-bg-5);
                        border-bottom: 1px solid var(--color-std-bg-5);
                    }
                }
            }
            .choice-row {
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
                height: 100%;
                width:  100%;
                margin-left: 4px;
                .choice-box {
                    color:                   var(--color-std-fg-3);
                    background-color:        var(--color-std-bg-3);
                    border-top:    1px solid var(--color-std-bg-5);
                    border-left:   1px solid var(--color-std-bg-5);
                    border-right:  1px solid var(--color-std-bg-1);
                    border-bottom: 1px solid var(--color-std-bg-1);
                    border-radius: 5px;
                    padding: 0px 12px 0px 12px;
                    margin-right: 2px;
                    font-family: "TypoPRO Source Sans Pro";
                    font-size: 14pt;
                    font-weight: bold;
                    .choice-icon {
                        font-size: 12pt;
                        color: var(--color-std-fg-1);
                        padding-right: 5px;
                    }
                    &.active {
                        color:                   var(--color-acc-fg-3);
                        background-color:        var(--color-acc-bg-3);
                        border-top:    1px solid var(--color-acc-bg-5);
                        border-left:   1px solid var(--color-acc-bg-5);
                        border-right:  1px solid var(--color-acc-bg-1);
                        border-bottom: 1px solid var(--color-acc-bg-1);
                        .choice-icon {
                            color: var(--color-acc-fg-1);
                        }
                    }
                    &:hover {
                        color:                   var(--color-sig-fg-5);
                        background-color:        var(--color-sig-bg-3);
                        border-top:    1px solid var(--color-sig-bg-5);
                        border-left:   1px solid var(--color-sig-bg-5);
                        border-right:  1px solid var(--color-sig-bg-1);
                        border-bottom: 1px solid var(--color-sig-bg-1);
                        .choice-icon {
                            color: var(--color-sig-fg-1);
                        }
                    }
                }
                &.disabled {
                    .choice-box {
                        color:                   var(--color-std-fg-3);
                        background-color:        var(--color-std-bg-3);
                        border-top:    1px solid var(--color-std-bg-5);
                        border-left:   1px solid var(--color-std-bg-5);
                        border-right:  1px solid var(--color-std-bg-1);
                        border-bottom: 1px solid var(--color-std-bg-1);
                        .choice-icon {
                            color: var(--color-std-fg-1);
                        }
                        &.active {
                            color:                   var(--color-acc-fg-3);
                            background-color:        var(--color-acc-bg-3);
                            border-top:    1px solid var(--color-acc-bg-5);
                            border-left:   1px solid var(--color-acc-bg-5);
                            border-right:  1px solid var(--color-acc-bg-1);
                            border-bottom: 1px solid var(--color-acc-bg-1);
                            .choice-icon {
                                color: var(--color-acc-fg-1);
                            }
                        }
                    }
                }
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
        loaded:                false,
        inLogin:               true,
        inSettings:            false,
        allowDisconnect:       true,
        personPortrait:        "",
        personName:            "",
        liveRelayServer:       "",
        liveAccessToken:       "",
        liveStreamBuffering:   0,
        audioInputDevice:      "",
        audioOutputDevice:     "",
        logo:                  ui.logo,
        audioBlob:             null,
        audioBlobChunks:       [],
        audioRecording:        false,
        audioPlaying:          false,
        audioDuration:         0,
        message:               "",
        fullscreened:          false,
        maximized:             false,
        volume:                100,
        volumeMute:            false,
        recordState:           0,
        recordTextShow:        false,
        mood:                  3,
        moodTextShow:          false,
        challenge:             3,
        challengeTextShow:     false,
        bandwidthBytes:        0,
        bandwidthText:         "",
        videoSize:             { w: 0, h: 0 },
        timer1:                null,
        timer2:                null,
        isWinSmallest:         false,
        feedbackDisabled:      false,
        votingActive:          false,
        votingType:            "propose",
        votingDone:            false,
        votingChoice:          ""
    }),

    /*  component computed properties  */
    computed: {
        style: ui.vueprop2cssvar(),
        recordText () {
            let html
            if (this.audioBlob === null) {
                if (this.recordState === 0 && this.audioBlob !== null)
                    html = "Press to record your<br/>audio message again."
                else if (this.recordState === 0 && this.audioBlob === null)
                    html = "Press to record your<br/>audio message."
                else if (this.recordState === 1)
                    html = "<b>PLEASE WAIT</b> &mdash; audio output soon will be muted<br/>" +
                        "and recording your message starts in <b class='attention-boxed'>3</b> seconds..."
                else if (this.recordState === 2)
                    html = "<b>PLEASE WAIT</b> &mdash; audio output soon will be muted<br/>" +
                        "and recording your message starts in <b class='attention-boxed'>2</b> seconds..."
                else if (this.recordState === 3)
                    html = "<b>PLEASE WAIT</b> &mdash; audio output soon will be muted<br/>" +
                        "and recording your message starts in <b class='attention-boxed'>1</b> second..."
                else if (this.recordState === 4)
                    html = "<span class='attention-boxed'>NOW PLEASE SPEAK!</span> &mdash; Press again<br/>to stop your message recording."
            }
            else {
                if (this.audioPlaying)
                    html = "Press to stop playing<br/>your audio message."
                else
                    html = "Press to play and check<br/>your recorded audio message.<br/>" +
                        `(duration: <b class='attention-boxed'>${this.audioDuration.toFixed(1)}</b> seconds)`
            }
            return html
        },
        challengeText () {
            let html = "I am <i>content-wise</i><br/><b>"
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
            let html = "I am <i>mentally</i><br/><b>"
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
            this.volumeMute = (v === 0)
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
        "settings":    "url:app-ui-3-widget-settings.vue",
        "videostream": "url:app-ui-5-widget-videostream.vue"
    },

    /*  component methods  */
    methods: {
        /*  message handling  */
        async sendChoice (activate, choice) {
            if (this.votingDone)
                return
            this.message = choice
            this.sendMessage()
            this.votingChoice = activate
            this.votingDone = true
        },
        async sendMessage () {
            if (this.votingDone)
                return
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
            if (!(this.message !== "" || this.audioBlob !== null))
                return
            this.message = ""
            if (withAudio)
                this.audioBlob = null
            this.$refs.message.blur()
        },
        feedback (type) {
            if (this.feedbackDisabled)
                return
            this.$emit("feedback", type)
            this.feedbackDisabled = true
            setTimeout(() => {
                this.feedbackDisabled = false
            }, 60 * 1000)
        },
        sendFeeling () {
            this.$emit("feeling", {
                challenge: this.challenge,
                mood:      this.mood
            })
        },

        /*  settings handling */
        settingsOpen () {
            if (!this.inLogin || this.inSettings)
                return
            this.inSettings = true
        },
        settingsClose () {
            if (!this.inSettings)
                return
            this.inSettings = false
            this.$emit("save-settings", {
                personPortrait:       this.personPortrait,
                personName:           this.personName,
                liveStreamBuffering:  this.liveStreamBuffering,
                audioInputDevice:     this.audioInputDevice,
                audioOutputDevice:    this.audioOutputDevice
            })
        },

        /*  login/connect and logout/disconnect handling  */
        login () {
            if (!this.inLogin)
                return
            const missingSettings = (name) => {
                this.$refs.login.$emit("error",
                    `Please configure your <b>${name}</b> ` +
                    "in the <b>Settings</b> dialog first."
                )
            }
            if (this.personPortrait      === "") { missingSettings("Personal Portrait");      return }
            if (this.personName          === "") { missingSettings("Personal Name");          return }
            if (this.liveStreamBuffering === 0)  { missingSettings("Video Stream Buffering"); return }
            this.$emit("login", {
                liveRelayServer:      this.liveRelayServer,
                liveAccessToken:      this.liveAccessToken
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
        minimize (event) {
            if (this.fullscreened || this.maximized)
                return
            this.$emit("minimize")
        },
        maximize (event) {
            if (this.fullscreened)
                return
            this.maximized = !this.maximized
            this.$emit("maximize")
        },
        fullscreen (event) {
            if (this.maximized)
                return
            this.fullscreened = !this.fullscreened
            this.$emit("fullscreen")
        },
        smallestSize () {
            if (this.fullscreened || this.maximized)
                return
            this.$emit("set-size", { w: 1000, h: 650 })
        },
        sourceSize () {
            if (this.fullscreened || this.maximized || this.inLogin)
                return
            const res = { w: 1920, h: 1080 } /* FIXME: hardcoded */
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
            if (this.$refs.win) {
                const winWidth  = this.$refs.win.clientWidth
                const winHeight = this.$refs.win.clientHeight
                this.isWinSmallest = winWidth === 1000 && winHeight === 650
            }
        },

        async audioRecordOrPlay () {
            if (this.audioBlob === null)
                return this.audioRecord()
            else
                return this.audioPlay()
        },

        /*  audio recording handling  */
        async audioRecord () {
            if (this.inLogin || this.audioInputDevice === "" || this.votingActive)
                return
            if (!this.audioRecording) {
                /*  start recording  */
                ui.soundfx.play("chime3")
                this.recordState = 0
                for (let i = 1; i <= 3; i++) {
                    this.recordState++
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                }
                this.recordState++
                try {
                    /*  get audio stream from audio input device  */
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: { deviceId: this.audioInputDevice },
                        video: false
                    })

                    /*  create audio graph  */
                    const ac = new AudioContext()
                    const src = ac.createMediaStreamSource(stream)
                    const dst = ac.createMediaStreamDestination()

                    /*  add compressor filter to audio graph  */
                    const compressor = ac.createDynamicsCompressor()
                    compressor.threshold.value = -18
                    compressor.knee.value      = 40
                    compressor.ratio.value     = 10
                    compressor.attack.value    = 0.006
                    compressor.release.value   = 0.060

                    /*  add noise reducing biquad filters to audio graph  */
                    const biquad1 = ac.createBiquadFilter()
                    const biquad2 = ac.createBiquadFilter()
                    biquad1.type                = "highpass"
                    biquad1.Q.value             = 1.0
                    biquad1.frequency.value     = 144
                    biquad2.type                = "notch"
                    biquad2.Q.value             = 0.25
                    biquad2.frequency.value     = 986

                    /*  connect the audio graph nodes  */
                    src.connect(compressor)
                    compressor.connect(biquad1)
                    biquad1.connect(biquad2)
                    biquad2.connect(dst)

                    /*  record the resulting audio stream  */
                    this.recorder = new MediaRecorder(dst.stream, {
                        mimeType: "audio/webm; codecs=\"opus\"",
                        audioBitsPerSecond: 128000
                    })
                }
                catch (err) {
                    ui.log.error(`audio recording: ${err}`)
                    this.audioRecording = false
                    this.audioBlob = null
                    return
                }
                this.audioDuration = 0
                this.audioBlob = null
                this.audioBlobChunks = []
                this.recorder.addEventListener("dataavailable", (event) => {
                    this.audioBlobChunks.push(event.data)
                })
                this.volumeMute = true
                this.audioRecording = true
                this.recorder.start()
            }
            else {
                /*  stop recording  */
                this.recorder.addEventListener("stop", async (event) => {
                    this.audioBlob = new Blob(this.audioBlobChunks,
                        { "type" : "audio/webm; codecs=\"opus\"" })
                    const ac = new AudioContext()
                    let arrayBuffer = await this.audioBlob.arrayBuffer()
                    let audioBuffer = await ac.decodeAudioData(arrayBuffer)
                    this.audioDuration = audioBuffer.duration
                })
                this.recorder.stop()
                this.audioRecording = false
                this.volumeMute = false
                ui.soundfx.playAndWait("chime3")
                this.recordState = 0
            }
        },
        audioPlay () {
            if (this.inLogin || this.audioOutputDevice === "" || this.votingActive)
                return
            if (this.audioBlob === null)
                return
            this.audioPlaying = !this.audioPlaying
            if (this.audioPlaying) {
                /*  play recording  */
                this.audioElement = new Audio()
                this.audioElement.setSinkId(this.audioOutputDevice)
                this.audioElement.src = URL.createObjectURL(this.audioBlob)
                this.audioElement.volume = this.volume / 100
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
        /*  load settings  */
        this.personPortrait       = await ui.settings("person-portrait")
        this.personName           = await ui.settings("person-name")
        this.liveRelayServer      = await ui.settings("live-relay-server")
        this.liveAccessToken      = await ui.settings("live-access-token")
        this.liveStreamBuffering  = await ui.settings("live-stream-buffering")
        this.audioInputDevice     = await ui.settings("audio-input-device")
        this.audioOutputDevice    = await ui.settings("audio-output-device")

        /* indicate loading  */
        this.loaded = true

        /*  regularly refresh feeling  */
        this.timer1 = setInterval(() => {
            this.sendFeeling()
        }, 60 * 1000)
    },

    /*  component DOM mounting hook  */
    mounted () {
        /*  receive events  */
        this.$on("updated-devices", () => {
            this.$refs.settings.$emit("updated-devices")
        })
        this.$on("login-error", (error) => {
            this.$refs.login.$emit("error", error)
        })
        this.$on("state", (state) => {
            if (state === "login") {
                this.inLogin = true
                this.$refs.login.$emit("enable")
            }
            else if (state === "video") {
                this.inLogin = false
                this.$refs.login.$emit("disable")
            }
        })
        this.$on("deep-link", (credentials) => {
            this.liveRelayServer = credentials.liveRelayServer
            this.liveAccessToken = credentials.liveAccessToken
            this.$refs.login.$emit("deep-link", this.liveRelayServer, this.liveAccessToken)
            if (this.inLogin)
                this.logout()
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
        this.timer2 = setInterval(() => {
            const kbps = Math.ceil((this.bandwidthBytes * 8) / 1024 / interval)
            this.bandwidthText = kbps
            this.bandwidthBytes = 0
        }, interval * 1000)
        this.$on("stream-reset", () => {
            this.$refs.videostream.$emit("stream-reset")
        })
        this.$on("stream-end", () => {
            this.allowDisconnect = false
            this.$refs.videostream.$emit("stream-end")
        })

        /*  window resize tracking  */
        this.$on("maximized", (value) => {
            this.maximized = value
        })
        this.$on("fullscreened", (value) => {
            this.fullscreened = value
        })
        window.addEventListener("resize", () => this.handleResize())
        this.$nextTick(() => {
            this.handleResize()
        })

        /*  voting support  */
        this.$on("voting-begin", () => {
            ui.log.info("voting-begin")
            this.votingActive = true
            this.votingChoice = ""
            this.votingType   = "propose"
            this.votingDone   = false
        })
        this.$on("voting-type", ({ type }) => {
            ui.log.info(`voting-type: ${type}`)
            this.votingActive = true
            this.votingChoice = ""
            this.votingType   = type
            this.votingDone   = false
        })
        this.$on("voting-end", () => {
            ui.log.info("voting-end")
            this.votingActive = false
        })
    },

    /*  component destruction hook  */
    beforeDestroy () {
        /*  destroy timers  */
        if (this.timer1 !== null)
            clearTimeout(this.timer1)
        if (this.timer2 !== null)
            clearTimeout(this.timer2)
    }
}
</script>

