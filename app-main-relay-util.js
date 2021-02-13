/*
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only-only>
*/

/*  standard requirements  */
const dns = require("dns")
const net = require("net")

/*  the exported API  */
module.exports = {
    /*  check for network reachability of a service  */
    async reachable (host, port, timeout = 1000) {
        /*  check DNS lookup  */
        let result = await new Promise((resolve) => {
            dns.lookup(host, (err) => {
                if (err)
                    resolve({ error: `DNS lookup error: unknown host "${host}" -- Hint: typo in name?` })
                else
                    resolve({ success: true })
            })
        })
        if (result.error)
            return result

        /*  check TCP/IP connectivity  */
        result = await new Promise((resolve) => {
            const socket = new net.Socket()
            socket.once("error", (err) => {
                socket.destroy()
                resolve({ error: `TCP/IP connection error: failed to reach "${host}:${port}" (${err}) ` +
                    "-- Hint: network firewall, VPN or TLS-breaking proxy?" })
            })
            socket.once("timeout", (err) => {
                socket.destroy()
                resolve({ error: `TCP/IP connection timeout: failed to reach "${host}:${port}" (${err}) ` +
                    "-- Hint: network firewall or VPN?" })
            })
            socket.setTimeout(timeout)
            socket.connect(port, host, () => {
                socket.end()
                resolve({ success: true })
            })
        })
        return result
    }
}

