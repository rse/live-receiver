<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
**
-->

<template>
    <div ref="win" v-if="loaded" v-bind:style="style" class="win">
        <!-- ---- HEADER ---- -->
        <div ref="header" class="header">
            <div class="group">
                <div class="group-items">
                    <!-- disconnect -->
                    <div class="box button logout" v-on:click="logout"
                        v-tooltip.bottom-center="{ content: $t('window.disconnect-tooltip') }"
                        v-bind:class="{ disabled: inLogin || !allowDisconnect }">
                        <i class="icon fas fa-arrow-alt-circle-left"></i>
                        <span class="title">{{ $t("window.disconnect-button") }}</span>
                    </div>

                    <!-- reconnect -->
                    <div class="box button reconnect" v-on:click="relogin"
                        v-tooltip.bottom-center="{ content: $t('window.reconnect-tooltip') }"
                        v-bind:class="{ disabled: inLogin || !allowDisconnect || inVideoPlay }">
                        <i class="icon fas fa-sync-alt"></i>
                        <span class="title">{{ $t("window.reconnect-button") }}</span>
                    </div>
                </div>
                <div class="group-bar"
                    v-bind:class="{ disabled: inLogin || !allowDisconnect }">
                </div>
            </div>

            <div class="group">
                <div class="group-items">
                    <!-- meter -->
                    <div class="box meter" v-on:click="meterToggle"
                        v-tooltip.bottom-center="{ content: $t('window.meter-tooltip') }"
                        v-bind:class="{ disabled: inLogin || inVideoPlay, active: !inLogin && !inVideoPlay }">
                        <span class="word">{{ (inLogin || inVideoPlay) ? "---" : meterText }}</span>
                        <span class="title">{{ meterTypeNames[meterType] }}</span>
                    </div>
                </div>
                <div class="group-bar" v-bind:class="{ disabled: inLogin || inVideoPlay, active: !inLogin && !inVideoPlay }">
                </div>
            </div>

            <div class="group group-below">
                <div class="group-items">
                    <!-- recording -->
                    <div class="box button recording" v-on:click="recording"
                        v-tooltip.bottom-center="{ content: $t('window.recording-tooltip') }"
                        v-bind:class="{ disabled: inLogin || recordingThrottle || inVideoPlay || streamBytes === 0 }">
                        <i class="icon fas fa-video"></i>
                        <span class="title">{{ $t("window.recording-button") }}</span>
                    </div>

                    <!-- screenshot -->
                    <div class="box button screenshot" v-on:click="screenshot"
                        v-tooltip.bottom-center="{ content: $t('window.screenshot-tooltip') }"
                        v-bind:class="{ disabled: inLogin || screenshotThrottle || inVideoPlay || streamBytes === 0 }">
                        <i class="icon fas fa-camera"></i>
                        <span class="title">{{ $t("window.screenshot-button") }}</span>
                    </div>
                </div>
                <div class="group-bar"
                     v-bind:class="{ disabled: inLogin || inVideoPlay || streamBytes === 0 }">
                </div>
            </div>

            <div class="group group-below">
                <div class="group-items">
                    <!-- audio mute -->
                    <div class="box button mute"
                        v-tooltip.bottom-center="{ content: $t('window.audio-mute-tooltip') }"
                        v-on:click="toggleAudio"
                        v-bind:class="{ disabled: inLogin || volume === 0, active: volumeMute }">
                        <span v-show="volumeMute"><i class="icon fas fa-volume-mute"></i></span>
                        <span v-show="!volumeMute && volume < 30"><i class="icon fas fa-volume-down"></i></span>
                        <span v-show="!volumeMute && volume >= 30"><i class="icon fas fa-volume-up"></i></span>
                        <span class="title">{{ $t("window.audio-mute-button") }}</span>
                    </div>

                    <!-- audio volume -->
                    <div class="box slider volume"
                        v-tooltip.bottom-center="{ content: $t('window.audio-volume-tooltip') }"
                        v-bind:class="{ disabled: inLogin }">
                        <input ref="volume"
                            v-bind:disabled="inLogin"
                            class="volume"
                            type="range"
                            min="0" max="100"
                            v-model.number="volume"/>
                        <span class="title">{{ $t("window.audio-volume-button") }}</span>
                    </div>
                </div>
                <div class="group-bar"
                     v-bind:class="{ disabled: inLogin }">
                </div>
            </div>

            <div class="group group-below grow">
                <div class="group-items">
                    <!-- move window -->
                    <div class="box move"
                        v-tooltip.bottom-center="{ content: $t('window.move-window-tooltip') }">
                        <div class="grab-container">
                            <span class="grab grab-1"></span>
                            <span class="grab grab-2"></span>
                            <span class="grab grab-3"></span>
                            <span class="grab grab-4"></span>
                            <span class="grab grab-5"></span>
                        </div>
                        <span class="title">{{ $t("window.move-window-button") }}</span>
                        <div class="logo">
                            <img v-bind:src="logo" alt="LiVE"/>
                        </div>
                    </div>
                </div>
                <div class="group-bar">
                </div>
            </div>

            <div class="group group-below">
                <div class="group-items">
                    <!-- smallest size -->
                    <div class="box button fit" v-on:click="smallestSize"
                        v-tooltip.bottom-center="{ content: $t('window.smallest-size-tooltip') }"
                        v-bind:class="{ disabled: isWinSmallest || fullscreened || maximized }">
                        <i class="icon fas fa-compress"></i>
                        <span class="title">{{ $t("window.smallest-size-button") }}</span>
                    </div>

                    <!-- source size -->
                    <div class="box button fit" v-on:click="sourceSize"
                        v-tooltip.bottom-center="{ content: $t('window.native-size-tooltip') }"
                        v-bind:class="{ disabled: inLogin || fullscreened || maximized || streamSize.w === 0 || streamSize.h === 0 }">
                        <i class="icon fas fa-expand"></i>
                        <span class="title">{{ $t("window.native-size-button") }}</span>
                    </div>

                    <!-- minimize -->
                    <div class="box button minimize" v-on:click="minimize"
                        v-tooltip.bottom-center="{ content: $t('window.minimize-tooltip') }"
                        v-bind:class="{ disabled: fullscreened || maximized }">
                        <i class="icon fas fa-window-minimize"></i>
                        <span class="title">{{ $t("window.minimize-button") }}</span>
                    </div>

                    <!-- maximize -->
                    <div class="box button maximize" v-on:click="maximize"
                        v-tooltip.bottom-center="{ content: $t('window.maximize-tooltip') }"
                        v-bind:class="{ disabled: fullscreened, active: maximized }">
                        <i class="icon fas fa-window-maximize"></i>
                        <span class="title">{{ $t("window.maximize-button") }}</span>
                    </div>

                    <!-- fullscreen -->
                    <div class="box button fullscreen" v-on:click="fullscreen"
                        v-tooltip.bottom-center="{ content: $t('window.fullscreen-tooltip') }"
                        v-bind:class="{ disabled: maximized, active: fullscreened }">
                        <i class="icon fas fa-expand-arrows-alt"></i>
                        <span class="title">{{ $t("window.fullscreen-button") }}</span>
                    </div>
                </div>
                <div class="group-bar">
                </div>
            </div>

            <div class="group group-below">
                <div class="group-items">
                    <!-- quit -->
                    <div class="box button quit" v-on:click="quit"
                        v-tooltip.bottom-center="{ content: $t('window.quit-tooltip') }">
                        <i class="icon fas fa-times"></i>
                        <span class="title">{{ $t("window.quit-button") }}</span>
                    </div>
                </div>
                <div class="group-bar">
                </div>
            </div>
        </div>

        <!-- ---- CONTENT ---- -->
        <div ref="content" class="content">
            <!-- video stream -->
            <div ref="video"
                v-bind:style="{ width: videoSize.w + 'px', height: videoSize.h + 'px'}"
                v-show="!inLogin && !inSettings && !inVideoPlay"
                class="video video-stream">
                <videostream
                    ref="videostream"
                    v-on:stream-video-size="streamVideoSize"
                />
            </div>

            <!-- video play -->
            <div ref="video2"
                v-bind:style="{ width: videoSize.w + 'px', height: videoSize.h + 'px'}"
                v-show="!inLogin && !inSettings && inVideoPlay"
                class="video video-play">
                <videoplay
                    ref="videoplay"
                    v-on:stream-video-size="streamVideoSize"
                />
            </div>

            <!-- login dialog -->
            <div v-show="inLogin && !inSettings && !inAbout && !inUpdate" class="login">
                <login
                    ref="login"
                    v-bind:live-relay-server.sync="liveRelayServer"
                    v-bind:live-access-token.sync="liveAccessToken"
                    v-on:settings="settingsOpen"
                    v-on:update="updateOpen"
                    v-on:about="aboutOpen"
                    v-on:login="login"
                    v-on:recording-play="recordingPlay"
                    v-on:recording-delete="recordingDelete"
                />
            </div>

            <!-- settings dialog -->
            <div v-show="inSettings" class="settings">
                <settings
                    ref="settings"
                    v-bind:person-portrait.sync="personPortrait"
                    v-bind:person-name.sync="personName"
                    v-bind:person-privacy.sync="personPrivacy"
                    v-bind:live-stream-buffering.sync="liveStreamBuffering"
                    v-bind:recording-hours.sync="recordingHours"
                    v-bind:audio-input-device.sync="audioInputDevice"
                    v-bind:audio-output-device.sync="audioOutputDevice"
                    v-bind:language.sync="language"
                    v-on:save="settingsClose"
                />
            </div>

            <!-- about dialog -->
            <div v-show="inAbout" class="about">
                <about
                    ref="about"
                    v-on:close="aboutClose"
                />
            </div>

            <!-- update dialog -->
            <div v-show="inUpdate" class="update">
                <update
                    ref="update"
                    v-on:close="updateClose"
                    v-on:update-check="updateCheck"
                    v-on:update-to-version="updateToVersion"
                    v-on:update-notify="updateNotify"
                />
            </div>

            <!-- stealth mode indicator -->
            <div v-show="stealthMode" class="stealth-mode">
                <i class="fas fa-eye-slash"></i>
            </div>

            <!-- fatal error message -->
            <div v-show="fatalError !== null" class="fatal-error">
                <div class="icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="text">
                    <b>{{ $t("window.fatal-error") }}:</b><br/>
                    {{ fatalError }}
                </div>
            </div>
        </div>

        <!-- ---- FOOTER ---- -->
        <div ref="footer" class="footer">
            <div class="group grow">
                <div class="group-bar"
                    v-bind:class="{ disabled: inLogin || inVideoPlay }">
                </div>
                <div class="group-items">
                    <!-- audio record -->
                    <div class="box button audio-record" v-on:click="audioRecordOrPlay"
                        v-tooltip.top-center="{
                            content: recordText,
                            hideOnTargetClick: false,
                            autoHide: false
                        }"
                        v-bind:class="{
                            disabled: inLogin || messageThrottle || audioInputDevice === '' || audioOutputDevice === '' || votingActive || inVideoPlay,
                            active: audioRecording || audioPlaying || audioBlob !== null
                        }">
                        <span v-show="!audioRecording && audioBlob === null"><i class="icon fas fa-microphone-alt"></i></span>
                        <span v-show=" audioRecording && audioBlob === null"><i class="icon fas fa-microphone-alt-slash"></i></span>
                        <span v-show="!audioPlaying   && audioBlob !== null"><i class="icon fas fa-play-circle"></i></span>
                        <span v-show=" audioPlaying   && audioBlob !== null"><i class="icon fas fa-stop-circle"></i></span>
                        <span v-show="!audioRecording && audioBlob === null" class="title">{{ $t("window.audio-record-button-1") }}</span>
                        <span v-show=" audioRecording && audioBlob === null" class="title">{{ $t("window.audio-record-button-2") }}</span>
                        <span v-show="!audioPlaying   && audioBlob !== null" class="title">{{ $t("window.audio-record-button-3") }}</span>
                        <span v-show=" audioPlaying   && audioBlob !== null" class="title">{{ $t("window.audio-record-button-4") }}</span>
                    </div>

                    <!-- enter message -->
                    <div class="box message-text" v-bind:class="{ disabled: inLogin || messageThrottle || inVideoPlay, active: message !== '' }">
                        <span v-show="!votingActive || votingActive && votingType === 'propose'"
                            v-tooltip.top-center="{ content: $t('window.message-propose-tooltip') }">
                            <input
                                v-bind:disabled="inLogin || messageThrottle || (votingActive && votingDone) || inVideoPlay"
                                ref="message"
                                type="text"
                                v-bind:placeholder="(votingActive && votingDone) ? $t('window.message-propose-placeholder-1') :
                                    (votingActive ? $t('window.message-propose-placeholder-2') : $t('window.message-propose-placeholder-3') )"
                                v-model="message"
                                v-on:keyup.enter="sendMessage"
                                v-on:keyup.escape="clearMessage(false)"
                            />
                        </span>
                        <div v-show="votingActive && votingType === 'judge'"
                            v-tooltip.top-center="{ content: $t('window.message-judge-tooltip') }"
                            v-bind:class="{ 'choice-row': true, disabled: votingDone }">
                            <div v-bind:class="{ 'choice-box': true, active: votingChoice === 1 }"
                                v-on:click="sendChoice(1, 'yes')">
                                <span class="choice-icon"><i class="fas fa-thumbs-up"></i></span>
                                {{ $t("window.message-judge-answer-yes") }}
                            </div>
                            <div v-bind:class="{ 'choice-box': true, active: votingChoice === 2 }"
                                v-on:click="sendChoice(2, 'no')">
                                <span class="choice-icon"><i class="fas fa-thumbs-down"></i></span>
                                {{ $t("window.message-judge-answer-no") }}
                            </div>
                            <div v-bind:class="{ 'choice-box': true, 'choice-cmd': true, active: votingChoice === 0 }"
                                v-on:click="sendChoice(0, 'abstain')">
                                <span class="choice-icon"><i class="fas fa-ban"></i></span>
                                {{ $t("window.message-answer-abstain") }}
                            </div>
                        </div>
                        <div v-show="votingActive && votingType === 'evaluate'"
                            v-tooltip.top-center="{ content: $t('window.message-eval-tooltip') }"
                            v-bind:class="{ 'choice-row': true, disabled: votingDone }">
                            <div v-bind:class="{ 'choice-box': true, active: votingChoice === 1 }"
                                v-on:click="sendChoice(1, '-2')">
                                <span class="choice-icon"><i class="fas fa-sad-cry"></i></span>-2
                            </div>
                            <div v-bind:class="{ 'choice-box': true, active: votingChoice === 2 }"
                                v-on:click="sendChoice(2, '-1')">
                                <span class="choice-icon"><i class="fas fa-frown"></i></span>-1
                            </div>
                            <div v-bind:class="{ 'choice-box': true, active: votingChoice === 3 }"
                                v-on:click="sendChoice(3, '0')">
                                <span class="choice-icon"><i class="fas fa-meh"></i></span>0
                            </div>
                            <div v-bind:class="{ 'choice-box': true, active: votingChoice === 4 }"
                                v-on:click="sendChoice(4, '+1')">
                                <span class="choice-icon"><i class="fas fa-smile"></i></span>+1
                            </div>
                            <div v-bind:class="{ 'choice-box': true, active: votingChoice === 5 }"
                                v-on:click="sendChoice(5, '+2')">
                                <span class="choice-icon"><i class="fas fa-grin-stars"></i></span>+2
                            </div>
                            <div v-bind:class="{ 'choice-box': true, 'choice-cmd': true, active: votingChoice === 0 }"
                                v-on:click="sendChoice(0, 'abstain')">
                                <span class="choice-icon"><i class="fas fa-ban"></i></span>
                                {{ $t("window.message-answer-abstain") }}
                            </div>
                        </div>
                        <div v-show="votingActive && votingType === 'choose'"
                            v-tooltip.top-center="{ content: $t('window.message-choice-tooltip') }"
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
                            <div v-bind:class="{ 'choice-box': true, 'choice-cmd': true, active: votingChoice === 0 }"
                                v-on:click="sendChoice(0, 'abstain')">
                                <span class="choice-icon"><i class="fas fa-ban"></i></span>
                                {{ $t("window.message-answer-abstain") }}
                            </div>
                        </div>
                        <div v-show="votingActive && votingType === 'quiz'"
                            v-tooltip.top-center="{ content: $t('window.message-quiz-tooltip') }"
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
                            <div v-bind:class="{ 'choice-box': true, 'choice-cmd': true, active: votingChoice === 0 }"
                                v-on:click="sendChoice(0, 'abstain')">
                                <span class="choice-icon"><i class="fas fa-ban"></i></span>
                                {{ $t("window.message-answer-abstain") }}
                            </div>
                        </div>
                    </div>

                    <!-- clear message -->
                    <div class="box button message-clear" v-on:click="clearMessage(true)"
                        v-tooltip.top-center="{ content: $t('window.clear-message-tooltip') }"
                        v-bind:class="{ disabled: inLogin || messageThrottle || (audioBlob === null && message === '') || inVideoPlay }">
                        <i class="icon fas fa-trash-alt"></i>
                        <span class="title">{{ $t("window.clear-message-button") }}</span>
                    </div>

                    <!-- send message -->
                    <div class="box button message-send" v-on:click="sendMessage"
                        v-tooltip.top-center="{ content: $t('window.send-message-tooltip') }"
                        v-bind:class="{ disabled: inLogin || messageThrottle || (message === '' && audioBlob === null) || inVideoPlay }">
                        <i class="icon fas fa-share"></i>
                        <span class="title">{{ $t("window.send-message-button") }}</span>
                    </div>
                </div>
            </div>

            <div class="group">
                <div class="group-bar"
                    v-bind:class="{ disabled: inLogin || feedbackDisabled || inVideoPlay }">
                </div>
                <div class="group-items">
                    <!-- send thumbs-up -->
                    <div class="box button message-send" v-on:click="feedback('thumbsup')"
                        v-tooltip.top-center="{ content: $t('window.feedback-thumbsup-tooltip') }"
                        v-bind:class="{ disabled: inLogin || feedbackDisabled || inVideoPlay }">
                        <i class="icon fas fa-thumbs-up"></i>
                        <span class="title">{{ $t("window.feedback-thumbsup-button") }}</span>
                    </div>

                    <!-- send thumbs-down -->
                    <div class="box button message-send" v-on:click="feedback('thumbsdn')"
                        v-tooltip.top-center="{ content: $t('window.feedback-thumbsdn-tooltip') }"
                        v-bind:class="{ disabled: inLogin || feedbackDisabled || inVideoPlay }">
                        <i class="icon fas fa-thumbs-down"></i>
                        <span class="title">{{ $t("window.feedback-thumbsdn-button") }}</span>
                    </div>

                    <!-- send surprise -->
                    <div class="box button message-send" v-on:click="feedback('surprise')"
                        v-tooltip.top-center="{ content: $t('window.feedback-surprise-tooltip') }"
                        v-bind:class="{ disabled: inLogin || feedbackDisabled || inVideoPlay }">
                        <i class="icon fas fa-surprise"></i>
                        <span class="title">{{ $t("window.feedback-surprise-button") }}</span>
                    </div>

                    <!-- send smile -->
                    <div class="box button message-send" v-on:click="feedback('smile')"
                        v-tooltip.top-center="{ content: $t('window.feedback-smile-tooltip') }"
                        v-bind:class="{ disabled: inLogin || feedbackDisabled || inVideoPlay }">
                        <i class="icon fas fa-grin-wink"></i>
                        <span class="title">{{ $t("window.feedback-smile-button") }}</span>
                    </div>

                    <!-- send frown -->
                    <div class="box button message-send" v-on:click="feedback('frown')"
                        v-tooltip.top-center="{ content: $t('window.feedback-frown-tooltip') }"
                        v-bind:class="{ disabled: inLogin || feedbackDisabled || inVideoPlay }">
                        <i class="icon fas fa-angry"></i>
                        <span class="title">{{ $t("window.feedback-frown-button") }}</span>
                    </div>

                    <!-- send sadness -->
                    <div class="box button message-send" v-on:click="feedback('sadness')"
                        v-tooltip.top-center="{ content: $t('window.feedback-sadness-tooltip') }"
                        v-bind:class="{ disabled: inLogin || feedbackDisabled || inVideoPlay }">
                        <i class="icon fas fa-sad-tear"></i>
                        <span class="title">{{ $t("window.feedback-sadness-button") }}</span>
                    </div>
                </div>
            </div>

            <div class="group">
                <div class="group-bar"
                    v-bind:class="{ disabled: inLogin || inVideoPlay }">
                </div>
                <div class="group-items">
                    <!-- challenge -->
                    <div class="box slider challenge" v-bind:class="{ disabled: inLogin || inVideoPlay }"
                        v-tooltip.top-center="{ content: challengeText, hideOnTargetClick: false }">
                        <input ref="challenge"
                            v-bind:class="[ 'challenge', 'range' + challenge ]"
                            v-bind:disabled="inLogin || inVideoPlay"
                            type="range"
                            min="1" max="5" step="1"
                            v-model.number="challenge"/>
                        <span class="title">{{ $t("window.challenge-button") }}</span>
                    </div>

                    <!-- mood -->
                    <div class="box slider mood" v-bind:class="{ disabled: inLogin || inVideoPlay }"
                        v-tooltip.top-center="{ content: moodText, hideOnTargetClick: false }">
                        <input ref="mood"
                            v-bind:class="[ 'mood', 'range' + mood ]"
                            v-bind:disabled="inLogin || inVideoPlay"
                            type="range"
                            min="1" max="5" step="1"
                            v-model.number="mood"/>
                        <span class="title">{{ $t("window.mood-button") }}</span>
                    </div>
                </div>
            </div>

            <div class="group">
                <div class="group-bar">
                </div>
                <div class="group-items">
                    <!-- move window -->
                    <div class="box move"
                        v-tooltip.top-center="{ content: $t('window.move-window-tooltip') }">
                        <div class="grab-container">
                            <span class="grab grab-1"></span>
                            <span class="grab grab-2"></span>
                            <span class="grab grab-3"></span>
                            <span class="grab grab-4"></span>
                            <span class="grab grab-5"></span>
                        </div>
                        <span class="title">{{ $t("window.move-window-button") }}</span>
                    </div>
                </div>
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

    .group {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        height: 42px;
        .group-items {
            height: 38px;
            width: 100%;
            display: flex;
            flex-direction: row;
        }
        .group-bar {
            width: 100%;
            height: 2px;
            display: block;
            background-color:        var(--color-std-bg-3);
            border-top:    1px solid var(--color-std-bg-5);
            border-left:   1px solid var(--color-std-bg-5);
            border-right:  1px solid var(--color-std-bg-1);
            border-bottom: 1px solid var(--color-std-bg-1);
            &.active {
                background-color:        var(--color-acc-bg-3);
                border-top:    1px solid var(--color-acc-bg-5);
                border-left:   1px solid var(--color-acc-bg-5);
                border-right:  1px solid var(--color-acc-bg-1);
                border-bottom: 1px solid var(--color-acc-bg-1);
            }
        }
    }
    .group:hover {
        .group-bar {
            background-color:        var(--color-acc-bg-3);
            border-top:    1px solid var(--color-acc-bg-5);
            border-left:   1px solid var(--color-acc-bg-5);
            border-right:  1px solid var(--color-acc-bg-1);
            border-bottom: 1px solid var(--color-acc-bg-1);
            &.disabled {
                background-color:        var(--color-std-bg-3);
                border-top:    1px solid var(--color-std-bg-5);
                border-left:   1px solid var(--color-std-bg-5);
                border-right:  1px solid var(--color-std-bg-1);
                border-bottom: 1px solid var(--color-std-bg-1);
            }
        }
    }
    .group.grow {
        flex-grow: 1;
    }

    /*  header/footer box  */
    .box {
        width: 56px;
        position: relative;
        background-color:        var(--color-std-bg-3);
        border-top:    1px solid var(--color-std-bg-5);
        border-left:   1px solid var(--color-std-bg-5);
        border-right:  1px solid var(--color-std-bg-1);
        border-bottom: 1px solid var(--color-std-bg-1);
        .icon {
            position: absolute;
            font-size: 15pt;
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
        &.disabled {
            background-color:        var(--color-std-bg-3);
            border-top:    1px solid var(--color-std-bg-5);
            border-left:   1px solid var(--color-std-bg-5);
            border-right:  1px solid var(--color-std-bg-1);
            border-bottom: 1px solid var(--color-std-bg-1);
            .icon  { color:          var(--color-std-fg-0); }
            .word  { color:          var(--color-std-fg-0); }
            .title { color:          var(--color-std-fg-0); }
        }
    }

    /*  button widget  */
    .button {
        cursor: pointer;
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
            .icon  { color:          var(--color-std-fg-0); }
            .word  { color:          var(--color-std-fg-0); }
            .title { color:          var(--color-std-fg-0); }
        }
    }

    /*  slider widget  */
    .slider {
        width: 80px;
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
            .title { color:          var(--color-std-fg-0); }
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
        &.disabled {
            input[type="range"] {
                &::-webkit-slider-thumb {
                    background-color:        var(--color-std-fg-0) !important;
                    border-top:    1px solid var(--color-std-bg-5) !important;
                    border-left:   1px solid var(--color-std-bg-5) !important;
                    border-right:  1px solid var(--color-std-bg-3) !important;
                    border-bottom: 1px solid var(--color-std-bg-3) !important;
                }
            }
        }
    }

    /*  header area  */
    .header {
        width: 100vw;
        height: 42px;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
    }

    /*  move window  */
    .move {
        flex-grow: 1;
        padding-top: 6px;
        height: calc(100% - 8px);
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
            .grab {
                height: 1px;
                width: calc(100% - 20px);
                margin: 0px 10px 0px 10px;
                display: block;
                border-top:    1px solid var(--color-std-bg-1);
                border-bottom: 1px solid var(--color-std-bg-5);
            }
        }
        -webkit-app-region: drag;
        &:hover {
            cursor: pointer;
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
        position: relative;
        .stealth-mode {
            position: absolute;
            bottom: -10px;
            right: 10px;
            color: var(--color-sig-bg-5);
            font-size: 32pt;
            opacity: 0.8;
        }
        .fatal-error {
            opacity: 0.9;
            position: absolute;
            top: 30%;
            left: 0;
            width: 100%;
            height: auto;
            background-color: var(--color-sig-bg-3);
            color: var(--color-sig-fg-3);
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-items: center;
            padding-top: 20px;
            padding-bottom: 20px;
            .icon {
                font-size: 80pt;
                margin-left: 50px;
                margin-right: 50px;
            }
            .text {
                font-size: 14pt;
                margin-right: 50px;
            }
        }
    }

    /*  footer area  */
    .footer {
        width: 100vw;
        height: 42px;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        overflow: hidden;
        .message-text {
            flex-grow: 1;
            input[type="text"] {
                width: calc(100% - 20px);
                height: calc(100% - 10px);
                font-size: 12pt;
                border: 0;
                color:                   var(--color-std-fg-3);
                background-color:        var(--color-std-bg-3);
                border-top:    1px solid var(--color-std-bg-1);
                border-left:   1px solid var(--color-std-bg-1);
                border-right:  1px solid var(--color-std-bg-5);
                border-bottom: 1px solid var(--color-std-bg-5);
                padding: 4px 10px 4px 10px;
                position: relative;
                &::placeholder {
                    color: var(--color-std-fg-1);
                    font-size: 10pt;
                    position: relative;
                    top: -1px;
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
                overflow: hidden;
                .choice-box {
                    color:                   var(--color-std-fg-3);
                    background-color:        var(--color-std-bg-3);
                    border-top:    1px solid var(--color-std-bg-5);
                    border-left:   1px solid var(--color-std-bg-5);
                    border-right:  1px solid var(--color-std-bg-1);
                    border-bottom: 1px solid var(--color-std-bg-1);
                    border-radius: 5px;
                    padding: 0px 10px 0px 10px;
                    margin-right: 2px;
                    font-family: "TypoPRO Source Sans Pro";
                    font-size: 14pt;
                    font-weight: bold;
                    white-space: nowrap;
                    .choice-icon {
                        font-size: 12pt;
                        color: var(--color-std-fg-1);
                        padding-right: 4px;
                    }
                    &.choice-cmd {
                        font-weight: 300;
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
        inAbout:               false,
        inUpdate:              false,
        inVideoPlay:           false,
        allowDisconnect:       true,
        personPortrait:        "",
        personName:            "",
        liveRelayServer:       "",
        liveAccessToken:       "",
        liveStreamBuffering:   0,
        recordingHours:        0,
        audioInputDevice:      "",
        audioOutputDevice:     "",
        language:              "",
        logo:                  ui.logo1,
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
        mood:                  3,
        challenge:             3,
        meterType:             0,
        bandwidthBytes:        0,
        bandwidthText:         "",
        durationStart:         0,
        durationText:          "",
        timeText:              "",
        streamBytes:           0,
        streamSize:            { w: 0, h: 0 },
        videoSize:             { w: 0, h: 0 },
        videoClosure:          false,
        videoDebug:            false,
        timer1:                null,
        timer2:                null,
        timer3:                null,
        timer4:                null,
        isWinSmallest:         false,
        feedbackDisabled:      false,
        votingActive:          false,
        votingType:            "propose",
        votingDone:            false,
        votingChoice:          "",
        stealthMode:           false,
        fatalError:            null,
        recordingThrottle:     false,
        screenshotThrottle:    false,
        messageThrottle:       false
    }),

    /*  component computed properties  */
    computed: {
        style: ui.vueprop2cssvar(),
        meterText () {
            if      (this.meterType === 0) return this.bandwidthText
            else if (this.meterType === 1) return this.durationText
            else if (this.meterType === 2) return this.timeText
        },
        meterTypeNames () {
            return [
                this.$t("window.meter-button-kbps"),
                this.$t("window.meter-button-duration"),
                this.$t("window.meter-button-clock")
            ]
        },
        recordText () {
            let html
            if (this.audioBlob === null) {
                if (!this.audioRecording)
                    html = this.$t("window.audio-record-tooltip-1")
                else
                    html = this.$t("window.audio-record-tooltip-2")
            }
            else {
                if (this.audioPlaying)
                    html = this.$t("window.audio-record-tooltip-3")
                else
                    html = this.$t("window.audio-record-tooltip-4",
                        { seconds: this.audioDuration.toFixed(1) })
            }
            return html
        },
        challengeText () {
            let html = this.$t("window.challenge-tooltip-0") + "<b>"
            switch (parseInt(this.challenge)) {
                case 1: html += this.$t("window.challenge-tooltip-1"); break
                case 2: html += this.$t("window.challenge-tooltip-2"); break
                case 3: html += this.$t("window.challenge-tooltip-3"); break
                case 4: html += this.$t("window.challenge-tooltip-4"); break
                case 5: html += this.$t("window.challenge-tooltip-5"); break
            }
            html += "</b>!"
            return html
        },
        moodText () {
            let html = this.$t("window.mood-tooltip-0") + "<b>"
            switch (parseInt(this.mood)) {
                case 1: html += this.$t("window.mood-tooltip-1"); break
                case 2: html += this.$t("window.mood-tooltip-2"); break
                case 3: html += this.$t("window.mood-tooltip-3"); break
                case 4: html += this.$t("window.mood-tooltip-4"); break
                case 5: html += this.$t("window.mood-tooltip-5"); break
            }
            html += "</b>!"
            return html
        }
    },

    /*  component properties observation  */
    watch: {
        volume: function (v) {
            this.$refs.videostream.$emit("volume", v)
            this.$refs.videoplay.$emit("volume", v)
            this.volumeMute = (v === 0)
        },
        volumeMute: function (v) {
            this.$refs.videostream.$emit("mute", v)
            this.$refs.videoplay.$emit("mute", v)
        },
        challenge: ui.debounce(2000, function (v) { this.sendFeeling() }),
        mood:      ui.debounce(2000, function (v) { this.sendFeeling() }),
        personPortrait:       function (v) { ui.settings("person-portrait", v) },
        personName:           function (v) { ui.settings("person-name", v) },
        personPrivacy:        function (v) { ui.settings("person-privacy", v) },
        liveRelayServer:      function (v) { ui.settings("live-relay-server", v) },
        liveAccessToken:      function (v) { ui.settings("live-access-token", v) },
        liveStreamBuffering:  function (v) { ui.settings("live-stream-buffering", v) },
        recordingHours:       function (v) { ui.settings("recording-hours", v) },
        audioInputDevice:     function (v) { ui.settings("audio-input-device", v) },
        language:             function (v) { ui.settings("language", v) },
        audioOutputDevice:    function (v) {
            ui.settings("audio-output-device", v)
            if (this.$refs.videostream) {
                this.$refs.videostream.$emit("device", v)
                this.$refs.videoplay.$emit("device", v)
            }
        }
    },

    /*  component sub-components  */
    components: {
        "login":       "url:app-ui-widget-login.vue",
        "settings":    "url:app-ui-widget-settings.vue",
        "videostream": "url:app-ui-widget-videostream.vue",
        "videoplay":   "url:app-ui-widget-videoplay.vue",
        "about":       "url:app-ui-widget-about.vue",
        "update":      "url:app-ui-widget-update.vue"
    },

    /*  component methods  */
    methods: {
        /*  message handling  */
        async sendChoice (activate, choice) {
            if (this.votingDone || this.messageThrottle || this.inVideoPlay)
                return
            this.message = choice
            this.sendMessage()
            this.votingChoice = activate
            this.votingDone = true
        },
        async sendMessage () {
            if (this.votingDone || this.messageThrottle || this.inVideoPlay)
                return
            if (this.message !== "" || this.audioBlob !== null) {
                const data = { text: this.message }
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
                if (this.votingActive)
                    this.votingDone = true
                this.messageThrottle = true
                setTimeout(() => {
                    this.messageThrottle = false
                }, 10 * 1000)
            }
            this.$refs.message.blur()
        },
        clearMessage (withAudio) {
            if (this.messageThrottle || !(this.message !== "" || this.audioBlob !== null) || this.inVideoPlay)
                return
            this.message = ""
            if (withAudio)
                this.audioBlob = null
            this.$refs.message.blur()
        },
        feedback (type) {
            if (this.feedbackDisabled || this.inVideoPlay)
                return
            this.$emit("feedback", type)
            this.feedbackDisabled = true
            setTimeout(() => {
                this.feedbackDisabled = false
            }, 30 * 1000)
        },
        sendFeeling () {
            if (this.inVideoPlay)
                return
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
                personPrivacy:        this.personPrivacy,
                liveStreamBuffering:  this.liveStreamBuffering,
                recordingHours:       this.recordingHours,
                audioInputDevice:     this.audioInputDevice,
                audioOutputDevice:    this.audioOutputDevice,
                language:             this.language
            })
        },

        /*  about handling */
        aboutOpen () {
            if (!this.inLogin || this.inAbout)
                return
            this.inAbout = true
        },
        aboutClose () {
            if (!this.inAbout)
                return
            this.inAbout = false
        },

        /*  update handling */
        updateOpen () {
            if (!this.inLogin || this.inUpdate)
                return
            this.inUpdate = true
        },
        updateClose () {
            if (!this.inUpdate)
                return
            this.inUpdate = false
        },

        /*  login/connect and logout/disconnect handling  */
        login () {
            if (!this.inLogin)
                return
            const missingSettings = (name) => {
                this.$refs.login.$emit("error", this.$t("window.missing-settings", { name: this.$t(name) }))
            }
            if (this.personPortrait      === "") { missingSettings("window.missing-settings-portrait");  return }
            if (this.personName          === "") { missingSettings("window.missing-settings-name");      return }
            if (this.personPrivacy       === "") { missingSettings("window.missing-settings-privacy");   return }
            if (this.liveStreamBuffering === 0)  { missingSettings("window.missing-settings-buffering"); return }
            if (this.audioOutputDevice   === "") { missingSettings("window.missing-settings-device");    return }
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
            this.stealthMode = false
            if (this.inVideoPlay) {
                this.allowDisconnect = true
                this.$emit("recording-unplay")
            }
            else {
                this.allowDisconnect = false
                this.$emit("logout")
            }
        },
        relogin () {
            if (this.inLogin || this.inVideoPlay)
                return
            if (!this.allowDisconnect)
                return
            this.allowDisconnect = false
            this.$emit("relogin", {
                liveRelayServer:      this.liveRelayServer,
                liveAccessToken:      this.liveAccessToken
            })
        },
        recordingPlay (recording) {
            if (!this.inLogin)
                return
            this.$emit("recording-play", recording)
        },
        recordingDelete (recording) {
            if (!this.inLogin)
                return
            this.$emit("recording-delete", recording)
        },
        quit () {
            this.$emit("quit")
        },

        /*  toggle meter type  */
        meterToggle () {
            if (this.inLogin || this.inVideoPlay)
                return
            this.meterType = (this.meterType + 1) % this.meterTypeNames.length
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
            this.$emit("set-size", { w: 975, h: 550 + 2 * 42 })
        },
        async sourceSize () {
            if (this.fullscreened || this.maximized || this.inLogin || this.streamSize.w === 0 || this.streamSize.h === 0)
                return
            const ssf = await ui.screenScaleFactor()
            let w = this.streamSize.w / ssf
            let h = this.streamSize.h / ssf
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
            if (this.messageThrottle || this.inVideoPlay)
                return
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
                ui.soundfx.play("beep1")
                await new Promise((resolve) => setTimeout(resolve, 200))
                try {
                    /*  get audio stream from audio input device  */
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: this.audioInputDevice,
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
                    const arrayBuffer = await this.audioBlob.arrayBuffer()
                    const audioBuffer = await ac.decodeAudioData(arrayBuffer)
                    this.audioDuration = audioBuffer.duration
                })
                this.recorder.stop()
                this.audioRecording = false
                this.volumeMute = false
                ui.soundfx.playAndWait("beep1")
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
        },
        toggleAudio () {
            if (this.inLogin)
                return
            if (this.volume > 0)
                this.volumeMute = !this.volumeMute
        },
        recording () {
            if (this.inLogin || this.recordingThrottle || this.inVideoPlay)
                return
            ui.soundfx.playAndWait("throw2")
            this.$emit("recording")

            /*  throttle action  */
            this.recordingThrottle = true
            setTimeout(() => { this.recordingThrottle = false }, 30 * 1000)
        },
        screenshot () {
            if (this.inLogin || this.screenshotThrottle || this.inVideoPlay)
                return
            ui.soundfx.playAndWait("throw2")
            let { x, y, width, height } = this.$refs.video.getBoundingClientRect()
            x      = Math.floor(x)
            y      = Math.floor(y)
            width  = Math.floor(width)
            height = Math.floor(height)
            this.$emit("screenshot", { x, y, width, height })

            /*  throttle action  */
            this.screenshotThrottle = true
            setTimeout(() => { this.screenshotThrottle = false }, 3 * 1000)
        },
        toggleVideoClosure () {
            if (this.inLogin)
                return
            this.videoClosure = !this.videoClosure
            this.$refs.videostream.$emit("closure", this.videoClosure)
        },
        toggleVideoDebug () {
            if (this.inLogin)
                return
            this.videoDebug = !this.videoDebug
            this.$refs.videostream.$emit("debug", this.videoDebug)
        },
        toggleStealthMode () {
            if (this.inLogin)
                return
            this.stealthMode = !this.stealthMode
            this.$emit("stealth-mode", this.stealthMode)
        },
        updateCheck () {
            this.$emit("update-check")
        },
        updateToVersion (version) {
            this.$emit("update-to-version", version)
        },
        updateNotify (type) {
            this.$refs.login.$emit("blink-update", type)
        },
        streamVideoSize (size) {
            this.streamSize.w = size.width
            this.streamSize.h = size.height
        }
    },

    /*  component creation hook  */
    async created () {
        /*  load settings  */
        this.personPortrait       = await ui.settings("person-portrait")
        this.personName           = await ui.settings("person-name")
        this.personPrivacy        = await ui.settings("person-privacy")
        this.liveRelayServer      = await ui.settings("live-relay-server")
        this.liveAccessToken      = await ui.settings("live-access-token")
        this.liveStreamBuffering  = await ui.settings("live-stream-buffering")
        this.recordingHours       = await ui.settings("recording-hours")
        this.audioInputDevice     = await ui.settings("audio-input-device")
        this.audioOutputDevice    = await ui.settings("audio-output-device")
        this.language             = await ui.settings("language")

        /* indicate loading  */
        this.loaded = true

        /*  regularly refresh feeling  */
        this.timer1 = setInterval(() => {
            this.sendFeeling()
        }, 10 * 60 * 1000)
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
                this.inVideoPlay = false
                this.allowDisconnect = false
                this.$refs.login.$emit("enable")
            }
            else if (state === "video-stream") {
                this.inLogin = false
                this.inVideoPlay = false
                this.allowDisconnect = true
                this.$refs.login.$emit("disable")
                this.sendFeeling()
            }
            else if (state === "video-play") {
                this.inLogin = false
                this.inVideoPlay = true
                this.allowDisconnect = true
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

        /*  helper function for calculating weighted average value
            of a list of values (older ones have less weight)  */
        const avg = (arr, pos) => {
            const max = arr.length
            let avg = 0
            let num = 0
            for (let i = pos; i >= 0; i--) {
                const w = max - (pos - i)
                avg += w * arr[i]
                num += w
            }
            for (let i = max - 1; i > pos; i--) {
                const w = i - pos
                avg += w * arr[i]
                num += w
            }
            avg /= num
            return avg
        }

        /*  stream handling  */
        let kbpsList  = []
        let kbpsPos   = 0
        const kbpsLen = 10
        this.$on("stream-begin", () => {
            this.$refs.videostream.$emit("mute", this.volumeMute)
            this.$refs.videostream.$emit("volume", this.volume)
            this.$refs.videostream.$emit("stream-begin")
            this.allowDisconnect = false
            this.streamBytes = 0

            /*  determine average bandwidth meter  */
            kbpsList = []
            kbpsPos  = 0
            this.bandwidthText = 0
            this.timer2 = setInterval(() => {
                const kbps = Math.ceil((this.bandwidthBytes * 8) / 1024 / 2)
                kbpsList[kbpsPos] = kbps
                this.bandwidthText = avg(kbpsList, kbpsPos).toFixed(0)
                this.bandwidthBytes = 0
                kbpsPos = (kbpsPos + 1) % kbpsLen
            }, 1000 * 2)

            /*  determine duration and clock meter and also auto-toggle meter display  */
            this.durationStart = dayjs()
            let meterAutoToggleCount = 0
            const meterAutoToggleEvery  = 60
            const meterAutoToggleWait   = 3
            const meterAutoToggleAmount = this.meterTypeNames.length
            this.timer4 = setInterval(() => {
                /*  determine duration meter  */
                const now = dayjs()
                const duration = now.diff(this.durationStart)
                this.durationText = dayjs.utc(duration).format("HH:mm")

                /*  determine clock meter  */
                this.timeText = now.format("HH:mm")

                /*  auto-toggle meter display  */
                meterAutoToggleCount++
                if (meterAutoToggleCount >= meterAutoToggleEvery
                    && meterAutoToggleCount < (meterAutoToggleEvery + meterAutoToggleWait * meterAutoToggleAmount)) {
                    if ((meterAutoToggleCount - meterAutoToggleEvery) % meterAutoToggleWait === 0)
                        this.meterToggle()
                }
                else if (meterAutoToggleCount >= meterAutoToggleEvery + meterAutoToggleWait * meterAutoToggleAmount)
                    meterAutoToggleCount = 0
            }, 1000)
        })
        setTimeout(() => {
            this.$refs.videostream.$on("stream-begin:done", () => {
                this.allowDisconnect = true
            })
        }, 400)
        this.$on("stream-data", (data) => {
            this.bandwidthBytes += data.buffer.byteLength
            this.streamBytes += data.buffer.byteLength
            this.$refs.videostream.$emit("stream-data", data)
        })
        this.$on("stream-reset", () => {
            this.streamBytes = 0
            kbpsList = []
            kbpsPos  = 0
            this.$refs.videostream.$emit("stream-reset")
        })
        this.$on("stream-end", () => {
            this.allowDisconnect = false
            this.streamBytes = 0
            this.$refs.videostream.$emit("stream-end")
            if (this.timer2 !== null) {
                clearTimeout(this.timer2)
                this.timer2 = null
            }
        })

        /*  play handling  */
        this.$on("play-begin", (info) => {
            this.$refs.videoplay.$emit("play-begin", info)
        })
        this.$on("play-end", () => {
            this.$refs.videoplay.$emit("play-end")
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
            this.votingType   = type
        })
        this.$on("voting-end", () => {
            ui.log.info("voting-end")
            this.votingActive = false
            this.votingDone   = false
        })

        /*  update support  */
        this.$on("update-updateable", (updateable) => {
            ui.log.info(`update-updateable: ${updateable ? "yes" : "no"}`)
            this.$refs.update.$emit("update-updateable", updateable)
        })
        this.$on("update-versions", (versions) => {
            ui.log.info(`update-versions: ${JSON.stringify(versions)}`)
            this.$refs.update.$emit("update-versions", versions)
        })
        this.$on("update-progress", (progress) => {
            ui.log.info(`update-progress: ${JSON.stringify(progress)}`)
            this.$refs.update.$emit("update-progress", progress)
        })
        this.$on("update-error", (err) => {
            ui.log.info(`update-error: ${JSON.stringify(err)}`)
            this.$refs.update.$emit("update-error", err)
        })

        /*  recordings change  */
        this.$on("recordings-update", () => {
            ui.log.info("recordings-update")
            this.$refs.login.$emit("recordings-update")
        })
        this.$on("recordings-renew", () => {
            ui.log.info("recordings-renew")
            this.$refs.login.$emit("recordings-renew")
        })

        /*  hotkey support  */
        Mousetrap.bind("ctrl+r", () => this.recording())
        Mousetrap.bind("ctrl+s", () => this.screenshot())
        Mousetrap.bind("ctrl+a", () => this.toggleAudio())
        Mousetrap.bind("ctrl+f", () => this.fullscreen())
        Mousetrap.bind("ctrl+q", () => this.quit())
        Mousetrap.bind("ctrl+m", (ev) => {
            this.$refs.message.focus()
            ev.preventDefault()
        })
        Mousetrap.bind("ctrl+u", () => this.feedback("thumbsup"))
        Mousetrap.bind("ctrl+d", () => this.feedback("thumbsdn"))
        Mousetrap.bind("ctrl+o", () => this.feedback("surprise"))
        Mousetrap.bind("ctrl+g", () => this.feedback("smile"))
        Mousetrap.bind("ctrl+x c", () => this.toggleVideoClosure())
        Mousetrap.bind("ctrl+x d", () => this.toggleVideoDebug())
        Mousetrap.bind("ctrl+x s", () => this.toggleStealthMode())

        /*  support blinking settings button  */
        this.timer3 = setInterval(() => {
            const blink = (
                this.personPortrait === ""
                || this.personName === ""
                || this.personPrivacy === ""
                || this.liveStreamBuffering === 0
                || this.audioOutputDevice === ""
            )
            this.$refs.login.$emit("blink-settings", blink)
        }, 1000)

        /*  support fatal error reporting  */
        this.$on("fatal-error", (err) => {
            ui.log.error(`fatal-error: ${err}`)
            this.fatalError = err
        })
    },

    /*  component destruction hook  */
    beforeDestroy () {
        /*  destroy timers  */
        if (this.timer1 !== null)
            clearTimeout(this.timer1)
        if (this.timer2 !== null)
            clearTimeout(this.timer2)
        if (this.timer3 !== null)
            clearTimeout(this.timer3)
        if (this.timer4 !== null)
            clearTimeout(this.timer4)
    }
}
</script>

