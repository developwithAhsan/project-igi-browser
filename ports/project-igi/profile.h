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
/* The in-game (Esc, "Game Paused") menu has its own cursor; the only trace of it in static memory is the
   cursor sprite's quad, two floats (top-left corner, 640x480 units). Valid only while the game is paused. */
#define PROFILE_CURSOR2_X  0x00684300u
#define PROFILE_CURSOR2_Y  0x00684304u
/* Game time: a counter that advances every frame while the game plays and stands still while it is paused
   (the Esc menu over the 3D world). The host tells mouse-look from menu-cursor mode by it (render_rec.c). */
#define PROFILE_TICK       0x00a44398u

#endif
