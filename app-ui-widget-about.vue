<!--
**
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
**
-->

<template>
    <div class="about">
        <div class="col-2-3">
            <div class="title">
                {{ $t("about.title") }}
            </div>
        </div>
        <div class="col-1">
            <img v-bind:src="logo" class="logo" alt="LiVE"/>
            <div class="logo-title">
                <a href="https://github.com/rse/live-receiver" v-on:click="openURL">Receiver</a>
                <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + pkg.version" v-on:click="openURL">{{ pkg.version }}</a>
            </div>
        </div>
        <div class="col-2-3">
            <a href="https://github.com/rse/live-receiver" v-on:click="openURL">LiVE Receiver</a>
            {{ $t("about.description-1") }}
            <a href="https://video-experience.live" v-on:click="openURL">Live Video Experience (LiVE, video-experience.live)</a>,
            {{ $t("about.description-2") }}

            <p/>
            <a href="https://github.com/rse/live-receiver" v-on:click="openURL">LiVE Receiver</a>
            <a v-bind:href="'https://github.com/rse/live-receiver/releases/tag/' + pkg.version" v-on:click="openURL">{{ pkg.version }}</a>
            <span v-html="$t('about.description-3')"></span>
            <a href="https://engelschall.com" v-on:click="openURL">Dr. Ralf S. Engelschall</a>
            {{ $t("about.description-4") }}
            <a href="https://spdx.org/licenses/GPL-3.0-only" v-on:click="openURL">General Public License (GPL) 3.0</a>.
            <span v-html="$t('about.description-5')"></span>

            <p/>
            <div class="versions">
                <table>
                    <tr>
                        <td class="product"><a href="https://www.electronjs.org/" v-on:click="openURL">Electron</a></td>
                        <td class="version">{{ versions.electron }}</td>
                        <td class="product"><a href="https://vuejs.org/" v-on:click="openURL">Vue.js</a></td>
                        <td class="version">{{ pkg.dependencies.vue }}</td>
                    </tr>
                    <tr>
                        <td class="product"><a href="https://nodejs.org/" v-on:click="openURL">Node.js</a></td>
                        <td class="version">{{ versions.node }}</td>
                        <td class="product"><a href="https://lesscss.org/" v-on:click="openURL">LESS-CSS</a></td>
                        <td class="version">{{ pkg.dependencies.less }}</td>
                    </tr>
                    <tr>
                        <td class="product"><a href="https://www.chromium.org/" v-on:click="openURL">Chromium</a></td>
                        <td class="version">{{ versions.chrome }}</td>
                        <td class="product"><a href="https://fontawesome.com/" v-on:click="openURL">Font Awesome</a></td>
                        <td class="version">{{ pkg.dependencies["@fortawesome/fontawesome-free"] }}</td>
                    </tr>
                    <tr>
                        <td class="product"><a href="https://ffmpeg.org/" v-on:click="openURL">FFmpeg</a></td>
                        <td class="version">4.3.2</td>
                        <td class="product"><a href="https://typopro.org" v-on:click="openURL">TypoPRO</a></td>
                        <td class="version">{{ pkg.dependencies["typopro-web"] }}</td>
                    </tr>
                    <tr>
                        <td class="product"><a href="https://gpac.github.io/mp4box.js/" v-on:click="openURL">MP4Box.js</a></td>
                        <td class="version">{{ pkg.dependencies.mp4box }}</td>
                        <td class="product"><a href="https://animejs.com/" v-on:click="openURL">Anime.js</a></td>
                        <td class="version">{{ pkg.dependencies.animejs }}</td>
                    </tr>
                    <tr>
                        <td class="product"><a href="https://npmjs.com/mqtt" v-on:click="openURL">MQTT.js</a></td>
                        <td class="version">{{ pkg.dependencies.mqtt }}</td>
                        <td class="product"><a href="https://howlerjs.com/" v-on:click="openURL">Howler.js</a></td>
                        <td class="version">{{ pkg.dependencies.howler }}</td>
                    </tr>
                    <tr>
                        <td class="product"><a href="https://npmjs.com/@rse/soundfx" v-on:click="openURL">SoundFX</a></td>
                        <td class="version">{{ pkg.dependencies["@rse/soundfx"] }}</td>
                        <td class="product"><a href="https://npmjs.com/audio-node-suite" v-on:click="openURL">Audio-Node-Suite</a></td>
                        <td class="version">{{ pkg.dependencies["audio-node-suite"] }}</td>
                    </tr>
                </table>
            </div>

            <p/>
            <div class="box button close"
                v-on:click="$emit('close')"
                v-tooltip.bottom="{ content: $t('about.close-tooltip') }">
                <i class="fas fa-times-circle"></i>
                &nbsp;
                {{ $t("about.close-button") }}
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.about {
    background-color: var(--color-std-bg-4);
    border-top:    1px solid var(--color-std-bg-5);
    border-left:   1px solid var(--color-std-bg-5);
    border-right:  1px solid var(--color-std-bg-1);
    border-bottom: 1px solid var(--color-std-bg-1);
    box-shadow: 0px 5px 20px var(--color-std-bg-2);
    padding: 20px 30px 20px 30px;
    border-radius: 5px;
    display: grid;
    grid-template-columns: 120px 80px 350px;
    column-gap: 20px;
    row-gap: 0px;
    font-family: "TypoPRO Source Sans Pro";
    font-size: 11pt;
    .col-1 {
        grid-column-start: 1;
    }
    .col-2 {
        grid-column-start: 2;
    }
    .col-3 {
        grid-column-start: 3;
    }
    .col-2-3 {
        grid-column-start: 2;
        grid-column-end: 4;
    }
    .title {
        margin-bottom: 10px;
        font-size: 18pt;
        font-weight: 300;
    }
    .logo {
        width: 90%;
    }
    .logo-title {
        margin-left: 4px;
        a {
            font-size: 13pt;
            font-weight: 300;
            color: var(--color-std-fg-3);
        }
    }
    .versions {
        font-weight: 200;
        table, tr, td {
            padding: 0;
            margin: 0;
            border-spacing: 0;
        }
        .product {
            padding-left: 30px;
        }
        .version {
            padding-left: 10px;
        }
    }
    .close {
        border-radius: 5px;
        width: 100%;
        text-align: center;
        background-color: var(--color-std-bg-4);
        font-size: 12pt;
        padding-top: 4px;
        padding-bottom: 4px;
        &:hover {
            background-color: var(--color-sig-bg-4);
            color: var(--color-sig-fg-4);
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
    name: "about",

    /*  component variable properties  */
    data: function () {
        return {
            logo:     ui.logo1,
            pkg:      ui.pkg,
            versions: process.versions
        }
    },

    /*  component methods  */
    methods: {
        openURL (ev) {
            const url = ev.target.getAttribute("href")
            ev.preventDefault()
            ui.openExternal(url)
        }
    }
}
</script>

