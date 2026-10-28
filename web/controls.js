// Shared controls layer for the keyboard/mouse page (loader.js) and the on-screen touch controls (touch.js):
//  - the game's actions and the default key each one has in its config.qvm (the game's own bindings stay at
//    their defaults; everything here translates onto them in the browser)
//  - mouse button bindings (which action left / right / middle click does, saved per browser)
//  - the scope toggle: the game only has stepped Zoom In / Zoom Out keys (sniper scope, binoculars); one
//    button that toggles the scope on and off is what players expect
//  - look settings: touch swipe sensitivity, a scope multiplier, PC mouse sensitivity
//  - the gyroscope on phones: turning the phone turns the view, like mobile shooters do
// Everything reaches the game as the keys and mouse it already reads (host/input.c), only in a mission
// (host input_in_mission): the 2D menus always get a plain click and an unscaled cursor.
'use strict';

const RcControls = (() => {
  const STORE = 'igi-settings';
  const HOLD_MS = 70;   // the game samples input once a frame (30 fps in missions): hold taps at least this long

  // what the game does and the key it reads for it (HID usage; the game's defaults from config.qvm)
  const ACTIONS = {
    fire:       { label: 'Fire',            mouse: 0 },
    scope:      { label: 'Scope (toggle)',  scope: true },     // Zoom In once / Zoom Out back to normal view
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
    walk:       { label: 'Walk / run',      key: 26 },         // W (toggles)
    map:        { label: 'Map computer',    key: 6 },          // C
    menu:       { label: 'Menu',            key: 41 },         // Esc
    none:       { label: 'Nothing' },
  };
  // the actions a mouse button can take, in menu order
  const MOUSE_CHOICES = ['fire', 'scope', 'zoomin', 'zoomout', 'nextweapon', 'prevweapon', 'altfire', 'reload', 'crouch', 'jump', 'use', 'bino', 'peek', 'walk', 'none'];

  const DEFAULTS = {
    mouse: { 0: 'fire', 1: 'altfire', 2: 'scope' },   // left, middle, right (MouseEvent.button)
    mouseSens: 1,       // PC: multiplier on mouse motion
    look: 1,            // touch: swipe sensitivity
    scopeSens: 0.6,     // touch and gyro: multiplier while the scope is on
    gyro: 'off',        // 'off' | 'on' | 'scope'
    gyroSens: 1,
  };
  let S = load();
  function load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { saved = {}; }
    const s = { ...DEFAULTS, mouse: { ...DEFAULTS.mouse } };
    for (const k of ['mouseSens', 'look', 'scopeSens', 'gyroSens']) if (typeof saved[k] === 'number' && saved[k] > 0) s[k] = saved[k];
    if (['off', 'on', 'scope'].includes(saved.gyro)) s.gyro = saved.gyro;
    if (saved.mouse) for (const b of [0, 1, 2]) if (ACTIONS[saved.mouse[b]]) s.mouse[b] = saved.mouse[b];
    return s;
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch { /* storage blocked */ } }
  const get = () => S;
  function set(k, v) { S[k] = v; save(); if (k === 'gyro') gyroApply(); }
  function setMouse(button, action) { S.mouse[button] = ACTIONS[action] ? action : 'none'; save(); }
  function reset() { S = { ...DEFAULTS, mouse: { ...DEFAULTS.mouse } }; save(); gyroApply(); }

  // ---- sending input: a key or mouse button held at least HOLD_MS so a quick tap still lasts a game frame
  let M = null;
  const inMission = () => !!(M && M._input_in_mission && M._input_in_mission());
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

  // ---- the scope. The game's Zoom In / Zoom Out keys zoom continuously while held (the sniper scope and
  // the binoculars; it saturates after about 2 s), so a scope toggle holds Zoom In for a moment, and later
  // holds Zoom Out for as long as the view has been zoomed in, which brings it back to the normal view. The
  // net zoom-in time is tracked from every zoom key the player uses; a weapon change drops the zoom in the
  // game, so it resets the count.
  const SCOPE_IN_MS = 420, ZOOM_MAX_MS = 2600, UNZOOM_EXTRA_MS = 350;
  let zoomMs = 0;              // net time the view has been zooming in
  let zoomKey = 0, zoomSince = 0;   // +1 / -1 while a zoom key is down, and since when
  let seq = 0;                 // a toggle's timer
  const scoped = () => zoomMs > 0;
  const listeners = new Set();
  const notify = () => { for (const f of listeners) f(scoped()); };
  function onScope(f) { listeners.add(f); }
  function zoomSettle() {   // fold the time a zoom key has been held into zoomMs
    if (!zoomKey) return;
    const now = performance.now();
    zoomMs = Math.max(0, Math.min(ZOOM_MAX_MS, zoomMs + zoomKey * (now - zoomSince)));
    zoomSince = now;
  }
  function zoomKeyDown(dir) {   // the plain zoom keys, held from a button or a binding
    zoomSettle();
    if (zoomKey && zoomKey !== dir) press(zoomKey > 0 ? ACTIONS.zoomin : ACTIONS.zoomout, false);
    zoomKey = dir; zoomSince = performance.now();
    press(dir > 0 ? ACTIONS.zoomin : ACTIONS.zoomout, true);
    notify();
  }
  function zoomKeyUp(dir) {
    if (zoomKey !== dir) return;
    zoomSettle();
    zoomKey = 0;
    press(dir > 0 ? ACTIONS.zoomin : ACTIONS.zoomout, false);
    notify();
  }
  function scopeToggle() {
    if (seq) { clearTimeout(seq); seq = 0; if (zoomKey) zoomKeyUp(zoomKey); }
    if (!scoped()) {
      zoomKeyDown(1);
      seq = setTimeout(() => { seq = 0; zoomKeyUp(1); }, SCOPE_IN_MS);
    } else {
      const hold = zoomMs + UNZOOM_EXTRA_MS;
      zoomKeyDown(-1);
      seq = setTimeout(() => { seq = 0; zoomKeyUp(-1); zoomMs = 0; notify(); }, hold);
    }
  }
  function weaponChanged() {
    if (seq) { clearTimeout(seq); seq = 0; }
    if (zoomKey) { press(zoomKey > 0 ? ACTIONS.zoomin : ACTIONS.zoomout, false); zoomKey = 0; }
    zoomMs = 0; notify();
  }

  // ---- an action pressed / released (a mouse button or a touch button)
  function act(name, down) {
    const a = ACTIONS[name];
    if (!a) return;
    if (a.scope) { if (down) scopeToggle(); return; }
    if (name === 'zoomin' || name === 'zoomout') { (down ? zoomKeyDown : zoomKeyUp)(name === 'zoomin' ? 1 : -1); return; }
    if (down && (name === 'nextweapon' || name === 'prevweapon')) weaponChanged();
    press(a, down);
  }
  // which action a physical mouse button does right now: in a mission the player's binding, in the menus the
  // plain button (left click must always click)
  function mouseAction(button) {
    if (!inMission()) return button === 0 ? 'fire' : button === 2 ? 'nextweapon' : 'none';
    return S.mouse[button] || 'none';
  }
  // key events that change the weapon (the game's own keys: O, the weapon rows 1-9) drop the scope count
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
  const lookScale = () => (scoped() ? S.scopeSens : 1);

  // ---- gyroscope (devicemotion): the rotation rate about the vertical axis turns the view, about the screen's
  // horizontal axis tilts it. Gravity (low-passed accelerationIncludingGravity) gives both axes in the device's
  // frame whatever way the phone is held, so the mapping holds in either landscape and when the phone is
  // tilted back. iOS reports the acceleration with the opposite sign to the spec, and needs permission.
  const webkit = /AppleWebKit\//.test(navigator.userAgent) && !/Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent);
  const DEG = 4.0;   // mouse counts per degree of phone rotation at sensitivity 1
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
    const w = [r.beta, r.gamma, r.alpha];                      // deg/s about device x, y, z (right-hand rule)
    const yaw = w[0] * up[0] + w[1] * up[1] + w[2] * up[2];    // turning left = positive
    const pitch = w[0] * right[0] + w[1] * right[1];           // tilting the top edge back (looking up) = negative
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

  function attach(module) { M = module; gyroApply(); }

  return { ACTIONS, MOUSE_CHOICES, DEFAULTS, get, set, setMouse, reset, attach, press, tap, act, mouseAction, keyUsage,
    look, lookScale, scoped, onScope, weaponChanged, inMission, gyroEnable, gyroState };
})();
