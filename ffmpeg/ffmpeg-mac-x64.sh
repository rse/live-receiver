#!/bin/sh
exe=`echo "$0" | sed -e 's;\.sh$;;'`
xattr -dr com.apple.quarantine "$exe"
exec "$exe" ${1+"$@"}
