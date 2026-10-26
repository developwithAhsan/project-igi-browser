/* Profile for Project I.G.I.: the game's executable and install folder as it sees them. The DirectDraw 7 /
 * Direct3D 7 layer it needs is host/ddraw7.c; see README.md in this folder.
 */
#ifndef RC_PROFILE_H
#define RC_PROFILE_H

#define PROFILE_EXE        "igi.exe"
#define PROFILE_GUEST_ROOT "C:\\Project I.G.I."
#define PROFILE_GUEST_EXE  "igi.exe"
#define PROFILE_TITLE      "Project I.G.I."

#define PROFILE_REGISTRY

/* the menu cursor, in pixels of the game's 640x480 screen: touch taps steer it to the finger (host/input.c) */
#define PROFILE_CURSOR_X   0x0057bad4u
#define PROFILE_CURSOR_Y   0x0057bad8u

#endif
