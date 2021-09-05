##
##  Live Video Experience (LiVE)
##  Copyright (c) 2020-2021 Dr. Ralf S. Engelschall <rse@engelschall.com>
##  Licensed under GPL 3.0 <https://spdx.org/licenses/GPL-3.0-only>
##

SHELL = bash

PACKAGE = \
	npx --yes shx rm -rf dist node_modules && \
	npm install && \
	npm run package

all:

package-win:
	/c/Windows/System32/cmd.exe /c "$(PACKAGE)"
package-mac:
	$(PACKAGE)
package-lnx:
	$(PACKAGE)

