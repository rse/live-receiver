<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
**
-->

<template>
    <div class="update">
        <div class="title">
            Your LiVE Receiver Update Check
        </div>
        <div class="versions">
            <div class="versions-row headline">
                <div class="col-1 type">Type</div>
                <div class="col-2 version">Version</div>
                <div class="col-3 date">Date</div>
            </div>
            <div v-if="versions.forthcoming.version" class="versions-row">
                <div class="col-1 type">Forthcoming:</div>
                <div class="col-2 version">
                    <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.forthcoming.version"
                        v-on:click="openURL">
                        {{ versions.forthcoming.version }}
                    </a>
                </div>
                <div class="col-3 date">{{ versions.forthcoming.date }}</div>
                <div class="col-4 action box button"
                    v-if="updateable"
                    v-show="progress === null"
                    v-on:click="updateToVersion(versions.forthcoming.version)">
                    Update to version!
                </div>
                <div class="col-4 action box button"
                    v-if="!updateable"
                    v-show="progress === null">
                    <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.forthcoming.version"
                        v-on:click="openURL">
                        Download version!
                    </a>
                </div>
            </div>
            <div v-if="versions.current.version" class="versions-row">
                <div class="col-1 type">Current:</div>
                <div class="col-2 version">
                    <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.current.version"
                        v-on:click="openURL">
                        {{ versions.current.version }}
                    </a>
                </div>
                <div class="col-3 date">{{ versions.current.date }}</div>
                <div class="col-4 action box button"
                    v-if="updateable"
                    v-show="progress === null && versions.current.version !== versions.running.version"
                    v-on:click="updateToVersion(versions.current.version)">
                    Update to version!
                </div>
                <div class="col-4 action box button"
                    v-if="!updateable"
                    v-show="progress === null && versions.current.version !== versions.running.version">
                    <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.current.version"
                        v-on:click="openURL">
                        Download version!
                    </a>
                </div>
            </div>
            <div v-if="!versions.current.version" class="versions-row">
                <div class="col-1 type">Current:</div>
                <div class="col-2 version">N.A.</div>
                <div class="col-3 date">N.A.</div>
            </div>
            <div v-if="versions.running.version" class="versions-row">
                <div class="col-1 type">Running:</div>
                <div class="col-2 version">
                    <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.running.version"
                        v-on:click="openURL">
                        {{ versions.running.version }}
                    </a>
                </div>
                <div class="col-3 date">{{ versions.running.date }}</div>
            </div>
            <div v-if="!versions.running.version" class="versions-row">
                <div class="col-1 type">Running:</div>
                <div class="col-2 version">N.A.</div>
                <div class="col-3 date">N.A.</div>
            </div>
        </div>
        <p/>
        <div class="desc">
            You are currently running
            <a href="https://github.com/rse/live-receiver" v-on:click="openURL">LiVE Receiver</a> version
            <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.running.version">
            <b>{{ versions.running.version ? versions.running.version : "N.A." }}</b></a>.<br/>
            <span v-if="versions.current.version === versions.running.version">
                This <b>running</b> version is still the <b>current</b> version.<br/>
                Currently, there is still no update necessary.<br/>
            </span>
            <span v-if="versions.current.version !== versions.running.version">
                This <b>running</b> version is already in state <b>{{ versions.running.type ? versions.running.type : "N.A." }}</b>.<br/>
                Please upgrade to the <b>current</b> version
                <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.current.version">
                <b>{{ versions.current.version }}</b></a>!<br/>
            </span>
            <span v-if="versions.forthcoming.version">
                At your option and risk, you can even already upgrade to the <b>forthcoming</b> version
                <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.forthcoming.version">
                <b>{{ versions.forthcoming.version }}</b></a>.<br/>
            </span>
        </div>
        <p/>
        <div class="hint">
            <span v-if="updateable">
                <b>Hint:</b> Your
                <a href="https://github.com/rse/live-receiver" v-on:click="openURL">LiVE Receiver</a>
                is automatically updateable from this dialog.
                <span v-if="versions.current.version !== versions.running.version">
                    Just press the "<b>Update to version!</b>" button above
                    for updating to the particular version, please!
                </span>
            </span>
            <span v-if="!updateable">
                <b>Hint</b>: Your
                <a href="https://github.com/rse/live-receiver" v-on:click="openURL">LiVE Receiver</a>
                unfortunately is <u>not</u> automatically updateable from this dialog, because you are <u>not</u>
                running a packaged version or the application files can
                <u>not</u> be overwritten with the current user permissions.
                <span v-if="versions.current.version !== versions.running.version">
                    For updating, either re-start
                    <a href="https://github.com/rse/live-receiver" v-on:click="openURL">LiVE Receiver</a>
                    with elevated user privileges or press the "<b>Download version!</b>" button
                    above to just open the updated version in your Browser and then perform the
                    download and update manually, please!
                </span>
            </span>
        </div>
        <p/>
        <div class="buttons">
            <div v-bind:class="{ box: true, button: true, check: true, disabled: progress !== null }"
                v-on:click="updateCheck">Check for Updates</div>
            <div v-bind:class="{ box: true, button: true, close: true, disabled: progress !== null }"
                v-on:click="updateClose">Stay &amp; Close</div>
        </div>
        <p/>
        <div class="progress" v-if="progress !== null">
            <b>Progress:</b>
            <div class="spinner">
                <i class="fa fa-spinner fa-spin"></i>
            </div>
            {{ progress.task }}
            <div class="completion">
                <div class="total"></div>
                <div class="completed" v-bind:style="{ width: (progress.completed * 100) + '%' }"></div>
                <div class="caption">{{ (progress.completed * 100).toFixed(0) + '%' }}</div>
            </div>
        </div>
        <div class="progress" v-if="progress === null">
            <b>Progress:</b>
            none
            <div class="completion">
                <div class="total disabled"></div>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.update {
    background-color: var(--color-std-bg-4);
    border-top:    1px solid var(--color-std-bg-5);
    border-left:   1px solid var(--color-std-bg-5);
    border-right:  1px solid var(--color-std-bg-1);
    border-bottom: 1px solid var(--color-std-bg-1);
    padding: 20px 20px 20px 20px;
    border-radius: 5px;
    font-family: "TypoPRO Source Sans Pro";
    font-size: 12pt;
    width: 500px;
    .title {
        margin-bottom: 10px;
        font-size: 18pt;
        font-weight: 200;
    }
    .desc {
        color: var(--color-acc-fg-3);
        a {
            color: var(--color-acc-fg-5);
        }
    }
    .hint {
        font-size: 8pt;
    }
    .versions-row {
        display: grid;
        grid-template-columns: 80px 60px 90px 130px;
        column-gap: 20px;
        row-gap: 0px;
        .col-1 {
            grid-column-start: 1;
        }
        .col-2 {
            grid-column-start: 2;
        }
        .col-3 {
            grid-column-start: 3;
        }
        .col-4 {
            grid-column-start: 4;
        }
        .version {
            font-weight: bold;
        }
        &.headline {
            font-weight: 200;
            .version {
                font-weight: 200;
            }
        }
    }
    .box.button.action {
        border-radius: 5px;
        width: 100%;
        text-align: center;
        color:                   var(--color-acc-fg-3);
        background-color:        var(--color-acc-bg-3);
        border-top:    1px solid var(--color-acc-bg-5);
        border-left:   1px solid var(--color-acc-bg-5);
        border-right:  1px solid var(--color-acc-bg-1);
        border-bottom: 1px solid var(--color-acc-bg-1);
        font-size: 12pt;
        padding-top: 0px;
        padding-bottom: 0px;
        &:hover {
            color:                   var(--color-sig-fg-4);
            background-color:        var(--color-sig-bg-4);
            border-top:    1px solid var(--color-sig-bg-5);
            border-left:   1px solid var(--color-sig-bg-5);
            border-right:  1px solid var(--color-sig-bg-1);
            border-bottom: 1px solid var(--color-sig-bg-1);
        }
    }
    .progress {
        margin-top: 20px;
        color: var(--color-acc-fg-3);
        border-radius: 5px;
        border: 1px solid var(--color-acc-bg-3);
        padding: 8px 10px 12px 10px;
        position: relative;
        .spinner {
            position: absolute;
            top: 6px;
            right: 12px;
            font-color: var(--color-acc-fg-5);
        }
        .completion {
            margin-top: 4px;
            position: relative;
            width: 100%;
            height: 20px;
            .total {
                width: 100%;
                height: 20px;
                position: absolute;
                top: 0;
                left: 0;
                border-radius: 5px;
                background-color:        var(--color-acc-bg-2);
                border-top:    1px solid var(--color-acc-bg-3);
                border-left:   1px solid var(--color-acc-bg-3);
                border-right:  1px solid var(--color-acc-bg-1);
                border-bottom: 1px solid var(--color-acc-bg-1);
                &.disabled {
                    background-color:        var(--color-acc-bg-1);
                    border-top:    1px solid var(--color-acc-bg-1);
                    border-left:   1px solid var(--color-acc-bg-1);
                    border-right:  1px solid var(--color-acc-bg-1);
                    border-bottom: 1px solid var(--color-acc-bg-1);
                }
            }
            .completed {
                height: 20px;
                position: absolute;
                top: 0;
                left: 0;
                border-radius: 5px;
                background-color:        var(--color-acc-bg-4);
                border-top:    1px solid var(--color-acc-bg-5);
                border-left:   1px solid var(--color-acc-bg-5);
                border-right:  1px solid var(--color-acc-bg-3);
                border-bottom: 1px solid var(--color-acc-bg-3);
            }
            .caption {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                text-align: center;
                color: var(--color-acc-fg-3);
            }
        }
    }
    .buttons {
        width: 100%;
        display: flex;
        flex-direction: row;
    }
    .check {
        border-radius: 5px;
        width: calc(50% - 4px);
        text-align: center;
        background-color: var(--color-std-bg-4);
        font-size: 12pt;
        padding-top: 4px;
        padding-bottom: 4px;
        margin-right: 4px;
        &:hover {
            background-color:        var(--color-sig-bg-4);
            color:                   var(--color-sig-fg-4);
            border-top:    1px solid var(--color-sig-bg-5);
            border-left:   1px solid var(--color-sig-bg-5);
            border-right:  1px solid var(--color-sig-bg-1);
            border-bottom: 1px solid var(--color-sig-bg-1);
        }
        &.disabled {
            background-color:        var(--color-std-bg-3);
            color:                   var(--color-std-fg-2);
            border-top:    1px solid var(--color-std-bg-4);
            border-left:   1px solid var(--color-std-bg-4);
            border-right:  1px solid var(--color-std-bg-1);
            border-bottom: 1px solid var(--color-std-bg-1);
        }
    }
    .close {
        border-radius: 5px;
        width: calc(50% - 4px);
        text-align: center;
        background-color: var(--color-std-bg-4);
        font-size: 12pt;
        padding-top: 4px;
        padding-bottom: 4px;
        margin-left: 4px;
        &:hover {
            background-color:        var(--color-sig-bg-4);
            color:                   var(--color-sig-fg-4);
            border-top:    1px solid var(--color-sig-bg-5);
            border-left:   1px solid var(--color-sig-bg-5);
            border-right:  1px solid var(--color-sig-bg-1);
            border-bottom: 1px solid var(--color-sig-bg-1);
        }
        &.disabled {
            background-color:        var(--color-std-bg-3);
            color:                   var(--color-std-fg-2);
            border-top:    1px solid var(--color-std-bg-4);
            border-left:   1px solid var(--color-std-bg-4);
            border-right:  1px solid var(--color-std-bg-1);
            border-bottom: 1px solid var(--color-std-bg-1);
        }
    }
    a, a:hover, a:visited {
        outline: none;
        text-decoration: none;
        color: var(--color-std-fg-5);
        border-radius: 5px;
    }
    a:hover {
        background-color: var(--color-sig-bg-3);
        color: var(--color-sig-fg-3);
    }
}
</style>

<script>
module.exports = {
    name: "update",

    /*  component variable properties  */
    data: () => ({
        updateable: false,
        versions: { running: {}, current: {}, forthcoming: {} },
        progress: null
    }),

    /*  component methods  */
    methods: {
        openURL (ev) {
            const url = ev.target.getAttribute("href")
            ev.preventDefault()
            ui.openExternal(url)
        },
        updateCheck () {
            if (this.progress !== null)
                return
            this.progress = { task: "starting update check", completion: 0.0 }
            this.versions.running = {}
            this.versions.current = {}
            this.versions.fortcoming = {}
            this.$emit("update-check")
        },
        updateToVersion (version) {
            if (this.progress !== null)
                return
            this.progress = { task: "starting update process", completion: 0.0 }
            this.$emit("update-to-version", version)
        },
        updateClose () {
            if (this.progress !== null)
                return
            this.$emit("close")
        }
    },

    /*  component live-cycle hook  */
    created () {
        this.$on("update-updateable", (updateable) => {
            this.updateable = updateable
        })
        this.$on("update-versions", (versions) => {
            this.versions.running     = versions.running     ? versions.running     : {}
            this.versions.current     = versions.current     ? versions.current     : {}
            this.versions.forthcoming = versions.forthcoming ? versions.forthcoming : {}
            if (this.versions.running
                && this.versions.running.version
                && this.versions.current
                && this.versions.current.version
                && this.versions.running.version !== this.versions.current.version)
                this.$emit("update-notify", true)
            else
                this.$emit("update-notify", false)
        })
        this.$on("update-progress", (progress) => {
            this.progress = progress
        })
    }
}
</script>

