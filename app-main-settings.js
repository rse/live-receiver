/*
**  Live Video Experience (LiVE)
**  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
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


