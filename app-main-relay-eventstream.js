/*
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only-only>
*/

/*  standard requirements  */
const EventEmitter  = require("events")

/*  external requirements  */
const MQTTjs        = require("mqtt")
const UUID          = require("pure-uuid")

/*  internal requirements  */
const { reachable } = require("./app-main-relay-util.js")
const pkg           = require("./package.json")

/*  the exported API class  */
module.exports = class EventStream extends EventEmitter {
    constructor (options = {}) {
        super()
        const id = (new UUID(1)).format("std")
        const ua = `${pkg.name}/${pkg.version}`
        this.options = Object.assign({}, {
            client:   id,
            agent:    ua,
            name:     "",
            privacy:  "",
            image:    "",
            server:   "",
            channel:  "",
            token1:   "",
            token2:   "",
            interval: 10 * 60 * 1000,
            log:      (level, msg) => {}
        }, options)
        this.broker    = null
        this.timer     = null
        this.inStealth = false
        this.url       = `mqtts://${this.options.token1}:${this.options.token2}@${this.options.server}`
    }

    /*  check reachability  */
    async reachable () {
        return reachable(this.options.server, 8883, 4 * 1000)
    }

    /*  pre-authenticate at the LiVE relay service
        (to detect initial connection problems and without having
        to provide "last will", avoiding any auto-reconnects, etc)  */
    async preauth () {
        return new Promise((resolve, reject) => {
            const broker = MQTTjs.connect(this.url, {
                clientId:           this.options.client,
                rejectUnauthorized: false,
                reconnectPeriod:    0,
                connectTimeout:     20 * 1000,
                resubscribe:        false
            })
            broker.on("connect", () => {
                broker.end()
                resolve()
            })
            broker.on("error", (err) => {
                this.options.log("error", `eventstream: MQTT: connect: ${err}`)
                if (err.code === "ENOTFOUND")
                    err = new Error(`FQDN of host "${err.hostname}" not found in DNS`)
                else if (err.code === "ECONNREFUSED")
                    err = new Error(`MQTTS connection refused at IP address ${err.address} and TCP port ${err.port}`)
                broker.end()
                reject(err)
            })
        })
    }

    /*  start connecting to the LiVE Relay service  */
    async start () {
        let firstConnect = true
        return new Promise((resolve, reject) => {
            const broker = MQTTjs.connect(this.url, {
                clientId:           this.options.client,
                rejectUnauthorized: false,
                reconnectPeriod:    1000,
                connectTimeout:     20 * 1000,
                resubscribe:        false,
                will: {
                    /*  end attendance (implicitly)  */
                    qos: 2,
                    topic: `stream/${this.options.channel}/sender`,
                    payload: JSON.stringify({
                        id:    "live-sender",
                        event: "attendance",
                        data: {
                            client: this.options.client,
                            agent:  this.options.agent,
                            event:  "end"
                        }
                    })
                }
            })
            broker.on("error", (err) => {
                this.options.log("error", `eventstream: MQTT: ${err}`)
                if (firstConnect)
                    reject(err)
                else
                    this.emit("error", err)
            })
            broker.on("connect", () => {
                /*  on connect and re-connect initialize our session  */
                this.options.log("info", "eventstream: MQTT: connect")

                /*  (re)subscribe to the general attendee/receiver channel  */
                broker.subscribe(`stream/${this.options.channel}/receiver`, (err) => {
                    if (err) {
                        if (firstConnect)
                            reject(err)
                        else {
                            this.options.log("error", `eventstream: MQTT: subscribe: ${err}`)
                            this.emit("error", `subscribe: ${err}`)
                        }
                    }
                })

                /*  (re)subscribe to the individual attendee/receiver channel  */
                broker.subscribe(`stream/${this.options.channel}/receiver/${this.options.client}`, (err) => {
                    if (err) {
                        if (firstConnect)
                            reject(err)
                        else {
                            this.options.log("error", `eventstream: MQTT: subscribe: ${err}`)
                            this.emit("error", `subscribe: ${err}`)
                        }
                    }
                })

                /*  track certain MQTT broker events  */
                if (firstConnect) {
                    broker.on("reconnect", () => {
                        this.options.log("info", "eventstream: MQTT: reconnect")
                        this.emit("reconnect")
                    })
                    broker.on("close", () => {
                        this.options.log("info", "eventstream: MQTT: close")
                        this.emit("disconnect", "close")
                    })
                    broker.on("disconnect", () => {
                        this.options.log("info", "eventstream: MQTT: disconnect")
                        this.emit("disconnect", "disconnect")
                    })
                    broker.on("message", (topic, message) => {
                        this.options.log("debug", `eventstream: MQTT: message: topic=${topic}`)
                        let scope
                        if (topic === `stream/${this.options.channel}/receiver/${this.options.client}`)
                            scope = "unicast"
                        else if (topic === `stream/${this.options.channel}/receiver`)
                            scope = "broadcast"
                        else {
                            this.options.log("error", "eventstream: MQTT: message: invalid topic")
                            this.emit("error", "message: invalid topic")
                            return
                        }
                        try {
                            message = JSON.parse(message.toString())
                        }
                        catch (err) {
                            this.options.log("error", `eventstream: MQTT: message: failed to parse JSON: ${err}`)
                            this.emit("error", `message: failed to parse JSON: ${err}`)
                            return
                        }
                        this.emit("message", scope, message)
                    })
                }

                /*  provide broker to other methods  */
                if (firstConnect)
                    this.broker = broker

                /*  begin attendance (initially)  */
                this.attendance("begin")

                /*  refresh attendance (regularly)  */
                if (firstConnect) {
                    this.timer = setInterval(() => {
                        this.attendance("refresh")
                    }, this.options.interval)
                }

                /*  indicate initial success  */
                if (firstConnect) {
                    firstConnect = false
                    resolve()
                }
            })
        })
    }

    /*  stop communication  */
    async stop () {
        if (this.timer !== null) {
            clearTimeout(this.timer)
            this.timer = null
        }
        if (this.broker !== null) {
            this.attendance("end")
            this.broker.end()
            this.broker = null
        }
    }

    /*  send a message to the LiVE Sender side  */
    async send (message) {
        if (this.broker === null)
            throw new Error("not connected")
        return new Promise((resolve, reject) => {
            message = JSON.stringify(message)
            this.emit("sent", message)
            this.broker.publish(`stream/${this.options.channel}/sender`, message, { qos: 2 }, (err) => {
                if (err) {
                    this.options.log("error", `eventstream: MQTT: publish: ${err}`)
                    this.emit("send:error", err)
                    reject(err)
                }
                else {
                    this.emit("send:success", message)
                    resolve()
                }
            })
        })
    }

    /*  send attendance information  */
    async attendance (event, force = false) {
        if (this.broker !== null && this.broker.connected && (!this.inStealth || force)) {
            this.options.log("info", `eventstream: attendance: send "${event}" event`)
            const data = {
                client: this.options.client,
                agent:  this.options.agent,
                event:  event
            }
            if (event === "begin") {
                /*  send extra data only on begin  */
                data.data = {
                    name:    this.options.name,
                    image:   this.options.image,
                    privacy: this.options.privacy
                }
            }
            this.send({
                id:    "live-sender",
                event: "attendance",
                data:  data
            }).catch((err) => void (err))
        }
    }

    /*  toggle stealth mode  */
    async stealth (enabled) {
        this.inStealth = enabled
        if (this.inStealth)
            this.attendance("end", true)
        else
            this.attendance("begin", true)
    }
}

