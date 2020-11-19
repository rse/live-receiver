
Changes
=======

- 1.7.0
    - EXTENSION: add capability to save the last 10s of the video stream as an MP4 file
    - IMPROVEMENT: take screen scale factor (pixels vs. dots) into account for native window resizing
    - IMPROVEMENT: do not hard-code stream video size to 1920x1080 and instead figure it out for "source size" button
    - UPGRADE: upgrade to Electron 11.0.1

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

