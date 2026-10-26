/* OLE32, the WINMM mixer and MCI, AVIFIL32 and MSVFW32: present so the game links, all reporting "no
 * such device". Games of this era fall back gracefully: no DirectMusic, no CD audio, no mixer volume
 * control, and intro movies that fail to open are skipped. */
#include "com.h"

#define W(name) static void w_##name(CPU *c)

/* ------------------------------------------------------------------ OLE32 */

W(CoInitialize) { RET(1, 0); }
W(CoUninitialize) { RET(0, 0); }
/* DirectX version probes create CLSID_DirectMusic and release it right away: hand out an inert object
   (every method after IUnknown returns E_FAIL). */
static void dummy_fail(CPU *c) { RET(1, 0x80004005u); }
static const ComMethod dummy_methods[] = {
    { "QueryInterface", 2, com_QueryInterface }, { "AddRef", 0, com_AddRef }, { "Release", 0, com_Release },
    { "Method3", 0, dummy_fail }, { "Method4", 0, dummy_fail }, { "Method5", 0, dummy_fail },
};
static ComInterface Dummy_i = { "IUnknown(dummy)", dummy_methods, 6, 0 };
#define CLSID_DirectMusic 0x636b9f10u
W(CoCreateInstance) {
    uint32_t clsid = ARG(0) ? R32(ARG(0)) : 0;
    if (clsid == CLSID_DirectMusic) {
        LOG("[ole32] CoCreateInstance(CLSID_DirectMusic) -> inert object\n");
        W32(ARG(4), com_new(&Dummy_i, 0, NULL));
        RET(5, 0);
    }
    LOG("[ole32] CoCreateInstance(%08x) -> class not registered\n", clsid);
    if (ARG(4)) W32(ARG(4), 0);
    RET(5, 0x80040154u /* REGDB_E_CLASSNOTREG */);
}

/* ------------------------------------------------------------------ WINMM: mixer and MCI */

#define MMSYSERR_NODRIVER 6
W(mixerGetNumDevs) { RET(0, 0); }
W(mixerOpen) { if (ARG(0)) W32(ARG(0), 0); RET(5, MMSYSERR_NODRIVER); }
W(mixerClose) { RET(1, 0); }
W(mixerGetDevCapsA) { RET(3, MMSYSERR_NODRIVER); }
W(mixerGetLineInfoA) { RET(3, MMSYSERR_NODRIVER); }
W(mixerGetLineControlsA) { RET(3, MMSYSERR_NODRIVER); }
W(mixerGetControlDetailsA) { RET(3, MMSYSERR_NODRIVER); }
W(mixerSetControlDetails) { RET(3, MMSYSERR_NODRIVER); }
W(mciSendCommandA) {
    LOG("[winmm] mciSendCommandA(msg %x) -> no CD audio\n", ARG(1));
    RET(4, 266 /* MCIERR_CANNOT_LOAD_DRIVER */);
}

/* ------------------------------------------------------------------ AVIFIL32 / MSVFW32 */

#define AVIERR_FILEOPEN 0x80044074u
W(AVIFileInit) { RET(0, 0); }
W(AVIFileExit) { RET(0, 0); }
W(AVIFileOpenA) {
    LOG("[avifil32] AVIFileOpenA(%s) -> movies are not supported\n", ARG(1) ? GSTR(ARG(1)) : "");
    if (ARG(0)) W32(ARG(0), 0);
    RET(4, AVIERR_FILEOPEN);
}
W(AVIFileRelease) { RET(1, 0); }
W(AVIFileInfoA) { RET(3, AVIERR_FILEOPEN); }
W(AVIFileGetStream) { if (ARG(1)) W32(ARG(1), 0); RET(4, AVIERR_FILEOPEN); }
W(AVIStreamInfoA) { RET(3, AVIERR_FILEOPEN); }
W(AVIStreamReadFormat) { RET(4, AVIERR_FILEOPEN); }
W(AVIStreamRead) { RET(7, AVIERR_FILEOPEN); }
W(AVIStreamRelease) { RET(1, 0); }
W(ICLocate) { RET(5, 0); }
W(ICSendMessage) { RET(4, 0); }
W(ICClose) { RET(1, 0); }
W(ICDecompress) { RET_CDECL(0xFFFFFFFEu /* ICERR_ERROR; VFWAPIV: caller pops */); }

static const ImportHandler mm_list[] = {
    IMPORT("OLE32.DLL", CoInitialize), IMPORT("OLE32.DLL", CoUninitialize), IMPORT("OLE32.DLL", CoCreateInstance),
    IMPORT("WINMM.DLL", mixerGetNumDevs), IMPORT("WINMM.DLL", mixerOpen), IMPORT("WINMM.DLL", mixerClose),
    IMPORT("WINMM.DLL", mixerGetDevCapsA), IMPORT("WINMM.DLL", mixerGetLineInfoA),
    IMPORT("WINMM.DLL", mixerGetLineControlsA), IMPORT("WINMM.DLL", mixerGetControlDetailsA),
    IMPORT("WINMM.DLL", mixerSetControlDetails), IMPORT("WINMM.DLL", mciSendCommandA),
    IMPORT("AVIFIL32.DLL", AVIFileInit), IMPORT("AVIFIL32.DLL", AVIFileExit), IMPORT("AVIFIL32.DLL", AVIFileOpenA),
    IMPORT("AVIFIL32.DLL", AVIFileRelease), IMPORT("AVIFIL32.DLL", AVIFileInfoA),
    IMPORT("AVIFIL32.DLL", AVIFileGetStream), IMPORT("AVIFIL32.DLL", AVIStreamInfoA),
    IMPORT("AVIFIL32.DLL", AVIStreamReadFormat), IMPORT("AVIFIL32.DLL", AVIStreamRead),
    IMPORT("AVIFIL32.DLL", AVIStreamRelease), IMPORT("MSVFW32.DLL", ICLocate), IMPORT("MSVFW32.DLL", ICSendMessage),
    IMPORT("MSVFW32.DLL", ICClose), IMPORT("MSVFW32.DLL", ICDecompress),
};
const ImportTable mm_imports = { mm_list, sizeof mm_list / sizeof mm_list[0] };
