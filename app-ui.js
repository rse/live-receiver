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
const electron    = require("electron")
const electronLog = require("electron-log")

/*  enter an asynchronous environment in renderer process  */
;(async () => {
    /*  the global UI object  */
    ui = {}

    /*  flag the readyness of the DOM
        (we have to call this very early to not miss the event,
        although we will wait for this event later on)  */
    ui.domReady = false
    document.addEventListener("DOMContentLoaded", (event) => {
        ui.domReady = true
    })

    /*  provide logging  */
    ui.log = electronLog
    ui.log.transports.console.format = "{h}:{i}:{s}.{ms} › [{level}] {text}"
    ui.log.info("ui: starting up")

    /*  delay processing a certain amount of time  */
    ui.delay = (delay) =>
        new Promise((resolve) => setTimeout(resolve, delay))

    /*  persistent configuration settings  */
    ui.ipc = electron.ipcRenderer
    ui.settings = async (...args) => {
        return ui.ipc.invoke("settings", ...args)
    }

    /*  pass remote API to UI  */
    ui.remote = electron.remote

    /*  external requirements  */
    ui.sprintf      = require("sprintfjs")
    ui.throttle     = require("throttle-debounce").throttle
    ui.debounce     = require("throttle-debounce").debounce
    ui.imageDataURI = require("image-data-uri")
    ui.pkg          = require("./package.json")

    /*  initialize sound effects  */
    const sfx = new SoundFX({ basedir: "node_modules/@rse/soundfx" })
    ui.soundfx = new Howl({ ...sfx.config(), volume: 0.4, preload: true })

    /*  provide convenience method  */
    ui.soundfx.playAndWait = (name) => {
        const id = ui.soundfx.play(name)
        return new Promise((resolve, reject) => {
            ui.soundfx.once("end", () => {
                resolve()
            }, id)
            ui.soundfx.once("playerror", (err) => {
                reject(err)
            }, id)
        })
    }

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

    /*  load avatar images  */
    ui.avatar = {}
    ui.avatar.man   = await ui.ipc.invoke("imageEncodeFromFile", "app-res-avatar-man.svg")
    ui.avatar.woman = await ui.ipc.invoke("imageEncodeFromFile", "app-res-avatar-woman.svg")

    /*  load logo images  */
    ui.logo = await ui.ipc.invoke("imageEncodeFromFile", "app-res-logo-white.svg")

    /*  ensure the DOM is now finally available  */
    while (!ui.domReady || !document.getElementById("ui"))
        await ui.delay(50)
    ui.log.info("ui: DOM ready")

    /*  support on-the-fly loading and compiling of Vue single-file components  */
    httpVueLoader.langProcessor.less = (lessText) =>
        less.render(lessText, {}).then((result) => result.css)
    Vue.use(httpVueLoader)

    /*  support Vue multi-select widget  */
    Vue.component("v-multiselect", VueMultiselect.default)

    /*  support Vue tooltip functionality  */
    Vue.use(VTooltip, { disposeTimeout: 0 })

    /*  allow Vue DevTools integration  */
    Vue.config.devtools = true

    /*  start DOM rendering with the outmost <win> component  */
    ui.root = new Vue({ el: "#ui", name: "ui", components: { "win": "url:app-ui-1-window.vue" } })

    /*  ensure the <win> element is available  */
    while (!(typeof ui.root.$refs === "object" && ui.root.$refs.win !== undefined))
        await ui.delay(50)
    ui.log.info("ui: <win> ready")

    /*  hook into the UI events  */
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

    /*  pass-through events from renderer to main thread  */
    let events = [
        "stream-buffering",
        "minimize", "maximize", "fullscreen",
        "resize", "set-size", "quit",
        "message", "feedback", "feeling"
    ]
    for (const event of events) {
        ui.root.$refs.win.$on(event, async (...args) => {
            ui.ipc.invoke(event, ...args)
        })
    }

    /*  pass-through events from main to renderer thread  */
    events = [
        "stream-begin", "stream-data", "stream-end",
        "deep-link"
    ]
    for (const event of events) {
        ui.ipc.on(event, (ev, ...args) => {
            ui.root.$refs.win.$emit(event, ...args)
        })
    }

    /*  determine audio/video devices  */
    ui.devices = []
    const updateDevices = async () => {
        ui.devices = await navigator.mediaDevices.enumerateDevices()
        ui.root.$refs.win.$emit("updated-devices")
    }
    navigator.mediaDevices.ondevicechange = updateDevices
    await updateDevices()

    /*  finally signal main thread we are ready  */
    ui.log.info("ui: UI ready")
    ui.ipc.invoke("ui-ready")
})().catch((err) => {
    ui.log.error(`ui: ERROR: ${err}`)
})

