/*
**  Live Video Experience (LiVE)
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
*/

/*  external requirements  */
const electron    = require("electron")
const electronLog = require("electron-log")

/*  control run-time debugging (increase tracing or even avoid warnings)  */
if (process.env.DEBUG)
    process.traceProcessWarnings = true
else
    process.noDeprecation = true

/*  enter an asynchronous environment in renderer process  */
ui = {}
;(async () => {
    /*  flag the readyness of the DOM
        (we have to call this very early to not miss the event,
        although we will wait for this event later on)  */
    ui.domReady = false
    document.addEventListener("DOMContentLoaded", (event) => {
        ui.domReady = true
    })

    /*  provide support for opening external items  */
    ui.openExternal = (item) => {
        return electron.shell.openExternal(item)
    }

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
    Object.assign(VTooltip.VTooltip.options, {
        defaultHtml:    true,
        defaultDelay:   { show: 1000, hide: 0 },
        defaultOffset:  5,
        disposeTimeout: 0
    })
    Vue.use(VTooltip)

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
        "save-settings",
        "stream-buffering",
        "minimize", "maximize", "fullscreen",
        "resize", "set-size", "quit",
        "message", "feedback", "feeling",
        "screenshot"
    ]
    for (const event of events) {
        ui.root.$refs.win.$on(event, async (...args) => {
            ui.ipc.invoke(event, ...args)
        })
    }

    /*  pass-through events from main to renderer thread  */
    events = [
        "maximized", "fullscreened",
        "stream-begin", "stream-data", "stream-reset", "stream-end",
        "voting-begin", "voting-type", "voting-end",
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

