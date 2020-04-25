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
            client:  id,
            server:  "",
            channel: "",
            token1:  "",
            token2:  "",
            timeout: 20 * 1000 // FIXME: still unused
        }, options)
        this.broker = null
    }
    async start () {
        const url = `mqtts://${this.options.token1}:${this.options.token2}@${this.options.server}`
        return new Promise((resolve, reject) => {
            this.broker = MQTTjs.connect(url, {
                clientId: `${this.options.client}`,
                rejectUnauthorized: false
            })
            this.broker.on("connect", () => {
                this.broker.subscribe(`stream/${this.options.channel}/receiver/${this.options.client}`, (err) => {
                    if (err)
                        reject(err)
                    else
                        resolve()
                })
            })
            this.broker.on("message", (topic, message) => {
                this.emit("message", topic, message)
            })
            this.broker.on("error", (err) => {
                reject(err)
            })
            this.rpc = new RPC(this.broker)
        })
    }
    async stop () {
        if (this.broker !== null)
            this.broker.end()
    }
    send (message) {
        if (this.broker === null)
            throw new Error("not connected")
        this.broker.publish(`stream/${this.options.channel}/sender`, message)
    }
    register (method, callback) {
        return this.rpc.register(method, callback)
    }
    call (method, ...params) {
        return this.rpc.call(method, ...params)
    }
}
