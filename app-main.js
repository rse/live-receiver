/*
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
*/

/*  standard requirements  */
const os           = require("os")
const fs           = require("fs")
const path         = require("path")

/*  external requirements  */
const electron     = require("electron")
const electronLog  = require("electron-log")
const imageDataURI = require("image-data-uri")
const throttle     = require("throttle-debounce").throttle
const dayjs        = require("dayjs")
const syspath      = require("syspath")
const UUID         = require("pure-uuid")
const mkdirp       = require("mkdirp")
const jsYAML       = require("js-yaml")

/*  internal requirements  */
const Settings     = require("./app-main-settings")
const VideoStream  = require("./app-main-relay-videostream")
const EventStream  = require("./app-main-relay-eventstream")
const Recording    = require("./app-main-recording")
const Update       = require("./app-main-update")
const pkg          = require("./package.json")

/*  control run-time debugging (increase tracing or even avoid warnings)  */
if (typeof process.env.DEBUG !== "undefined")
    process.traceProcessWarnings = true
else
    process.noDeprecation = true

/*  enter an asynchronous environment in main process  */
const app = electron.app
;(async () => {
    /*  initialize global information  */
    app.win       = null
    app.connected = false

    /*  provide APIs for communication  */
    app.ipc   = electron.ipcMain

    /*  provide logging facility  */
    app.log = electronLog
    if (typeof process.env.DEBUG !== "undefined") {
        app.log.transports.file.level    = "debug"
        app.log.transports.console.level = "debug"
    }
    else {
        app.log.transports.file.level    = "info"
        app.log.transports.console.level = false
    }
    app.log.transports.remote.level  = false
    app.log.transports.ipc.level     = false
    app.log.transports.console.format = "{h}:{i}:{s}.{ms} › [{level}] {text}"
    app.log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}"
    app.log.debug(`(persistent log under ${app.log.transports.file.getFile()})`)
    app.log.info("main: starting up")

    /*  track the readyness of the UI  */
    app.uiReady = false
    app.ipc.handle("ui-ready", (event) => {
        app.log.info("main: UI ready")
        app.uiReady = true
    })

    /*  react on "live://<live-relay-server>/<live-access-token>" deep-links  */
    const deepLinkURL = (url) => {
        /*  parse deep-link URL  */
        const m = url.match(/^live:\/\/([^/]+)\/([^/]+)$/)
        if (m === null)
            return
        const [ , liveRelayServer, liveAccessToken ] = m

        /*  send event to application window
            (once the UI is really ready)  */
        const deliverEvent = (attempts) => {
            if (app.win !== null && app.uiReady) {
                app.log.info("main: send deep-link event to UI")
                app.win.webContents.send("deep-link", { liveRelayServer, liveAccessToken })
            }
            else if (--attempts > 0)
                setTimeout(() => deliverEvent(attempts), 250)
            else
                throw Error("failed to deliver deep-link event to application window")
        }
        deliverEvent(5 * 10)
    }

    /*  hook into macOS-only protocol handling  */
    if (os.platform() === "darwin") {
        app.setAsDefaultProtocolClient("live")
        app.on("open-url", (event, data) => {
            event.preventDefault()

            /*  notify about deep-linking  */
            deepLinkURL(data)
        })
    }

    /*  hook into macOS/Windows single-instance handling  */
    const isPrimary = app.requestSingleInstanceLock()
    if (!isPrimary) {
        /*  stop secondary instances  */
        app.quit()
        return
    }
    app.on("second-instance", (event, argv, cwd) => {
        /*  raise window on primary instance  */
        if (app.win !== null) {
            if (app.win.isMinimized())
                app.win.restore()
            app.win.focus()
        }

        /*  notify about deep-linking under Windows
            (in case we are the primary instance and a second instance was executed) */
        if (os.platform() === "win32" && argv.length > 0)
            deepLinkURL(argv[argv.length - 1])
    })

    /*  notify about deep-linking under Windows
        (in case we are the primary instance and were just initially started) */
    if (os.platform() === "win32" && process.argv.length > 0)
        deepLinkURL(process.argv[process.argv.length - 1])

    /*  under Linux prevent trouble by disabling
        the hardware acceleration through the GPU  */
    if (os.platform() === "linux")
        app.disableHardwareAcceleration()

    /*  start startup procedure once Electron is ready  */
    app.on("ready", async () => {
        /*  establish update process  */
        app.update = new Update()

        /*  establish settings and their default values  */
        const clientId = (new UUID(1)).format("std")
        const settings = new Settings({ appId: "LiVE-Receiver", flushAfter: 1 * 1000 })
        settings.load()
        app.clientId             = settings.get("client-id",              clientId)
        app.x                    = settings.get("window-x",               100)
        app.y                    = settings.get("window-y",               100)
        app.w                    = settings.get("window-width",           975)
        app.h                    = settings.get("window-height",          550 + 2 * 42)
        app.personPortrait       = settings.get("person-portrait",        "")
        app.personName           = settings.get("person-name",            "")
        app.personPrivacy        = settings.get("person-privacy",         "private")
        app.liveRelayServer      = settings.get("live-relay-server",      "")
        app.liveAccessToken      = settings.get("live-access-token",      "")
        app.liveStreamBuffering  = settings.get("live-stream-buffering",  2000)
        app.recordingHours       = settings.get("recording-hours",        0)
        app.audioInputDevice     = settings.get("audio-input-device",     "")
        app.audioOutputDevice    = settings.get("audio-output-device",    "")
        app.language             = settings.get("language",               "en")

        /*  ensure to-be-restored window position is still valid
            (because if external dispays are used, they can be no longer connected)  */
        const visible = electron.screen.getAllDisplays().some((display) => {
            return (
                app.x >= display.bounds.x
                && app.y >= display.bounds.y
                && app.x + app.w <= display.bounds.x + display.bounds.width
                && app.y + app.h <= display.bounds.y + display.bounds.height
            )
        })
        if (!visible) {
            app.x = 100
            app.y = 100
            app.w = 975
            app.h = 550 + 2 * 42
        }

        /*  save back the settings once at startup  */
        settings.set("client-id",              app.clientId)
        settings.set("window-x",               app.x)
        settings.set("window-y",               app.y)
        settings.set("window-width",           app.w)
        settings.set("window-height",          app.h)
        settings.set("person-portrait",        app.personPortrait)
        settings.set("person-name",            app.personName)
        settings.set("person-privacy",         app.personPrivacy)
        settings.set("live-relay-server",      app.liveRelayServer)
        settings.set("live-access-token",      app.liveAccessToken)
        settings.set("live-stream-buffering",  app.liveStreamBuffering)
        settings.set("recording-hours",        app.recordingHours)
        settings.set("audio-input-device",     app.audioInputDevice)
        settings.set("audio-output-device",    app.audioOutputDevice)
        settings.set("language",               app.language)
        settings.save()

        /*  provide helper functions for renderer  */
        app.ipc.handle("settings", async (event, ...args) => {
            const old = settings.get(args[0])
            if (args.length === 2)
                settings.set(args[0], args[1])
            return old
        })
        app.ipc.handle("imageEncodeFromFile", async (event, filename) => {
            const data = await imageDataURI.encodeFromFile(path.resolve(__dirname, filename))
            return data
        })
        app.ipc.handle("screen-scale-factor", async (event) => {
            const display = electron.screen.getPrimaryDisplay()
            return display.scaleFactor
        })

        /*  provide generic function bridge for renderer  */
        const fnb = { electron }
        const fns = [ "electron.dialog.showOpenDialog" ]
        for (const fn of fns) {
            const p = fn.split(".")
            let f = fnb[p[0]]
            for (let i = 1; i < p.length; i++)
                f = f[p[i]]
            app.ipc.handle(fn, (...args) => {
                return f(...args)
            })
        }

        /*  redirect exception error boxes to the console  */
        electron.dialog.showErrorBox = (title, content) => {
            app.log.info(`main: UI: exception: ${title}: ${content}`)
        }

        /*  create application window  */
        app.win = new electron.BrowserWindow({
            icon:            path.join(__dirname, "app-res-icon.png"),
            backgroundColor: "#222222",
            useContentSize:  true,
            frame:           false,
            transparent:     false,
            show:            false,
            x:               app.x,
            y:               app.y,
            width:           app.w,
            height:          app.h,
            minWidth:        975,
            minHeight:       550 + 2 * 42,
            resizable:       true,
            webPreferences: {
                devTools:                   (typeof process.env.DEBUG !== "undefined"),
                nodeIntegration:            true,
                nodeIntegrationInWorker:    true,
                contextIsolation:           false,
                worldSafeExecuteJavaScript: true,
                disableDialogs:             true,
                enableRemoteModule:         true,
                autoplayPolicy:             "no-user-gesture-required",
                spellcheck:                 false
            }
        })
        app.win.setHasShadow(true)
        app.win.setContentProtection(!(typeof process.env.DEBUG !== "undefined"))
        app.win.loadURL("file://" + path.join(__dirname, "app-ui.html"))
        if (typeof process.env.DEBUG !== "undefined") {
            setTimeout(() => {
                app.win.webContents.openDevTools()
            }, 1000)
        }
        app.win.on("ready-to-show", () => {
            app.win.show()
            app.win.focus()
        })
        app.win.webContents.on("did-finish-load", () => {
            app.win.webContents.setZoomFactor(1.0)
            app.win.webContents.setZoomLevel(0)
            app.win.webContents.setVisualZoomLevelLimits(1, 1)
        })

        /*  configure application menu
            (actually only relevant under macOS where even frameless windows have a menu)  */
        const openURL = (url) =>
            async () => { await electron.shell.openExternal(url) }
        const menuTemplate = [
            {
                label: app.name,
                submenu: [
                    { role: "about" },
                    { type: "separator" },
                    { role: "hide" },
                    { role: "hideothers" },
                    { role: "unhide" },
                    { type: "separator" },
                    { role: "quit" }
                ]
            }, {
                label: "Edit",
                submenu: [
                    { role: "cut" },
                    { role: "copy" },
                    { role: "paste" }
                ]
            }, {
                role: "window",
                submenu: [
                    { role: "minimize" },
                    { role: "zoom" },
                    { role: "togglefullscreen" },
                    { role: "front" }
                ]
            }, {
                role: "help",
                submenu: [
                    { label: "More about LiVE",          click: openURL("https://video-experience.live") },
                    { label: "More about LiVE Receiver", click: openURL("https://github.com/rse/live-receiver") }
                ]
            }
        ]
        const menu = electron.Menu.buildFromTemplate(menuTemplate)
        electron.Menu.setApplicationMenu(menu)

        /*  react on explicit window close  */
        app.ipc.handle("quit", (event) => {
            settings.save()
            app.quit()
        })

        /*  react on implicit window close  */
        app.win.on("closed", () => {
            settings.save()
            app.quit()
        })

        /*  react on all windows closed  */
        app.on("window-all-closed", () => {
            settings.save()
            app.quit()
        })

        /*  handle window minimize functionality  */
        let minimized = false
        app.win.on("minimize", () => {
            minimized = true
        })
        app.win.on("restore", () => {
            minimized = false
        })
        app.ipc.handle("minimize", (event) => {
            if (minimized) {
                app.win.restore()
                app.win.focus()
            }
            else
                app.win.minimize()
        })

        /*  handle window maximize functionality  */
        let maximized = false
        app.win.on("maximize", () => {
            maximized = true
            app.win.webContents.send("maximized", true)
        })
        app.win.on("unmaximize", () => {
            maximized = false
            app.win.webContents.send("maximized", false)
        })
        app.ipc.handle("maximize", (event) => {
            if (maximized)
                app.win.unmaximize()
            else
                app.win.maximize()
        })

        /*  handle window fullscreen functionality  */
        let fullscreened = false
        app.win.on("enter-full-screen", () => {
            fullscreened = true
            app.win.webContents.send("fullscreened", true)
        })
        app.win.on("leave-full-screen", () => {
            fullscreened = false
            app.win.webContents.send("fullscreened", false)
        })
        app.ipc.handle("fullscreen", (event) => {
            app.win.setFullScreen(!fullscreened)
        })

        /*  track application window changes  */
        const updateBounds = () => {
            const bounds = app.win.getBounds()
            app.x = bounds.x
            app.y = bounds.y
            app.w = bounds.width
            app.h = bounds.height
            settings.set("window-x",      app.x)
            settings.set("window-y",      app.y)
            settings.set("window-width",  app.w)
            settings.set("window-height", app.h)
        }
        app.win.on("resize", throttle(1000, () => {
            minimized    = app.win.isMinimized()
            maximized    = app.win.isMaximized()
            fullscreened = app.win.isFullScreen()
            app.win.webContents.send("maximized",    maximized)
            app.win.webContents.send("fullscreened", fullscreened)
            updateBounds()
        }))
        app.win.on("move", throttle(1000, () => {
            updateBounds()
        }))

        /*  handle window resizing functionality  */
        app.ipc.handle("set-size", (event, size) => {
            minimized    = false
            maximized    = false
            fullscreened = false
            app.win.webContents.send("maximized",    false)
            app.win.webContents.send("fullscreened", false)
            app.w = size.w
            app.h = size.h
            app.win.setSize(app.w, app.h)
        })

        /*  handle screenshot creation  */
        app.ipc.handle("screenshot", async (event, rect) => {
            const nativeImage = await app.win.capturePage(rect)
            const buffer = nativeImage.toPNG()
            const timestamp = dayjs().format("YYYY-MM-DD-HH-mm-ss")
            const filename = path.join(app.getPath("pictures"),
                `LiVE-Receiver-Screenshot-${timestamp}.png`)
            app.log.info(`saving screenshot ${rect.width}x${rect.height}@${rect.x}+${rect.y} to "${filename}"`)
            await fs.promises.writeFile(filename, buffer, { encoding: null })
        })

        /*  handle recording creation  */
        app.ipc.handle("recording", async (event) => {
            if (app.vs === null)
                return
            const timestamp = dayjs().subtract(20, "second").format("YYYY-MM-DD-HH-mm-ss")
            const filename = path.join(app.getPath("videos"),
                `LiVE-Receiver-Recording-${timestamp}.m4v`)
            app.log.info(`saving last video recording to "${filename}"`)
            await app.vs.record(filename)
        })

        /*  establish recording mechanism  */
        const { dataDir } = syspath({ appName: "LiVE-Receiver" })
        const basedir = path.join(dataDir, "recordings")
        await mkdirp(basedir, { mode: 0o755 })
        const recording = new Recording({
            basedir: basedir,
            log: (level, message) => { app.log[level](`recording: ${message}`) }
        })
        app.ipc.handle("recordings", async (event) => {
            return recording.recordings()
        })
        app.ipc.handle("recording-play", async (event, id) => {
            app.log.info(`begin playing recording "${id}"`)
            const url = recording.url(id)
            app.win.webContents.send("play-begin", { recording: id, url })
        })
        app.ipc.handle("recording-unplay", async (event) => {
            app.log.info("stop playing recording")
            app.win.webContents.send("play-end")
        })
        app.ipc.handle("recording-delete", async (event, id) => {
            app.log.info(`delete recording "${id}"`)
            await recording.delete(id)
            app.win.webContents.send("recordings-renew")
        })
        app.ipc.handle("recording-artifact", async (event, id, file, type) => {
            return recording.load(id, file, type)
        })
        app.ipc.handle("recording-info", async (event, id) => {
            return recording.info(id)
        })
        setInterval(async () => {
            await recording.prune(app.recordingHours)
            app.win.webContents.send("recordings-update")
        }, 1 * 60 * 60 * 1000)
        await recording.prune(app.recordingHours)
        app.win.webContents.send("recordings-renew")

        /*  the LiVE Relay VideoStream/EventStream communication establishment  */
        app.es = null
        app.vs = null
        const credentials = {
            client: app.clientId,
            agent:  `${pkg.name}/${pkg.version}`
        }
        const liveReachability = async () => {
            app.log.info("main: LiVE-Relay: checking reachability")

            /*  check reachability of LiVE Relay EventStream and VideoStream  */
            const es = new EventStream({ ...credentials })
            const vs = new VideoStream({ ...credentials })
            const result = await Promise.all([ es.reachable(), vs.reachable() ])
            if (result[0].error)
                return result[0]
            if (result[1].error)
                return result[1]
            return { success: true }
        }
        const liveAuth = async () => {
            app.log.info("main: LiVE-Relay: authenticate")

            /*  connect to LiVE Relay EventStream  */
            const es = new EventStream({
                ...credentials,
                log: (level, message) => { app.log[level](message) }
            })
            const result = await (es.preauth().then(() => ({ success: true })).catch((err) => {
                return { error: `Failed to authenticate at LiVE Relay service: ${err.message}` }
            }))
            if (result.error)
                return result
            return { success: true }
        }
        const liveConnect = async () => {
            if (app.connected) {
                app.log.error("main: LiVE-Relay: connect (ALREADY CONNECTED)")
                return { error: "invalid use -- already connected" }
            }
            app.log.info("main: LiVE-Relay: connect (begin)")

            /*  give UI some time to start stream processing  */
            app.win.webContents.send("stream-begin")
            await new Promise((resolve) => setTimeout(resolve, 1 * 1000))

            /*  connect to LiVE Relay EventStream  */
            const es = new EventStream({
                ...credentials,
                image:   app.personPortrait,
                name:    app.personName,
                privacy: app.personPrivacy,
                log:     (level, message) => { app.log[level](message) }
            })
            let result = await es.start().then(() => ({ success: true })).catch((err) => {
                return { error: `EventStream: MQTTS: start: ${err}` }
            })
            if (result.error)
                return result
            app.es = es

            /*  receive receiver control messages via LiVE-Relay EventStream  */
            app.es.on("message", async (scope, message) => {
                app.log.debug(`main: LiVE-Relay: message: scope=${scope} message=${JSON.stringify(message)}`)
                if (!(typeof message === "object"
                    && typeof message.id === "string" && message.id === "live-receiver"
                    && typeof message.event === "string" && message.event !== ""
                    && typeof message.data === "object")) {
                    app.log.error(`main: LiVE-Relay: message: invalid message: ${JSON.stringify(message)}`)
                    return
                }
                if (message.event === "reconnect") {
                    app.win.webContents.send("relogin", {
                        liveRelayServer:  app.liveRelayServer,
                        liveAccessToken:  app.liveAccessToken
                    })
                }
                else if (message.event === "disconnect") {
                    app.win.webContents.send("logout")
                }
                else if (message.event === "voting-begin")
                    app.win.webContents.send("voting-begin")
                else if (message.event === "voting-type")
                    app.win.webContents.send("voting-type", message.data)
                else if (message.event === "voting-end")
                    app.win.webContents.send("voting-end")
                else
                    app.log.error(`main: LiVE-Relay: message: invalid event: "${message.event}`)
            })

            /*  connect to LiVE Relay VideoStream  */
            const vs = new VideoStream({
                ...credentials,
                log: (level, message) => { app.log[level](message) }
            })
            let numLast = -1
            vs.on("segment", (num, id, user, buffer) => {
                if (!app.connected)
                    return
                app.log.debug(`main: LiVE-Relay: RTMPS segment #${num}: ${id} @ ${user.mimeCodec} ` +
                    `(${buffer.byteLength} bytes)`)
                if (num <= numLast)
                    app.win.webContents.send("stream-reset")
                numLast = num
                app.win.webContents.send("stream-data", { num, id, user, buffer })
            })
            vs.on("fragment", (fragment) => {
                if (app.recordingHours > 0)
                    recording.store(fragment)
            })
            vs.on("error", (err) => {
                if (!app.connected)
                    return
                app.log.error(`main: LiVE-Relay: RTMPS: ERROR: ${err}`)
                app.win.webContents.send("stream-end")
            })
            vs.on("fatal", (err) => {
                app.log.error(`main: LiVE-Relay: VideoStream: FATAL: ${err}`)
                app.win.webContents.send("fatal-error", err)
            })
            result = await vs.start().then(() => ({ success: true })).catch((err) => {
                return { error: `VideoStream: RTMPS: start: ${err}` }
            })
            if (result.error)
                return result
            app.vs = vs

            /*  indicate success  */
            app.connected = true
            app.log.info("main: LiVE-Relay: connect (end)")
            return { success: true }
        }
        const liveDisconnect = async () => {
            if (!app.connected) {
                app.log.error("main: LiVE-Relay: disconnect (STILL NOT CONNECTED)")
                return { error: "invalid use -- still not connected" }
            }
            app.log.info("main: LiVE Relay: disconnect (begin)")

            /*  disconnect from LiVE Relay EventStream  */
            let result
            if (app.es !== null) {
                result = await app.es.stop().then(() => ({ success: true })).catch((err) => {
                    return { error: `EventStream: MQTTS: stop: ${err}` }
                })
                if (result.error)
                    return result
                app.es = null
            }

            /*  disconnect from LiVE Relay VideoStream  */
            if (app.vs !== null) {
                result = await app.vs.stop().then(() => ({ success: true })).catch((err) => {
                    return { error: `VideoStream: RTMPS: stop: ${err}` }
                })
                if (result.error)
                    return result
                app.vs = null
            }

            /*  give UI some time to stop stream processing  */
            app.win.webContents.send("stream-end")
            await new Promise((resolve) => setTimeout(resolve, 1 * 1000))

            /*  prune to free space (just in case) and especially update UI for new recording  */
            await recording.prune(app.recordingHours)
            app.win.webContents.send("recordings-renew")

            /*  indicate success  */
            app.connected = false
            app.log.info("main: LiVE Relay: disconnect (end)")
            return { success: true }
        }
        app.ipc.handle("save-settings", async (event, {
            personPortrait, personName, personPrivacy, liveStreamBuffering,
            recordingHours, audioInputDevice, audioOutputDevice, language
        }) => {
            /*  take parameters  */
            app.personPortrait       = personPortrait
            app.personName           = personName
            app.personPrivacy        = personPrivacy
            app.liveStreamBuffering  = liveStreamBuffering
            app.recordingHours       = recordingHours
            app.audioInputDevice     = audioInputDevice
            app.audioOutputDevice    = audioOutputDevice
            app.language             = language
            settings.set("person-portrait",        app.personPortrait)
            settings.set("person-name",            app.personName)
            settings.set("person-privacy",         app.personPrivacy)
            settings.set("live-stream-buffering",  app.liveStreamBuffering)
            settings.set("recording-hours",        app.recordingHours)
            settings.set("audio-input-device",     app.audioInputDevice)
            settings.set("audio-output-device",    app.audioOutputDevice)
            settings.set("language",               app.language)

            /*  prune in case the recording hours were changed  */
            recording.prune(app.recordingHours)
            app.win.webContents.send("recordings-renew")
        })
        app.ipc.handle("login", async (event, {
            liveRelayServer, liveAccessToken
        }) => {
            /*  take login parameters  */
            app.liveRelayServer      = liveRelayServer
            app.liveAccessToken      = liveAccessToken
            settings.set("live-relay-server",      app.liveRelayServer)
            settings.set("live-access-token",      app.liveAccessToken)

            /*  parse access token  */
            const m = app.liveAccessToken.match(/^(.+?)-([^-]+)-([^-]+)$/)
            if (m === null)
                return { error: "invalid access token format" }
            const [ , channel, token1, token2 ] = m

            /*  update LiVE Relay communication credentials  */
            credentials.server     = app.liveRelayServer
            credentials.channel    = channel
            credentials.token1     = token1
            credentials.token2     = token2
            credentials.buffering  = app.liveStreamBuffering

            /*  establish communication  */
            let result = await liveReachability()
            if (result.error)
                return result
            result = await liveAuth()
            if (result.error)
                return result
            result = await liveConnect()
            if (result.error)
                return result
            return { success: true }
        })
        app.ipc.handle("logout", async (event) => {
            const result = await liveDisconnect()
            if (result.error)
                return result
            return { success: true }
        })

        /*  the LiVE Relay EventStream communication: messages  */
        app.ipc.handle("message", (event, message) => {
            if (app.es === null)
                return
            app.es.send({
                id:    "live-sender",
                event: "message",
                data: {
                    client:  app.clientId,
                    text:    message.text,
                    ...(message.audio ? { audio: message.audio } : {})
                }
            })
        })

        /*  the LiVE Relay EventStream communication: feedback  */
        app.ipc.handle("feedback", (event, type) => {
            if (app.es === null)
                return
            app.es.send({
                id:    "live-sender",
                event: "feedback",
                data: {
                    client: app.clientId,
                    type:   type
                }
            })
        })

        /*  the LiVE Relay EventStream communication: feeling  */
        app.ipc.handle("feeling", (event, feeling) => {
            if (app.es === null)
                return
            app.es.send({
                id:    "live-sender",
                event: "feeling",
                data: {
                    client:    app.clientId,
                    challenge: feeling.challenge,
                    mood:      feeling.mood
                }
            })
        })

        /*  handle update check request from UI  */
        app.ipc.handle("update-check", async () => {
            /*  check whether we are updateable at all  */
            const updateable = await app.update.updateable()
            app.win.webContents.send("update-updateable", updateable)

            /*  check for update versions  */
            const versions = await app.update.check(throttle(1000 / 60, (task, completed) => {
                app.win.webContents.send("update-progress", { task, completed })
            }))
            setTimeout(() => {
                app.win.webContents.send("update-progress", null)
            }, 2 * (1000 / 60))
            app.win.webContents.send("update-versions", versions)
        })

        /*  handle update request from UI  */
        app.ipc.handle("update-to-version", (event, version) => {
            app.update.update(version, throttle(1000 / 60, (task, completed) => {
                app.win.webContents.send("update-progress", { task, completed })
            })).catch((err) => {
                app.win.webContents.send("update-error", err)
                app.log.error(`update: ERROR: ${err}`)
            })
        })

        /*  cleanup from old update  */
        await app.update.cleanup()

        /*  handle stealth-mode  */
        app.ipc.handle("stealth-mode", (event, enabled) => {
            if (app.es !== null)
                app.es.stealth(enabled)
        })

        /*  provide helper functions for YAML loading  */
        app.ipc.handle("load-yaml", async (event, file) => {
            const filename = path.resolve(path.join(app.getAppPath(), file))
            const yaml = await fs.promises.readFile(filename, { encoding: "utf8" })
            const obj = jsYAML.load(yaml)
            return obj
        })
    })
})().catch((err) => {
    if (app.log)
        app.log.error(`main: ERROR: ${err}`)
    else
        console.log(`main: ERROR: ${err}`)
})

