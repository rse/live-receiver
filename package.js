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

const os    = require("os")
const path  = require("path")
const glob  = require("glob")
const shell = require("shelljs")
const execa = require("execa")
const zip   = require("cross-zip")

;(async () => {
    console.log("++ cleanup")
    shell.rm("-rf", "dist")
    shell.rm("-rf", "LiVE-Receiver-win32-x64")
    shell.rm("-rf", "LiVE-Receiver-darwin-x64")
    shell.rm("-f", "LiVE-Receiver-win32-x64.zip")
    shell.rm("-f", "LiVE-Receiver-darwin-x64.zip")

    console.log("++ reducing source-tree")
    const remove = glob.sync("node_modules/typopro-web/web/TypoPRO-*")
        .filter((path) => !path.match(/\/TypoPRO-(SourceSansPro|DejaVu)$/))
    for (const file of remove)
        shell.rm("-rf", file)

    console.log("++ packaging App as an Electron distribution")
    const electronbuilder = path.resolve(path.join("node_modules", ".bin", "electron-builder"))
    if (os.platform() === "win32") {
        execa.sync(electronbuilder, [ "--dir" ],
            { stdin: "inherit", stdout: "inherit", stderr: "inherit" })
        console.log("++ packing App into ZIP archive")
        shell.mv("dist/win-unpacked", "dist/LiVE-Receiver")
        zip.zipSync(
            path.join(__dirname, "dist/LiVE-Receiver"),
            path.join(__dirname, "dist/LiVE-Receiver-win32-x64.zip")
        )
    }
    else if (os.platform() === "darwin") {
        execa.sync(electronbuilder, [ "--dir" ],
            { stdin: "inherit", stdout: "inherit", stderr: "inherit" })
        console.log("++ packing App into ZIP archive")
        shell.mv("dist/mac/LiVE-Receiver.app", "dist/LiVE-Receiver.app")
        zip.zipSync(
            path.join(__dirname, "dist/LiVE-Receiver.app"),
            path.join(__dirname, "dist/LiVE-Receiver-darwin-x64.zip")
        )
    }
})().catch((err) => {
    console.log(`** ERROR: ${err}`)
})

