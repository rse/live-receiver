
const os    = require("os")
const path  = require("path")
const glob  = require("glob")
const shell = require("shelljs")
const execa = require("execa")
const zip   = require("cross-zip")

;(async () => {
    const electronpackager = path.resolve(path.join("node_modules", ".bin", "electron-packager"))

    console.log("++ cleanup")
    shell.rm("-rf", "LiVE-Receiver-win32-x64")
    shell.rm("-rf", "LiVE-Receiver-darwin-x64")

    console.log("++ packaging App as an Electron distribution")
    let ignore = glob.sync("node_modules/typopro-web/web/TypoPRO-*")
        .filter((path) => !path.match(/\/TypoPRO-(SourceSansPro|DejaVu)$/))
    ignore.push("node_modules/electron-prebuilt")
    ignore.push("node_modules/electron-packager")
    ignore = ignore.concat(glob.sync("*.ai"))
    if (os.platform() === "windows") {
        ignore.push("ffmpeg/ffmpeg-mac-x64")
        ignore.push("ffmpeg/ffmpeg-mac-x64.sh")
        execa.sync(electronpackager, [
            ".",
            "LiVE-Receiver",
            "--platform=win32",
            "--arch=ia32,x64",
            "--ignore", "(?:" + ignore.join("|") + ")",
            "--overwrite"
        ])
        zip.zipSync("LiVE-Receiver-win32-x64/LiVE-Receiver.exe", "LiVE-Receiver-win32-x64.zip")
    }
    else if (os.platform() === "darwin") {
        ignore.push("ffmpeg/ffmpeg-win-x64.exe")
        execa.sync(electronpackager, [
            ".",
            "LiVE-Receiver",
            "--platform=darwin",
            "--arch=x64",
            "--ignore", "(?:" + ignore.join("|") + ")",
            "--overwrite"
        ])
        shell.rm("-f", "LiVE-Receiver-darwin-x64/LICENSE*")
        shell.rm("-f", "LiVE-Receiver-darwin-x64/version")
        zip.zipSync(
            "LiVE-Receiver-darwin-x64/LiVE-Receiver.app",
            path.join(__dirname, "LiVE-Receiver-darwin-x64.zip")
        )
    }
})().catch((err) => {
    console.log(`** ERROR: ${err}`)
})

