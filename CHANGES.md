
Changes
=======

- 1.10.0
    - UPDATE: upgrade to Electron 12.0.2
    - UPDATE: upgrade to FFmpeg 4.3.2
    - UPDATE: upgrade minor dependencies

- 1.9.4
    - UPDATE: upgrade to Electron 11.2.3
    - UPDATE: upgrade minor dependencies

- 1.9.3
    - IMPROVEMENT: explicitly check LiVE Relay reachability before trying to connect with FFmpeg
    - IMPROVEMENT: add internationalization (I18N) facility
    - IMPROVEMENT: add German and English language to all UI elements
    - IMPROVEMENT: check that TLS connections work despite ZScaler and other intermediate proxies
    - UPDATE: upgrade to Electron 11.1.1
    - UPDATE: upgrade minor dependencies

- 1.9.2
    - IMPROVEMENT: use a pointer cursor on all remaining clickable areas
    - IMPROVEMENT: disable recording/snapshot buttons unless content was really received
    - IMPROVEMENT: improve icons on settings dialog
    - IMPROVEMENT: improve coloring of progress bar on update dialog
    - UPDATE: upgrade to Electron 11.1.0 and LESS-CSS 3.13.0

- 1.9.1
    - IMPROVEMENT: show version number more prominent on about dialog
    - IMPROVEMENT: blink faster in case updates are available and a deprecated version is running
    - IMPROVEMENT: make entire "move window" areas draggable
    - IMPROVEMENT: use a pointer cursor on all clickable areas
    - UPDATE: upgrade to Electron 11.0.5
    - UPDATE: upgrade to mp4box.js 0.4.1
    - UPDATE: upgrade minor dependencies

- 1.9.0
    - IMPROVEMENT: support "abstain" as an answer on votings

- 1.8.8
    - IMPROVEMENT: provide more speed decrease/increase options on replay
    - IMPROVEMENT: show recording wall-clock time during replay

- 1.8.7
    - BUGFIX: fix HLS/m3u8 based recording by using a more robust and correct timing
    - BUGFIX: make HLS/m3u8 based playing more robust by using HLS.js API more correct
    - IMPROVEMENT: optically improve recording list on login dialog
    - IMPROVEMENT: add "REPLAY" information overlay to video playback

- 1.8.6
    - IMPROVEMENT: use my github.oscdn.org CDN service to circumvent Amazon S3 peering bottlenecks
    - UPDATE: update to latest update-helper for github.oscdn.org CDN support

- 1.8.5
    - IMPROVEMENT: further improve optical appearance of tooltips and headlines

- 1.8.4
    - IMPROVEMENT: improve optical appearance of tooltips

- 1.8.3
    - IMPROVEMENT: improve optical appearance of titles and labels
    - IMPROVEMENT: improve optical appearance of dialogs
    - UPDATE: update dependencies

- 1.8.2
    - BUGFIX: fix optical appearance of recording popup list

- 1.8.1
    - IMPROVEMENT: do not notify updates on login dialog if forthcoming version is already used
    - BUGFIX: extra safe-guard for total percentage calculation to not show a NaN
    - BUGFIX: do not fail internally by ensuring the "recordings" directory really exists

- 1.8.0
    - EXTENSION: allow streams to be recorded and replayed within a short amount of time

- 1.7.4
    - UPGRADE: upgrade to Electron 11.0.3

- 1.7.3
    - IMPROVEMENT: optically improve connect button on login dialog
    - IMPROVEMENT: optically improve update dialog on checking new version
    - IMPROVEMENT: optically improve settings dialog
    - IMPROVEMENT: optically improve about dialog

- 1.7.2
    - BUGFIX: optically better grey out meter and sliders on login
    - IMPROVEMENT: optically simplify the login dialog
    - IMPROVEMENT: added a bunch of additional tooltips

- 1.7.1
    - EXTENSION: verify digital signature of distribution archive on all updates
    - IMPROVEMENT: show update errors on update dialog

- 1.7.0
    - EXTENSION: add capability to save the last 10s of the video stream as an MP4 file
    - EXTENSION: add capability to toggle meter between kbps/duration/clock
    - IMPROVEMENT: take screen scale factor (pixels vs. dots) into account for native window resizing
    - IMPROVEMENT: do not hard-code stream video size to 1920x1080 and instead figure it out for "source size" button
    - IMPROVEMENT: improve the popup texts
    - IMPROVEMENT: throttle sending messages to avoid too much messages per time range
    - UPGRADE: upgrade to Electron 11.0.2

- 1.6.1
    - IMPROVEMENT: raise a fatal error message in the UI in case ffmpeg crashes and a system one is not available

- 1.6.0
    - IMPROVEMENT: finally also provide Linux/x64 support
    - IMPROVEMENT: simplify audio recording by removing the 1/2/3 countdown
    - EXTENSION: added stealth mode for the trainer monitoring session to not confuse the trainees
    - BUGFIX: resend current feeling on each reconnect, even if caused remotely by the trainer
    - UPGRADE: upgrade minor dependencies

- 1.5.4
    - IMPROVEMENT: make keystrokes of internal debugs less invasive
    - IMPROVEMENT: log debug information of video stream only if debug is enabled

- 1.5.3
    - BUGFIX: fixed the video element feeding by starting buffer transfer only once both audio/video buffers exist
    - IMPROVEMENT: add debug console to video element

- 1.5.2
    - EXTENSION: add video stream closure for demonstration purposes
    - IMPROVEMENT: polish some UI texts

- 1.5.1
    - IMPROVEMENT: improve update dialog

- 1.5.0
    - EXTENSION: support person privacy levels
    - UPGRADE: upgrade minor dependencies
    - UPGRADE: upgrade update-helper tool
    - BUGFIX: try to circumvent timing issue on video element feeding

- 1.4.3
    - BUGFIX: fix unpacking of update distribution files
    - UPGRADE: upgraded to Update Helper 1.0.3
    - UPGRADE: upgraded to Howler 2.2.1

- 1.4.2
    - IMPROVEMENT: improved appearance of hover effects on login dialog
    - UPGRADE: upgraded to new Update Helper 1.0.1
    - REFACTORING: upgraded to 'fas' CSS prefix for FontAwesome

- 1.4.1
    - BUGFIX: fixed blinking of Updates button on login dialog

- 1.4.0
    - EXTENSION: added application update support
    - UPGRADE: upgrade to Electron 10.1.5
    - UPGRADE: upgrade minor dependencies

- 1.3.3
    - BUGFIX: fix internal forwarding of externally received reconnect/disconnect events
    - BUGFIX: increase delay on reconnect

- 1.3.2
    - IMPROVEMENT: send version to LiVE Sender to see when deprecated versions are still used
    - BUGFIX: fix Reconnect functionality
    - CLEANUP: cleanup tooltips texts
    - UPGRADE: upgrade to TypoPRO 4.2.4

- 1.3.1
    - EXTENSION: added Reconnect functionality for convenience reasons
    - IMPROVEMENT: slightly reduce darkness of background theme
    - IMPROVEMENT: disable confusing spellchecking functionality of Electron
    - IMPROVEMENT: slightly reduce smallest window size
    - EXTENSION: add more hotkeys
    - IMPROVEMENT: document hotkeys in tooltips

- 1.3.0
    - UPGRADE: upgraded to Electron 10.1.3
    - UPGRADE: upgraded to FontAwesome 5.15.1
    - REFACTORING: switch from deprecated MomentJS to DayJS
    - IMPROVEMENT: group header/footer buttons through an optical bar
    - IMPROVEMENT: use my new Audio-Node-Suite package for the microphone

- [...]

Legend
------

- change scope:
    - MAJOR:        major ...
    - MINOR:        minor ...

- change consequences:
    - SECURITY:     security relevant ...
    - INCOMPATIBLE: incompatible ...

- change types:
    - UPGRADE:      upgraded   dependencies
    - EXTENSION:    new        functionality
    - IMPROVEMENT:  improved   functionality or appearance
    - BUGFIX:       fixed      functionality or appearance
    - REFACTORING:  refactored functionality or appearance
    - CLEANUP:      cleaned up functionality or appearance

