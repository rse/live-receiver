/*
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
*/

/*  external requirements  */
const electron = require("electron")

/*  enter an asynchronous environment in renderer process  */
;(async () => {
    /*  the global UI object  */
    ui = {}

    /*  persistent configuration settings  */
    ui.ipc = electron.ipcRenderer
    ui.settings = async (...args) => {
        return ui.ipc.invoke("settings", ...args)
    }

    /*  pass remote API to UI  */
    ui.remote  = require("electron").remote

    /*  external requirements  */
    ui.sprintf      = require("sprintfjs")
    ui.throttle     = require("throttle-debounce").throttle
    ui.debounce     = require("throttle-debounce").debounce
    ui.imageDataURI = require("image-data-uri")
    ui.pkg          = require("./package.json")

    /*  initialize sound effects  */
    const sfx = new SoundFX({ basedir: "node_modules/@rse/soundfx" })
    ui.soundfx = new Howl({ ...sfx.config(), volume: 0.4, preload: true })

    /*  initialize sound loops  */
    const slp = new SoundLP({ basedir: "node_modules/@rse/soundlp" })
    ui.soundlp = new Howl({ ...slp.config(), loop: true, volume: 0.4, preload: true })

    /*  helper function for converting VueJS properties into CSS variables  */
    ui.vueprop2cssvar = () => {
        return function () {
            const css = {}
            if (typeof this.$props === "object")
                for (const key of Object.keys(this.$props))
                    css[`--${key}`] = this[key]
            return css
        }
    }

    /*  initialize user interface  */
    document.addEventListener("DOMContentLoaded", (event) => {
        /*  support on-the-fly loading and compiling of Vue single-file components  */
        httpVueLoader.langProcessor.less = (lessText) =>
            less.render(lessText, {}).then((result) => result.css)
        Vue.use(httpVueLoader)

        /*  allow Vue modal windows  */
        window["vue-js-modal"].default.install(Vue, { dynamic: true, injectModalsContainer: true })

        /*  allow Vue DevTools integration  */
        Vue.config.devtools = true

        /*  defer until SVGs (see below) are loaded  */
        setTimeout(() => {
            /*  start DOM rendering with the outmost <win> component  */
            ui.root = new Vue({ el: "#ui", name: "ui", components: { "win": "url:app-ui-1-win.vue" } })

            /*  hook into the UI events
                (needs to be deferred for a small time until Vue renders the window)  */
            setTimeout(() => {
                ui.root.$refs.win.$on("login", async (info) => {
                    const result = await ui.ipc.invoke("login", info)
                    if (result.error)
                        ui.root.$refs.win.$emit("login-error", result.error)
                    else
                        ui.root.$refs.win.$emit("state", "video")
                })
                ui.root.$refs.win.$on("logout", async () => {
                    const result = await ui.ipc.invoke("logout")
                    if (!result.error)
                        ui.root.$refs.win.$emit("state", "login")
                })
                ui.root.$refs.win.$on("stream-buffering", async (buffer) => {
                    ui.ipc.invoke("stream-buffering", buffer)
                })
                ui.root.$refs.win.$on("video-resolution", async (resolution) => {
                    ui.ipc.invoke("video-resolution", resolution)
                })
                ui.root.$refs.win.$on("minimize", () => {
                    ui.ipc.invoke("minimize")
                })
                ui.root.$refs.win.$on("maximize", () => {
                    ui.ipc.invoke("maximize")
                })
                ui.root.$refs.win.$on("fullscreen", () => {
                    ui.ipc.invoke("fullscreen")
                })
                ui.root.$refs.win.$on("resize", (diff) => {
                    ui.ipc.invoke("resize", diff)
                })
                ui.root.$refs.win.$on("set-size", (size) => {
                    ui.ipc.invoke("set-size", size)
                })
                ui.root.$refs.win.$on("message", (message) => {
                    ui.ipc.invoke("message", message)
                })
            }, 300)
        }, 300)

        /*  hook into the main process events  */
        ui.ipc.on("stream-begin", (event) => {
            ui.root.$refs.win.$emit("stream-begin")
        })
        ui.ipc.on("stream-data", (event, data) => {
            ui.root.$refs.win.$emit("stream-data", data)
        })
        ui.ipc.on("stream-end", (event) => {
            ui.root.$refs.win.$emit("stream-end")
        })
    })

    /*  load avatar images  */
    ui.avatar = {}
    ui.avatar.man   = await ui.ipc.invoke("imageEncodeFromFile", "app-ui-2-portrait-avatar-man.svg")
    ui.avatar.woman = await ui.ipc.invoke("imageEncodeFromFile", "app-ui-2-portrait-avatar-woman.svg")

    /*  load logo images  */
    ui.logo = await ui.ipc.invoke("imageEncodeFromFile", "app-logo-white.svg")
})().catch((err) => {
    console.log(`** live-receiver: ui: ERROR: ${err}`)
})

