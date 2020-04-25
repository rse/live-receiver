/*
**  Live -- Live Video-Streaming Frontend
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
const path         = require("path")
const EventEmitter = require("eventemitter2")
const imageDataURI = require("image-data-uri")
const fullname     = require("fullname")
const throttle     = require("throttle-debounce").throttle
const UUID         = require("pure-uuid")

/*  internal requirements  */
const Settings     = require("./app-settings")
const VideoStream  = require("./app-relay-videostream")
const EventStream  = require("./app-relay-eventstream")

/*  enter an asynchronous environment in main process  */
;(async () => {
    /*   establish Electron application  */
    const app = electron.app
    app.allowRendererProcessReuse = true
    app.on("ready", async () => {
        /*  establish settings and their default values  */
        const personName = await fullname()
        const clientId   = (new UUID(1)).format("std")
        const settings = new Settings({ appId: "LiVE-Receiver", flushAfter: 1 * 1000 })
        settings.load()
        app.clientId            = settings.get("client-id",             clientId)
        app.x                   = settings.get("window-x",              100)
        app.y                   = settings.get("window-y",              100)
        app.w                   = settings.get("window-width",          1280 + 40)
        app.h                   = settings.get("window-height",         720  + 40)
        app.personPortrait      = settings.get("person-portrait",       "")
        app.personName          = settings.get("person-name",           personName)
        app.liveRelayServer     = settings.get("live-relay-server",     "")
        app.liveAccessToken     = settings.get("live-access-token",     "")
        app.liveVideoResolution = settings.get("live-video-resolution", "1080p")
        app.liveStreamBuffering = settings.get("live-stream-buffering", 2000)

        /*  initialize global information  */
        app.win       = null
        app.connected = false

        /*  provide APIs for renderer process  */
        app.ipc   = electron.ipcMain
        app.event = new EventEmitter({ wildcard: true })

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

        /*  create application window  */
        app.win = new electron.BrowserWindow({
            useContentSize: true,
            frame:          false,
            transparent:    true,
            show:           false,
            x:              app.x,
            y:              app.y,
            width:          app.w,
            height:         app.h,
            minWidth:       900,
            minHeight:      600,
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

        /*  react on implicit window close  */
        app.win.on("closed", () => {
            app.win = null
        })

        /*  react on explicit window close  */
        app.ipc.handle("quit", (event) => {
            app.quit()
        })

        /*  react on all windows closed  */
        app.on("window-all-closed", () => {
            settings.save()
            app.quit()
        })

        /*  track application window changes  */
        const updateBounds = () => {
            const bounds = app.win.getBounds()
            app.x      = bounds.x
            app.y      = bounds.y
            app.width  = bounds.width
            app.height = bounds.height
            settings.set("window-x",      app.x)
            settings.set("window-y",      app.y)
            settings.set("window-width",  app.width)
            settings.set("window-height", app.height)
        }
        app.win.on("resize", throttle(1000, updateBounds))
        app.win.on("move",   throttle(1000, updateBounds))

        /*  allow UI command events to control application window  */
        app.ipc.handle("minimize", (event) => {
            if (app.win.isMinimized())
                app.win.restore()
            else
                app.win.minimize()
        })
        app.ipc.handle("maximize", (event) => {
            if (app.win.isMaximized())
                app.win.unmaximize()
            else
                app.win.maximize()
        })
        app.ipc.handle("fullscreen", (event) => {
            app.win.setFullScreen(!app.win.isFullScreen())
        })
        app.ipc.handle("resize", (event, diff) => {
            app.w += diff.x
            app.h += diff.y
            app.win.setSize(app.w, app.h)
        })
        app.ipc.handle("set-size", (event, size) => {
            app.w = size.w
            app.h = size.h
            app.win.setSize(app.w, app.h)
        })

        /*  the LiVE Relay VideoStream/EventStream communication establishment  */
        app.es = null
        app.vs = null
        const credentials = {
            client:     app.clientId,
            server:     app.liveRelayServer,
            resolution: app.liveVideoResolution,
            buffering:  app.liveStreamBuffering
        }
        const liveAuth = async () => {
            console.log("++ LiVE Relay: authenticate")

            /*  connect to LiVE Relay EventStream  */
            const es = new EventStream(credentials)
            let result = await es.start().then(() => ({ success: true })).catch((err) => {
                return { error: `Failed to authenticate at LiVE Relay service: ${err}` }
            })
            if (result.error)
                return result
            result = await es.stop().then(() => ({ success: true })).catch((err) => {
                return { error: `EventStream: MQTTS: stop: ${err}` }
            })
            if (result.error)
                return result
            return { success: true }
        }
        const liveConnect = async () => {
            console.log("++ LiVE Relay: connect")

            /*  connect to LiVE Relay EventStream  */
            const es = new EventStream(credentials)
            let result = await es.start().then(() => ({ success: true })).catch((err) => {
                return { error: `EventStream: MQTTS: start: ${err}` }
            })
            if (result.error)
                return result
            app.es = es

            /*  connect to LiVE Relay VideoStream  */
            const vs = new VideoStream(credentials)
            vs.on("segment", (num, id, user, buffer) => {
                if (!app.connected)
                    return
                // console.log(`-- LiVE Relay: RTMPS segment #${num}: ${id} @ ${user.mimeCodec} (${buffer.byteLength} bytes)`)
                app.win.webContents.send("stream-data", { id, user, buffer })
            })
            vs.on("error", (err) => {
                if (!app.connected)
                    return
                console.log(`** LiVE Relay: RTMPS error: ${err}`)
                app.win.webContents.send("stream-end")
            })
            app.win.webContents.send("stream-begin")
            result = await vs.start().then(() => ({ success: true })).catch((err) => {
                return { error: `VideoStream: RTMPS: start: ${err}` }
            })
            if (result.error)
                return result
            app.vs = vs

            /*  indicate success  */
            app.connected = true
            return { success: true }
        }
        const liveDisconnect = async () => {
            console.log("++ LiVE Relay: disconnect")
            app.connected = false

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
                app.win.webContents.send("stream-end")
                app.vs = null
            }

            /*  indicate success  */
            return { success: true }
        }
        app.ipc.handle("login", async (event, { personPortrait, personName, liveRelayServer, liveAccessToken }) => {
            /*  take login parameters  */
            app.personPortrait  = personPortrait
            app.personName      = personName
            app.liveRelayServer = liveRelayServer
            app.liveAccessToken = liveAccessToken
            settings.set("person-portrait",   app.personPortrait)
            settings.set("person-name",       app.personName)
            settings.set("live-relay-server", app.liveRelayServer)
            settings.set("live-access-token", app.liveAccessToken)

            /*  parse access token  */
            const m = app.liveAccessToken.match(/^(.+?)-([^-]+)-([^-]+)$/)
            if (m === null)
                return { error: "invalid access token format" }
            const [ , channel, token1, token2 ] = m

            /*  update LiVE Relay communication credentials  */
            credentials.channel = channel
            credentials.token1  = token1
            credentials.token2  = token2

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

        /*  the LiVE Relay VideoStream related communication  */
        app.ipc.handle("video-resolution", async (event, resolution) => {
            /*  change resolution information  */
            app.liveVideoResolution = resolution
            settings.set("live-video-resolution", app.liveVideoResolution)
            credentials.resolution = app.liveVideoResolution

            /*  re-connect again  */
            let result = await liveDisconnect()
            if (result.error)
                return result
            result = await liveConnect()
            if (result.error)
                return result
            return { success: true }
        })
        app.ipc.handle("stream-buffering", async (event, buffering) => {
            /*  change buffering information  */
            app.liveStreamBuffering = buffering
            settings.set("live-stream-buffering", app.liveStreamBuffering)
            credentials.buffering = app.liveStreamBuffering

            /*  re-connect again  */
            let result = await liveDisconnect()
            if (result.error)
                return result
            result = await liveConnect()
            if (result.error)
                return result
            return { success: true }
        })

        /*  the LiVE Relay EventStream related communication  */
        app.ipc.handle("message", async (event, message) => {
            if (app.es !== null) {
                app.es.send(JSON.stringify({
                    id:    "training",
                    event: "chat",
                    data: {
                        title: app.personName,
                        image: app.personPortrait,
                        message
                    }
                }))
            }
        })
    })
})().catch((err) => {
    console.log(`** LiVE-Receiver: ERROR: ${err}`)
})
