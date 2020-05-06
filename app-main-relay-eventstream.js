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
const MQTTjs       = require("mqtt")
const RPC          = require("mqtt-json-rpc")
const EventEmitter = require("eventemitter2")
const UUID         = require("pure-uuid")

/*  the exported API class  */
module.exports = class EventStream extends EventEmitter {
    constructor (options = {}) {
        super()
        const id = (new UUID(1)).format("std")
        this.options = Object.assign({}, {
            client:   id,
            server:   "",
            channel: " ",
            token1:   "",
            token2:   "",
            interval: 30 * 1000
        }, options)
        this.broker = null
        this.timer  = null
        this.url    = `mqtts://${this.options.token1}:${this.options.token2}@${this.options.server}`
    }

    /*  pre-authenticate at the LiVE relay service
        (to detect initial connection problems and without having
        to provide "last will", avoiding any auto-reconnects, etc)  */
    async preauth () {
        return new Promise((resolve, reject) => {
            const broker = MQTTjs.connect(this.url, {
                clientId:           this.options.client,
                rejectUnauthorized: true,
                reconnectPeriod:    0,
                connectTimeout:     20 * 1000,
                resubscribe:        false
            })
            broker.on("connect", () => {
                broker.end()
                resolve()
            })
            broker.on("error", (err) => {
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
                rejectUnauthorized: true,
                reconnectPeriod:    1000,
                connectTimeout:     20 * 1000,
                resubscribe:        false,
                will: {
                    /*  end attendance (implicitly)  */
                    qos: 2,
                    topic: `stream/${this.options.channel}/sender`,
                    payload: JSON.stringify({
                        id:    "training",
                        event: "attendance",
                        data: {
                            client: this.options.client,
                            event:  "end"
                        }
                    })
                }
            })
            broker.on("error", (err) => {
                console.log("++ MQTT: error", err)
                if (firstConnect)
                    reject(err)
                else
                    this.emit("error", err)
            })
            broker.on("connect", () => {
                /*  on connect and re-connect initialize our session  */
                console.log("++ MQTT: connect")

                /*  (re)subscribe to the attendee-specific channel  */
                broker.subscribe(`stream/${this.options.channel}/receiver/${this.options.client}`, (err) => {
                    if (err) {
                        if (firstConnect)
                            reject(err)
                        else
                            this.emit("error", `subscribe: ${err}`)
                    }
                })

                /*  track certain MQTT broker events  */
                if (firstConnect) {
                    broker.on("reconnect", () => {
                        console.log("++ MQTT: reconnect")
                        this.emit("reconnect")
                    })
                    broker.on("close", () => {
                        console.log("++ MQTT: close")
                        this.emit("disconnect", "close")
                    })
                    broker.on("disconnect", () => {
                        console.log("++ MQTT: disconnect")
                        this.emit("disconnect", "disconnect")
                    })
                    broker.on("message", (topic, message) => {
                        console.log("++ MQTT: message", message)
                        this.emit("message", topic, message)
                    })
                }

                /*  provide broker to other methods  */
                if (firstConnect)
                    this.broker = broker

                /*  support RPC-style communication (FIXME: still unused)  */
                if (firstConnect)
                    this.rpc = new RPC(broker)

                /*  begin attendance (initially)  */
                this.send(JSON.stringify({
                    id:    "training",
                    event: "attendance",
                    data: {
                        client: this.options.client,
                        event:  "begin"
                    }
                }))

                /*  refresh attendance (regularly)  */
                if (firstConnect) {
                    this.timer = setInterval(() => {
                        if (this.broker.connected) {
                            this.send(JSON.stringify({
                                id:    "training",
                                event: "attendance",
                                data: {
                                    client: this.options.client,
                                    event:  "refresh"
                                }
                            }))
                        }
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
            /*  end attendance (explicitly)  */
            this.send(JSON.stringify({
                id:    "training",
                event: "attendance",
                data: {
                    client: this.options.client,
                    event:  "end"
                }
            }))
            this.broker.end()
        }
    }

    /*  send a message to the LiVE Sender side  */
    send (message) {
        if (this.broker === null)
            throw new Error("not connected")
        this.emit("sent", message)
        this.broker.publish(`stream/${this.options.channel}/sender`, message, { qos: 2 }, (err) => {
            if (err)
                this.emit("send:error", err)
            else
                this.emit("send:success", message)
        })
    }

    /*  support RPC-style communication (FIXME: still unused)  */
    register (method, callback) {
        return this.rpc.register(method, callback)
    }
    call (method, ...params) {
        return this.rpc.call(method, ...params)
    }
}
