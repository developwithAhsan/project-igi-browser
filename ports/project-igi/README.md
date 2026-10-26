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
