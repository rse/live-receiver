<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
**
-->

<template>
    <div class="update">
        <div class="title">
            {{ $t("update.title") }}
        </div>
        <div class="versions">
            <div class="versions-row headline">
                <div class="col-1 type">{{ $t("update.type-label") }}</div>
                <div class="col-2 version">{{ $t("update.version-label") }}</div>
                <div class="col-3 date">{{ $t("update.date-label") }}</div>
            </div>
            <div v-if="versions.forthcoming.version" class="versions-row">
                <div class="col-1 type">{{ $t("update.forthcoming-label") }}:</div>
                <div class="col-2 version">
                    <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.forthcoming.version"
                        v-on:click="openURL">
                        {{ versions.forthcoming.version }}
                    </a>
                </div>
                <div class="col-3 date">{{ versions.forthcoming.date }}</div>
                <div class="col-4 action box button"
                    v-if="updateable"
                    v-show="progress === null && versions.forthcoming.version !== versions.running.version"
                    v-on:click="updateToVersion(versions.forthcoming.version)">
                    <i class="fas fa-cloud-download-alt"></i>
                    &nbsp;
                    {{ $t("update.update-button") }}
                </div>
                <div class="col-4 action box button"
                    v-if="!updateable"
                    v-show="progress === null && versions.forthcoming.version !== versions.running.version">
                    <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.forthcoming.version"
                        v-on:click="openURL">
                        <i class="fas fa-external-link-alt"></i>
                        &nbsp;
                        {{ $t("update.download-button") }}
                    </a>
                </div>
            </div>
            <div v-if="versions.current.version" class="versions-row">
                <div class="col-1 type">{{ $t("update.current-label") }}:</div>
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
                    <i class="fas fa-cloud-download-alt"></i>
                    &nbsp;
                    {{ $t("update.update-button") }}
                </div>
                <div class="col-4 action box button"
                    v-if="!updateable"
                    v-show="progress === null && versions.current.version !== versions.running.version">
                    <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.current.version"
                        v-on:click="openURL">
                        <i class="fas fa-external-link-alt"></i>
                        &nbsp;
                        {{ $t("update.download-button") }}
                    </a>
                </div>
            </div>
            <div v-if="!versions.current.version" class="versions-row">
                <div class="col-1 type">{{ $t("update.current-label") }}:</div>
                <div class="col-2 version">N.A.</div>
                <div class="col-3 date">N.A.</div>
            </div>
            <div v-if="versions.running.version" class="versions-row">
                <div class="col-1 type">{{ $t("update.running-label") }}:</div>
                <div class="col-2 version">
                    <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + versions.running.version"
                        v-on:click="openURL">
                        {{ versions.running.version }}
                    </a>
                </div>
                <div class="col-3 date">{{ versions.running.date }}</div>
            </div>
            <div v-if="!versions.running.version" class="versions-row">
                <div class="col-1 type">{{ $t("update.running-label") }}:</div>
                <div class="col-2 version">N.A.</div>
                <div class="col-3 date">N.A.</div>
            </div>
        </div>
        <p/>
        <div class="desc" v-if="versions.running.type">
            <span
                v-html="$t('update.description-text-0', {
                    running: versions.running.version
                })">
            </span>
            <span v-if="versions.forthcoming.version === versions.running.version"
                v-html="$t('update.description-text-1')">
            </span>
            <span v-if="versions.current.version === versions.running.version"
                v-html="$t('update.description-text-2')">
            </span>
            <span v-if="versions.current.version !== versions.running.version"
                v-html="$t('update.description-text-3', {
                    state: $t('update.' + versions.running.type + '-label'),
                    current: versions.current.version
                })">
            </span>
            <span v-if="versions.forthcoming.version && versions.forthcoming.version !== versions.running.version"
                v-html="$t('update.description-text-4', {
                    forthcoming: versions.forthcoming.version
                })">
            </span>
        </div>
        <div class="desc" v-if="!versions.running.type">
            {{ $t("update.description-text-5") }}
        </div>
        <p/>
        <div class="hint">
            <span v-if="updateable">
                <b>{{ $t("update.hint-text-0") }}:</b>
                <a href="https://github.com/rse/live-receiver" v-on:click="openURL">LiVE Receiver</a>
                <span v-html="$t('update.hint-text-1')"></span>
                <span v-if="versions.current.version !== versions.running.version"
                    v-html="$t('update.hint-text-2')">
                </span>
            </span>
            <span v-if="!updateable">
                <b>{{ $t("update.hint-text-0") }}:</b>
                <a href="https://github.com/rse/live-receiver" v-on:click="openURL">LiVE Receiver</a>
                <span v-html="$t('update.hint-text-3')"></span>
                <span v-if="versions.current.version !== versions.running.version"
                    v-html="$t('update.hint-text-4')">
                </span>
            </span>
        </div>
        <p/>
        <div class="buttons">
            <div class="box button check"
                v-bind:class="{ disabled: progress !== null }"
                v-tooltip.bottom-center="{ content: $t('update.check-tooltip') }"
                v-on:click="updateCheck">
                <i class="fas fa-sync-alt"></i>
                &nbsp;
                {{ $t("update.check-button") }}
            </div>
            <div class="box button check"
                v-tooltip.bottom-center="{ content: $t('update.close-tooltip') }"
                v-bind:class="{ disabled: progress !== null }"
                v-on:click="updateClose">
                <i class="fas fa-times-circle"></i>
                &nbsp;
                {{ $t("update.close-button") }}
            </div>
        </div>
        <p/>
        <div class="progress" v-if="progress !== null">
            <b>{{ $t("update.progress-label") }}:</b>
            <div class="spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            {{ $t('update.task-' + progress.task) }}
            <div class="completion">
                <div class="total"></div>
                <div class="completed" v-bind:style="{ width: (progress.completed * 100) + '%' }"></div>
                <div class="caption">{{ (progress.completed * 100).toFixed(0) + '%' }}</div>
            </div>
        </div>
        <div class="progress" v-if="progress === null">
            <b>{{ $t("update.progress-label") }}:</b>
            {{ $t("update.none-label") }}
            <div class="completion">
                <div class="total disabled"></div>
            </div>
        </div>
        <div class="error" v-if="error !== null">
            <b>{{ $t("update.error-label") }}:</b>
            {{ error }}
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
    box-shadow: 0px 5px 20px var(--color-std-bg-2);
    padding: 20px 20px 20px 20px;
    border-radius: 5px;
    font-family: "TypoPRO Source Sans Pro";
    font-size: 12pt;
    width: 500px;
    .title {
        margin-bottom: 10px;
        font-size: 18pt;
        font-weight: 300;
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
        grid-template-columns: 80px 60px 90px 180px;
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
        width: calc(100% - 20px);
        text-align: center;
        color:                   var(--color-acc-fg-3);
        background-color:        var(--color-acc-bg-3);
        border-top:    1px solid var(--color-acc-bg-5);
        border-left:   1px solid var(--color-acc-bg-5);
        border-right:  1px solid var(--color-acc-bg-1);
        border-bottom: 1px solid var(--color-acc-bg-1);
        font-size: 12pt;
        padding: 0px 10px 0px 10px;
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
        color: var(--color-std-fg-3);
        border-radius: 5px;
        background-color:        var(--color-std-bg-4);
        border-top:    1px solid var(--color-std-bg-1);
        border-left:   1px solid var(--color-std-bg-1);
        border-right:  1px solid var(--color-std-bg-5);
        border-bottom: 1px solid var(--color-std-bg-5);
        padding: 8px 10px 12px 10px;
        position: relative;
        .spinner {
            position: absolute;
            top: 6px;
            right: 12px;
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
                background-color:        var(--color-std-bg-3);
                border-top:    1px solid var(--color-std-bg-1);
                border-left:   1px solid var(--color-std-bg-1);
                border-right:  1px solid var(--color-std-bg-5);
                border-bottom: 1px solid var(--color-std-bg-5);
                &.disabled {
                    background-color:        var(--color-std-bg-3);
                    border-top:    1px solid var(--color-std-bg-1);
                    border-left:   1px solid var(--color-std-bg-1);
                    border-right:  1px solid var(--color-std-bg-5);
                    border-bottom: 1px solid var(--color-std-bg-5);
                }
            }
            .completed {
                height: 20px;
                position: absolute;
                top: 0;
                left: 0;
                border-radius: 5px;
                background-color:        var(--color-acc-bg-3);
                border-top:    1px solid var(--color-acc-bg-5);
                border-left:   1px solid var(--color-acc-bg-5);
                border-right:  1px solid var(--color-acc-bg-1);
                border-bottom: 1px solid var(--color-acc-bg-1);
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
    .error {
        margin-top: 20px;
        color: var(--color-sig-fg-3);
        border-radius: 5px;
        border: 1px solid var(--color-sig-bg-3);
        padding: 8px 10px 12px 10px;
        position: relative;
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
        progress: null,
        error:    null
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
            this.progress = { task: "starting update check", completed: 0.0 }
            this.$emit("update-check")
        },
        updateToVersion (version) {
            if (this.progress !== null)
                return
            this.progress = { task: "starting update process", completed: 0.0 }
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
            if (!(     this.versions.running
                    && this.versions.running.version
                    && ((      this.versions.current
                            && this.versions.current.version
                            && this.versions.running.version === this.versions.current.version)
                        || (   this.versions.forthcoming
                            && this.versions.forthcoming.version
                            && this.versions.running.version === this.versions.forthcoming.version)))) {
                if (this.versions.running.type === "deprecated")
                    this.$emit("update-notify", "hard")
                else
                    this.$emit("update-notify", "soft")
            }
            else
                this.$emit("update-notify", "none")
        })
        this.$on("update-progress", (progress) => {
            this.progress = progress
        })
        this.$on("update-error", (err) => {
            this.progress = null
            this.error = err.toString()
            setTimeout(() => {
                this.error = null
                this.progress = null
            }, 5000)
        })
    }
}
</script>

