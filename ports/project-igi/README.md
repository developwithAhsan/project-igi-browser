# Project I.G.I. port

`profile.h` names the game's executable (`igi.exe`), its install path as the game sees it, and the addresses
the touch controls use to steer the menu cursor. The game talks to DirectDraw 7 / Direct3D 7, which
`host/ddraw7.c` provides on top of the same WebGPU renderer the Direct3D 8 layer uses.

Build and run (from the repo root, with the tools listed in the top-level README):

```bash
GHIDRA=~/ghidra_12.1.4_PUBLIC ghidra/export.sh /path/to/igi.exe work/functions.json
PROFILE=ports/project-igi/profile.h ./build.sh /path/to/igi.exe work/functions.json   # native app
PROFILE=ports/project-igi/profile.h ./build_web.sh                                   # browser build
python3 web/serve.py --game /path/to/Project_IGI_folder                              # http://localhost:8007/?devgame
```

Useful switches: `?log` (host log in the console), `?input=500:tap=320:200,...` (scripted input, see
`host/input.c`), `?mem=compact|full` and `?gpu=coalesce|direct` (the WebKit memory paths, on any browser).

Controls on the page: `web/controls.js` holds the game's actions with their default keys (from its
`config.qvm`), the mouse-button bindings, the scope toggle, the sensitivity settings and the gyroscope;
`web/loader.js` renders the Controls panel (keyboard layout presets, keys, mouse, screen) and `web/touch.js`
the on-screen buttons, settings sheet and guide. The game's own Configuration menu must stay at its defaults
for these to match. Project I.G.I. has no prone / crawl: crouch is the lowest stance. Crouch and walk are held keys (verified
natively: a tapped crouch key does nothing lasting, a held one lowers the camera), binoculars a toggle, and
only the sniper rifles and the binoculars zoom.

Game state the host reads (`profile.h`, found by diffing `RC_MEMSNAP` snapshots of `.data`): the main menus'
cursor (`PROFILE_CURSOR_X/Y`, ints, 640x480 units), the Esc menu's cursor sprite (`PROFILE_CURSOR2_X/Y`,
floats in display-mode pixels, valid while paused) and the game clock (`PROFILE_TICK`, frozen while the Esc
menu is up). The zoom of the view comes from the projection matrix of the world draws (`input_zoom`).
Measured (native, `RC_DUMP` of the camera matrix at 0x5ca140): the view turns 0.212° per mouse count at speed,
only ~0.11° per count below 50 counts a frame, and at most ~54° a frame; `host/dinput.c` undoes that curve.
While zoomed the game already scales turning by the zoom (0.7x in the binoculars at 1x, 0.11x at 5x), so the
page adds only the player's "scoped sensitivity" factor, nothing automatic. All missions are selectable in the
mission list (`tap=380:218+16*n` on the 640x480 screen, n = 0 Trainyard ... 4 Radar Base ...); the four
one-byte `.AFP` files in the game folder are the player profiles.

Testing switches: `RC_MEMSNAP=frame:addr:len:path`, `RC_POKE=frame:addr:hexbytes`, `RC_DUMP`, `RC_ZOOM_LOG=1`
(the projection's zoom whenever it changes), `RC_PROJ_LOG=frame`, `RC_WINDOW=WxH` and `RC_WIDE=1` (native
widescreen), `RC_FORCE_MODE=WxH` (override the display mode the game asks for).
