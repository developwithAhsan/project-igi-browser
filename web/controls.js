// Shared controls layer for the keyboard/mouse page (loader.js) and the on-screen touch controls (touch.js):
//  - the game's actions and the default key each one has in its config.qvm (the game's own bindings stay at
//    their defaults; everything here translates onto them in the browser)
//  - mouse button bindings (which action left / right / middle click does, saved per browser)
//  - the scope toggle: the game only has Zoom In / Zoom Out keys that zoom continuously while held (sniper
//    scope, binoculars); one button that snaps to a scope zoom and back is what players expect. The host
//    reports the actual zoom of the view (input_zoom: the projection's y scale, 2.31 at the normal view, up
//    to ~21 fully zoomed), so the toggle holds the key until the view really is there, at any frame rate.
//  - look settings: touch swipe sensitivity, a scope multiplier, PC mouse sensitivity
//  - the gyroscope on phones: turning the phone turns the view, like mobile shooters do
// Everything reaches the game as the keys and mouse it already reads (host/input.c), only in mouse-look mode
// (host input_in_mission: a mission with the game running): the 2D menus, and the Esc menu over a paused
// mission, always get a plain click and an unscaled cursor.
'use strict';

const RcControls = (() => {
  const STORE = 'igi-settings';
  const HOLD_MS = 70;   // the game samples input once a frame: hold taps at least this long (the host also keeps a press until sampled)

  // what the game does and the key it reads for it (HID usage; the game's defaults from config.qvm)
  const ACTIONS = {
    fire:       { label: 'Fire',            mouse: 0 },
    scope:      { label: 'Scope (toggle)',  scope: true },     // zoom to the scope level / back to the normal view
    zoomin:     { label: 'Zoom in',         key: 75 },         // Page Up
    zoomout:    { label: 'Zoom out',        key: 78 },         // Page Down
    nextweapon: { label: 'Next weapon',     mouse: 1 },        // the game's right click
    prevweapon: { label: 'Previous weapon', key: 18 },         // O
    altfire:    { label: 'Alternate fire',  key: 42 },         // Backspace
    reload:     { label: 'Reload',          key: 40 },         // Enter
    use:        { label: 'Use / activate',  key: 229 },        // Right Shift
    crouch:     { label: 'Crouch',          key: 228 },        // Right Ctrl
    jump:       { label: 'Jump',            key: 98 },         // Numpad 0
    peek:       { label: 'Peek',            key: 89 },         // Numpad 1
    bino:       { label: 'Binoculars',      key: 44 },         // Space
    walk:       { label: 'Walk / run',      key: 26 },         // W (held)
    map:        { label: 'Map computer',    key: 6 },          // C
    menu:       { label: 'Menu',            key: 41 },         // Esc
    none:       { label: 'Nothing' },
  };
  // the actions a mouse button can take, in menu order
  const MOUSE_CHOICES = ['fire', 'scope', 'zoomin', 'zoomout', 'nextweapon', 'prevweapon', 'altfire', 'reload', 'crouch', 'jump', 'use', 'bino', 'peek', 'walk', 'none'];

  const DEFAULTS = {
    mouse: { 0: 'fire', 1: 'altfire', 2: 'scope' },   // left, middle, right (MouseEvent.button)
    mouseSens: 0.6,     // PC: multiplier on mouse motion (the host makes the game's response linear, 0.212 deg per count)
    look: 1,            // touch: swipe sensitivity
    scopeSens: 1,       // touch, mouse and gyro while scoped: on top of the automatic slow-down by the zoom
    scopeZoom: 4,       // the zoom the scope button snaps to (x the normal view)
    gyro: 'scope',      // 'off' | 'on' | 'scope'
    gyroSens: 1,
    wide: true,         // widescreen: the 3D world fills the whole screen (host rc_set_wide); false = 4:3 letterboxed
  };
  let S = load();
  function load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { saved = {}; }
    const s = { ...DEFAULTS, mouse: { ...DEFAULTS.mouse } };
    for (const k of ['mouseSens', 'look', 'scopeSens', 'scopeZoom', 'gyroSens']) if (typeof saved[k] === 'number' && saved[k] > 0) s[k] = saved[k];
    if (['off', 'on', 'scope'].includes(saved.gyro)) s.gyro = saved.gyro;
    if (typeof saved.wide === 'boolean') s.wide = saved.wide;
    if (saved.mouse) for (const b of [0, 1, 2]) if (ACTIONS[saved.mouse[b]]) s.mouse[b] = saved.mouse[b];
    return s;
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch { /* storage blocked */ } }
  const get = () => S;
  function set(k, v) { S[k] = v; save(); if (k === 'gyro') gyroApply(); if (k === 'wide') wideApply(); }
  const wideApply = () => { if (M && M._rc_set_wide) M._rc_set_wide(S.wide ? 1 : 0); };
  function setMouse(button, action) { S.mouse[button] = ACTIONS[action] ? action : 'none'; save(); }
  function reset() { S = { ...DEFAULTS, mouse: { ...DEFAULTS.mouse } }; save(); gyroApply(); wideApply(); }

  // ---- sending input: a key or mouse button held at least HOLD_MS so a quick tap still lasts a game frame
  let M = null;
  const inMission = () => !!(M && M._input_in_mission && M._input_in_mission());
  const paused = () => !!(M && M._input_paused && M._input_paused());
  const downAt = new Map();
  function press(what, down) {
    if (!M) return;
    const k = what.key !== undefined ? 'k' + what.key : 'm' + what.mouse;
    const send = (v) => (what.key !== undefined ? M._input_key_hid(what.key, v) : M._input_mouse_button(what.mouse, v));
    if (down) { downAt.set(k, performance.now()); send(1); return; }
    const held = performance.now() - (downAt.get(k) ?? 0);
    downAt.delete(k);
    if (held >= HOLD_MS) send(0); else setTimeout(() => { if (!downAt.has(k)) send(0); }, HOLD_MS - held);
  }
  const tap = (what) => { press(what, true); press(what, false); };

  // ---- the scope. zoom() is the view's zoom as the host saw it last frame (1 = normal view). scoped() is
  // true once the view is zoomed in at all (the scope or binoculars are up, however it got there: the toggle,
  // the plain zoom keys, the game). The toggle drives the zoom keys towards a target and lets go when the
  // view gets there, stops moving (a weapon without a scope: nothing happens) or after a few seconds.
  const BASE_M11 = 2.3094;   // the projection's y scale at the normal view (fov 47 deg)
  const zoomRaw = () => (M && M._input_zoom ? M._input_zoom() : 0);
  const zoom = () => { const z = zoomRaw(); return z > 0 ? z / BASE_M11 : 1; };
  const scoped = () => zoom() > 1.12;
  const listeners = new Set();
  let lastScoped = false, lastShown = 0;
  const notify = () => { for (const f of listeners) f(scoped(), zoom()); };
  function onScope(f) { listeners.add(f); }
  let zoomKey = 0;          // +1 / -1 while a zoom key is held (by the toggle or the player), 0 otherwise
  let drive = null;         // the toggle's run: { dir, target, last, lastT, t0, timer }
  function zoomKeyDown(dir) {
    if (zoomKey === dir) return;
    if (zoomKey) press(zoomKey > 0 ? ACTIONS.zoomin : ACTIONS.zoomout, false);
    zoomKey = dir;
    press(dir > 0 ? ACTIONS.zoomin : ACTIONS.zoomout, true);
  }
  function zoomKeyUp(dir) {
    if (zoomKey !== dir) return;
    zoomKey = 0;
    press(dir > 0 ? ACTIONS.zoomin : ACTIONS.zoomout, false);
  }
  function driveStop(reached) {
    if (!drive) return;
    const d = drive;
    clearInterval(d.timer);
    zoomKeyUp(d.dir);
    drive = null;
    notify();
    if (d.done && reached !== undefined) d.done(reached, d.moved);   // not when cancelled
  }
  // target: zoom factor (1 = normal view); patience: ms the zoom may stand still before the drive gives up
  // (the zoom saturated, or this weapon has no scope); done(reached, moved) runs when the drive lets go.
  function zoomTo(target, done, patience = 700) {
    driveStop();
    const z = zoom(), dir = target > z ? 1 : -1;
    if (Math.abs(target - z) < 0.04 * target) { if (done) done(true, false); return; }
    const now = performance.now();
    drive = { dir, target, last: z, lastT: now, t0: now, timer: 0, done, moved: false };
    zoomKeyDown(dir);
    drive.timer = setInterval(() => {
      const t = performance.now(), cur = zoom();
      const reached = dir > 0 ? cur >= target * 0.97 : cur <= Math.max(1.02, target * 1.03);
      if (Math.abs(cur - drive.last) > 0.005 * cur) { drive.last = cur; drive.lastT = t; drive.moved = true; }
      if (reached) driveStop(true);
      else if (t - drive.lastT > patience || t - drive.t0 > 4000) driveStop(false);
    }, 16);
  }
  // The scope button. Only the sniper rifles and the binoculars can zoom in this game: with any other weapon
  // the zoom keys do nothing, so when the view doesn't respond the toggle brings up the binoculars (the game
  // toggles them on each press of their key) and zooms through those; the next tap zooms back out and puts
  // them away again. A player who opened the binoculars themselves keeps them.
  let viaBino = false, binoWait = 0;
  function scopeToggle() {
    if (!inMission()) return;
    if (binoWait) { clearTimeout(binoWait); binoWait = 0; }
    if (drive) { driveStop(); return; }   // a tap while it's still zooming: stop where it is
    if (scoped()) {
      zoomTo(1, () => { if (viaBino) { viaBino = false; tap(ACTIONS.bino); } });
      return;
    }
    zoomTo(S.scopeZoom, (reached, moved) => {
      if (reached || moved || viaBino) return;
      viaBino = true;
      tap(ACTIONS.bino);
      // the binoculars take a few frames to come up (longer on a slow phone), then zoom through them
      binoWait = setTimeout(() => { binoWait = 0; zoomTo(S.scopeZoom, null, 1500); }, 350);
    }, 500);
  }
  function weaponChanged() { driveStop(); }   // the game drops the zoom itself; the readout follows
  // the scope button's state follows the real zoom, polled a few times a second
  setInterval(() => {
    if (!M) return;
    const s = scoped(), z = zoom();
    if (s !== lastScoped || (s && Math.abs(z - lastShown) > 0.15)) { lastScoped = s; lastShown = z; notify(); }
  }, 120);

  // ---- an action pressed / released (a mouse button or a touch button)
  function act(name, down) {
    const a = ACTIONS[name];
    if (!a) return;
    if (a.scope) { if (down) scopeToggle(); return; }
    if (name === 'zoomin' || name === 'zoomout') {
      if (down) { driveStop(); zoomKeyDown(name === 'zoomin' ? 1 : -1); } else zoomKeyUp(name === 'zoomin' ? 1 : -1);
      return;
    }
    if (down && (name === 'nextweapon' || name === 'prevweapon')) weaponChanged();
    if (down && name === 'bino') viaBino = false;   // the player handles the binoculars themselves
    press(a, down);
  }
  // which action a physical mouse button does right now: in mouse-look mode the player's binding, in the
  // menus (and the Esc menu over a paused mission) the plain button, so left click always clicks
  function mouseAction(button) {
    if (!inMission()) return button === 0 ? 'fire' : button === 2 ? 'nextweapon' : 'none';
    return S.mouse[button] || 'none';
  }
  // key events that change the weapon (the game's own keys: O, the weapon rows 1-9) end a scope toggle in progress
  function keyUsage(usage, down) {
    if (down && (usage === 18 || (usage >= 30 && usage <= 38))) weaponChanged();
  }

  // ---- look motion: fractions carry over so slow motion still moves
  let fx = 0, fy = 0;
  function look(dx, dy) {
    if (!M) return;
    fx += dx; fy += dy;
    const ix = Math.trunc(fx), iy = Math.trunc(fy);
    if (ix || iy) { M._input_mouse_move(ix, iy); fx -= ix; fy -= iy; }
  }
  // While scoped the view turns slower, in step with the zoom (at 4x a swipe turns about a third as far),
  // times the player's own scope multiplier; mobile shooters do the same.
  const lookScale = () => { const z = zoom(); return z > 1.12 ? S.scopeSens * Math.pow(1 / z, 0.75) : 1; };

  // ---- gyroscope (devicemotion): the rotation rate about the vertical axis turns the view, about the screen's
  // horizontal axis tilts it. Gravity (low-passed accelerationIncludingGravity) gives both axes in the device's
  // frame whatever way the phone is held, so the mapping holds in either landscape and when the phone is
  // tilted back. iOS reports the acceleration with the opposite sign to the spec, and needs permission.
  const webkit = /AppleWebKit\//.test(navigator.userAgent) && !/Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent);
  const DEG = 4.7;   // mouse counts per degree of phone rotation at sensitivity 1 (the game turns 0.212 deg per count)
  let g = null, gyroOn = false, gyroLast = 0, gyroStatus = 'idle';   // idle | on | denied | none
  const gyroState = () => gyroStatus;
  function onMotion(e) {
    const r = e.rotationRate, a = e.accelerationIncludingGravity;
    if (!r || r.alpha == null || !a || a.x == null) { if (gyroStatus === 'on') gyroStatus = 'none'; return; }
    gyroStatus = 'on';
    const now = performance.now();
    const dt = gyroLast ? Math.min(0.05, (now - gyroLast) / 1000) : 0;
    gyroLast = now;
    const s = webkit ? -1 : 1;
    const ax = a.x * s, ay = a.y * s, az = a.z * s;
    g = g ? [g[0] + (ax - g[0]) * 0.15, g[1] + (ay - g[1]) * 0.15, g[2] + (az - g[2]) * 0.15] : [ax, ay, az];
    const n = Math.hypot(g[0], g[1], g[2]);
    if (!dt || n < 1) return;
    if (!gyroActive() || !inMission()) return;
    const up = [g[0] / n, g[1] / n, g[2] / n];                 // world up in device axes (x right, y top, z out of screen)
    const right = [up[1], -up[0], 0];                          // up × z: horizontal, in the screen plane, pointing right
    const rn = Math.hypot(right[0], right[1]);
    if (rn < 0.3) return;                                      // phone lying flat: no horizontal reference
    right[0] /= rn; right[1] /= rn;
    // deg/s about device x, y, z. The spec names alpha the rate about z, but Chromium AND WebKit both fill
    // alpha/beta/gamma straight from the gyroscope's x/y/z (device_motion_event_pump.cc, WebCoreMotionManager.mm).
    const w = [r.alpha, r.beta, r.gamma];
    const yaw = w[0] * up[0] + w[1] * up[1] + w[2] * up[2];    // turning left = positive
    const pitch = w[0] * right[0] + w[1] * right[1];           // tilting the top edge back (looking up) = negative
    if (Math.abs(yaw) < 0.4 && Math.abs(pitch) < 0.4) return;  // hand tremor: a small dead zone
    const k = DEG * S.gyroSens * lookScale() * dt;
    look(-yaw * k, pitch * k);
  }
  const gyroActive = () => S.gyro === 'on' || (S.gyro === 'scope' && scoped());
  // Starts listening (once): on iOS this must be called from a user gesture (a click). One request at a time.
  let gyroPending = null;
  function gyroEnable() {
    if (gyroOn) return Promise.resolve(gyroStatus);
    if (gyroPending) return gyroPending;
    gyroPending = (async () => {
      if (!window.DeviceMotionEvent) { gyroStatus = 'none'; return gyroStatus; }
      try {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          const p = await DeviceMotionEvent.requestPermission();
          if (p !== 'granted') { gyroStatus = 'denied'; return gyroStatus; }
        }
      } catch { gyroStatus = 'denied'; return gyroStatus; }
      window.addEventListener('devicemotion', onMotion);
      gyroOn = true; gyroLast = 0; gyroStatus = 'on';
      // no event within 1.5 s: the device has no motion sensors (or the browser blocks them)
      setTimeout(() => { if (gyroStatus === 'on' && !gyroLast) gyroStatus = 'none'; }, 1500);
      return gyroStatus;
    })().finally(() => { gyroPending = null; });
    return gyroPending;
  }
  // The saved setting wants the gyroscope: where the browser asks permission (iOS) that needs a gesture, so
  // it waits for the first tap on the page; elsewhere it starts right away.
  function gyroApply() {
    if (S.gyro === 'off' || gyroOn || gyroPending) return;
    if (typeof DeviceMotionEvent?.requestPermission !== 'function') { gyroEnable(); return; }
    const once = () => { window.removeEventListener('click', once, true); window.removeEventListener('touchend', once, true); gyroEnable(); };
    window.addEventListener('click', once, true);
    window.addEventListener('touchend', once, true);
  }

  function attach(module) { M = module; gyroApply(); wideApply(); }

  return { ACTIONS, MOUSE_CHOICES, DEFAULTS, get, set, setMouse, reset, attach, press, tap, act, mouseAction, keyUsage,
    look, lookScale, scoped, zoom, zoomTo, onScope, weaponChanged, inMission, paused, gyroEnable, gyroState };
})();
