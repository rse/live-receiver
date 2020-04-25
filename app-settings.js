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
const path     = require("path")
const fs       = require("fs")
const syspath  = require("syspath")
const jsonfile = require("jsonfile")

/*  internal requirements  */
const pjson    = require("./package.json")

/*  export the API  */
module.exports = class Settings {
    constructor (options = {}) {
        this.options = Object.assign({
            appId:      pjson.name,
            flushAfter: 1 * 1000
        }, options)

        /*  determine name of configuration file  */
        const { dataDir } = syspath({ appName: this.options.appId })
        this.cfgfile = path.join(dataDir, "settings.json")

        /*  initialize data  */
        this.data = {}
        this.load()

        /*  initialize save timer  */
        this.timer = null
    }

    /*  load settings from external store  */
    load () {
        if (fs.existsSync(this.cfgfile))
            this.data = jsonfile.readFileSync(this.cfgfile)
        return this
    }

    /*  save settings to external store  */
    save () {
        jsonfile.writeFileSync(this.cfgfile, this.data, { spaces: 4 })
        return this
    }
    _save () {
        if (this.timer !== null)
            clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            this.save()
            this.timer = null
        }, this.options.flushAfter)
    }

    /*  get settings key  */
    get (key, def) {
        let val = this.data[key]
        if (val === undefined)
            val = def
        return val
    }

    /*  set settings key  */
    set (key, val) {
        this.data[key] = val
        this._save()
        return this
    }

    /*  delete settings key  */
    del (key) {
        delete this.data[key]
        this._save()
        return this
    }
}


