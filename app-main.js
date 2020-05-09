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
const electron     = require("electron")
const electronLog  = require("electron-log")
const os           = require("os")
const path         = require("path")
const EventEmitter = require("eventemitter2")
const imageDataURI = require("image-data-uri")
const throttle     = require("throttle-debounce").throttle
const UUID         = require("pure-uuid")

/*  internal requirements  */
const Settings     = require("./app-main-settings")
const VideoStream  = require("./app-main-relay-videostream")
const EventStream  = require("./app-main-relay-eventstream")

/*  enter an asynchronous environment in main process  */
const app = electron.app
;(async () => {
    /*   establish Electron application  */
    app.allowRendererProcessReuse = true

    /*  initialize global information  */
    app.win       = null
    app.connected = false

    /*  provide APIs for communication  */
    app.ipc   = electron.ipcMain
    app.event = new EventEmitter({ wildcard: true })

    /*  provide logging facility  */
    app.log = electronLog
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

    /*  start startup procedure once Electron is ready  */
    app.on("ready", async () => {
        /*  establish settings and their default values  */
        const clientId = (new UUID(1)).format("std")
        const settings = new Settings({ appId: "LiVE-Receiver", flushAfter: 1 * 1000 })
        settings.load()
        app.clientId             = settings.get("client-id",              clientId)
        app.x                    = settings.get("window-x",               100)
        app.y                    = settings.get("window-y",               100)
        app.w                    = settings.get("window-width",           1280 + 40)
        app.h                    = settings.get("window-height",          720  + 40)
        app.personPortrait       = settings.get("person-portrait",        "")
        app.personName           = settings.get("person-name",            "")
        app.liveRelayServer      = settings.get("live-relay-server",      "")
        app.liveAccessToken      = settings.get("live-access-token",      "")
        app.liveStreamBuffering  = settings.get("live-stream-buffering",  2000)
        app.audioInputDevice     = settings.get("audio-input-device",     "")
        app.audioOutputDevice    = settings.get("audio-output-device",    "")

        /*  save back the settings once at startup  */
        settings.set("client-id",              app.clientId)
        settings.set("window-x",               app.x)
        settings.set("window-y",               app.y)
        settings.set("window-width",           app.w)
        settings.set("window-height",          app.h)
        settings.set("person-portrait",        app.personPortrait)
        settings.set("person-name",            app.personName)
        settings.set("live-relay-server",      app.liveRelayServer)
        settings.set("live-access-token",      app.liveAccessToken)
        settings.set("live-stream-buffering",  app.liveStreamBuffering)
        settings.set("audio-input-device",     app.audioInputDevice)
        settings.set("audio-output-device",    app.audioOutputDevice)
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

        /*  redirect exception error boxes to the console  */
        electron.dialog.showErrorBox = (title, content) => {
            app.log.info(`main: UI: exception: ${title}: ${content}`)
        }

        /*  create application window  */
        app.win = new electron.BrowserWindow({
            useContentSize: true,
            frame:          false,
            transparent:    false,
            show:           false,
            x:              app.x,
            y:              app.y,
            width:          app.w,
            height:         app.h,
            minWidth:       1000,
            minHeight:      650,
            resizable:      true,
            webPreferences: {
                nodeIntegration:    true,
                enableRemoteModule: true,
                autoplayPolicy:     "no-user-gesture-required"
            }
        })
        app.win.setHasShadow(true)
        app.win.loadURL(`file://${__dirname}/app-ui.html`)
        if (process.env.DEBUG) {
            require("vue-devtools").install()
            app.win.webContents.openDevTools()
        }
        app.win.on("ready-to-show", () => {
            app.win.show()
            app.win.focus()
        })

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
        })
        app.win.on("unmaximize", () => {
            maximized = false
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
        })
        app.win.on("leave-full-screen", () => {
            fullscreened = false
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
            updateBounds()
        }))
        app.win.on("move",   throttle(1000, () => {
            updateBounds()
        }))

        /*  handle window resizing functionality  */
        app.ipc.handle("resize", (event, diff) => {
            app.w += diff.x
            app.h += diff.y
            app.win.setSize(app.w, app.h)
        })
        app.ipc.handle("set-size", (event, size) => {
            maximized   = false
            minimized   = false
            fullscreend = false
            app.w = size.w
            app.h = size.h
            app.win.setSize(app.w, app.h)
        })

        /*  the LiVE Relay VideoStream/EventStream communication establishment  */
        app.es = null
        app.vs = null
        const credentials = {
            client: app.clientId
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
                log: (level, message) => { app.log[level](message) }
            })
            let result = await es.start().then(() => ({ success: true })).catch((err) => {
                return { error: `EventStream: MQTTS: start: ${err}` }
            })
            if (result.error)
                return result
            app.es = es

            /*  connect to LiVE Relay VideoStream  */
            const vs = new VideoStream({
                ...credentials,
                log: (level, message) => { app.log[level](message) }
            })
            vs.on("segment", (num, id, user, buffer) => {
                if (!app.connected)
                    return
                // app.log.debug(`main: LiVE-Relay: RTMPS segment #${num}: ${id} @ ${user.mimeCodec} ` +
                //     `(${buffer.byteLength} bytes)`)
                app.win.webContents.send("stream-data", { id, user, buffer })
            })
            vs.on("error", (err) => {
                if (!app.connected)
                    return
                app.log.error(`main: LiVE-Relay: RTMPS: ERROR: ${err}`)
                app.win.webContents.send("stream-end")
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

            /*  indicate success  */
            app.connected = false
            app.log.info("main: LiVE Relay: disconnect (end)")
            return { success: true }
        }
        app.ipc.handle("save-settings", async (event, {
            personPortrait, personName, liveStreamBuffering,
            audioInputDevice, audioOutputDevice
        }) => {
            /*  take login parameters  */
            app.personPortrait       = personPortrait
            app.personName           = personName
            app.liveStreamBuffering  = liveStreamBuffering
            app.audioInputDevice     = audioInputDevice
            app.audioOutputDevice    = audioOutputDevice
            settings.set("person-portrait",        app.personPortrait)
            settings.set("person-name",            app.personName)
            settings.set("live-stream-buffering",  app.liveStreamBuffering)
            settings.set("audio-input-device",     app.audioInputDevice)
            settings.set("audio-output-device",    app.audioOutputDevice)
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
            let result = await liveAuth()
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
            if (app.es !== null) {
                app.es.send(JSON.stringify({
                    id:    "training",
                    event: "chat",
                    data: {
                        title:   app.personName,
                        image:   app.personPortrait,
                        message: message.message,
                        ...(message.audio ? { audio: message.audio } : {})
                    }
                }))
            }
        })

        /*  the LiVE Relay EventStream communication: feedback  */
        app.ipc.handle("feedback", (event, type) => {
            if (app.es !== null) {
                app.es.send(JSON.stringify({
                    id:    "training",
                    event: "feedback",
                    data: {
                        client: app.clientId,
                        type:   type
                    }
                }))
            }
        })

        /*  the LiVE Relay EventStream communication: feeling  */
        app.ipc.handle("feeling", (event, feeling) => {
            if (app.es !== null) {
                app.es.send(JSON.stringify({
                    id:    "training",
                    event: "feeling",
                    data: {
                        client:    app.clientId,
                        challenge: feeling.challenge,
                        mood:      feeling.mood
                    }
                }))
            }
        })
    })
})().catch((err) => {
    if (app.log)
        app.log.error(`main: ERROR: ${err}`)
    else
        console.log(`main: ERROR: ${err}`)
})
