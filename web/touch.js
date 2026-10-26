// On-screen controls for phones and tablets: a stick on the left for the arrow keys (move and strafe, and
// up / down in menus), dragging anywhere else to move the mouse (aim in a mission, the cursor in menus), a
// tap there to click at that spot, and buttons for the game's default keys (index.html's keyboard list).
// Everything goes in as the keyboard and mouse the game already reads (host/input.c), so remapping keys in
// the game's Configuration menu breaks the matching button.
'use strict';

const RcTouch = (() => {
  const HOLD_MS = 70;   // the game samples input once a frame (30 fps in missions): hold taps at least this long
  const BUTTONS = [     // id, label, what it presses (HID usage, or mouse button), placement class
    ['fire', 'FIRE', { mouse: 0 }, 'b-fire'],
    ['reload', 'RELOAD<small>OK</small>', { key: 40 }, 'b-reload'],       // Enter
    ['weapon', 'WEAPON', { mouse: 1 }, 'b-weapon'],                       // right click
    ['crouch', 'CROUCH', { key: 228 }, 'b-crouch'],                       // Right Ctrl
    ['jump', 'JUMP', { key: 98 }, 'b-jump'],                              // Num 0
    ['use', 'USE', { key: 229 }, 'b-use'],                                // Right Shift
    ['bino', 'BINO', { key: 44 }, 'b-bino'],                              // Space
    ['zin', 'ZOOM+', { key: 75 }, 'b-zin'],                               // Page Up
    ['zout', 'ZOOM−', { key: 78 }, 'b-zout'],                             // Page Down
    ['map', 'MAP', { key: 6 }, 'b-map'],                                  // C
    ['menu', 'MENU', { key: 41 }, 'b-menu'],                              // Esc
  ];
  const ARROWS = { up: 82, down: 81, left: 80, right: 79 };

  const wanted = () => new URLSearchParams(location.search).has('touch') ||
    (matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0);

  function attach(M, stage, canvas) {
    const root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML = '<div class="t-look"></div><div class="t-stick"><div class="t-knob"></div></div>' +
      BUTTONS.map(([id, label, , cls]) => `<button class="t-btn ${cls}" data-id="${id}">${label}</button>`).join('');
    stage.appendChild(root);
    document.body.classList.add('touch');

    // input with a minimum hold, so a quick tap still lasts a game frame
    const downAt = new Map();
    const press = (what, down) => {
      const k = what.key !== undefined ? 'k' + what.key : 'm' + what.mouse;
      const send = (v) => (what.key !== undefined ? M._input_key_hid(what.key, v) : M._input_mouse_button(what.mouse, v));
      if (down) { downAt.set(k, performance.now()); send(1); return; }
      const held = performance.now() - (downAt.get(k) ?? 0);
      downAt.delete(k);
      if (held >= HOLD_MS) send(0); else setTimeout(() => { if (!downAt.has(k)) send(0); }, HOLD_MS - held);
    };

    // Finger motion -> mouse counts. The game turns a count into about 1.33 px across and 0.8 px down of
    // its 640x480 screen, which the canvas letterboxes at 4:3: these factors make the menu cursor follow the
    // finger. Fractions carry over so slow drags still move.
    const sens = Number(new URLSearchParams(location.search).get('touchsens')) || 1;
    let fx = 0, fy = 0;
    const move = (dx, dy) => {
      const r = canvas.getBoundingClientRect();
      const h = Math.min(r.height, (r.width * 3) / 4), w = (h * 4) / 3;
      fx += (dx * 640) / w / 1.333 * sens;
      fy += (dy * 480) / h / 0.8 * sens;
      const ix = Math.trunc(fx), iy = Math.trunc(fy);
      // raw motion; the engine inverts look-Y only in a mission (see dinput.c), menus are unaffected
      if (ix || iy) { M._input_mouse_move(ix, iy); fx -= ix; fy -= iy; }
    };

    // a point on the page -> pixels of the game's 640x480 screen, letterboxed at 4:3 in the canvas
    const gamePoint = (x, y) => {
      const r = canvas.getBoundingClientRect();
      const h = Math.min(r.height, (r.width * 3) / 4), w = (h * 4) / 3;
      const gx = ((x - r.left - (r.width - w) / 2) * 640) / w, gy = ((y - r.top - (r.height - h) / 2) * 480) / h;
      return { x: Math.round(Math.max(0, Math.min(639, gx))), y: Math.round(Math.max(0, Math.min(479, gy))) };
    };

    // every finger is tracked by pointer id: one can steer while another aims and a third fires
    const fingers = new Map();   // pointerId -> { kind, x, y, t0, moved, what }
    const stick = root.querySelector('.t-stick'), knob = root.querySelector('.t-knob');
    let arrows = new Set();
    const setArrows = (next) => {
      for (const a of arrows) if (!next.has(a)) press({ key: ARROWS[a] }, false);
      for (const a of next) if (!arrows.has(a)) press({ key: ARROWS[a] }, true);
      arrows = next;
    };
    const steer = (f, x, y) => {
      const r = stick.getBoundingClientRect(), R = r.width / 2;
      let dx = x - (r.left + R), dy = y - (r.top + R);
      const len = Math.hypot(dx, dy), lim = R * 0.6;
      if (len > lim) { dx *= lim / len; dy *= lim / len; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      // 8 directions with a dead zone; diagonals press two arrows, as on a keyboard
      const next = new Set();
      if (len > R * 0.25) {
        const a = Math.atan2(dy, dx), s = Math.sin(a), c = Math.cos(a);
        if (s < -0.38) next.add('up'); if (s > 0.38) next.add('down');
        if (c < -0.38) next.add('left'); if (c > 0.38) next.add('right');
      }
      setArrows(next);
    };

    root.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      root.setPointerCapture?.(e.pointerId);
      const btn = e.target.closest('.t-btn');
      const f = { x: e.clientX, y: e.clientY, t0: performance.now(), moved: 0 };
      if (btn) {
        f.kind = 'btn';
        f.btn = btn;
        f.what = BUTTONS.find((b) => b[0] === btn.dataset.id)[2];
        btn.classList.add('on');
        press(f.what, true);
      } else if (e.target.closest('.t-stick')) {
        f.kind = 'stick';
        steer(f, e.clientX, e.clientY);
      } else f.kind = 'look';
      fingers.set(e.pointerId, f);
    }, { passive: false });

    root.addEventListener('pointermove', (e) => {
      const f = fingers.get(e.pointerId);
      if (!f) return;
      e.preventDefault();
      if (f.kind === 'stick') { steer(f, e.clientX, e.clientY); return; }
      // look, and the fire button too: hold fire and drag to aim while shooting
      if (f.kind === 'look' || f.btn?.dataset.id === 'fire') {
        const dx = e.clientX - f.x, dy = e.clientY - f.y;
        f.moved += Math.abs(dx) + Math.abs(dy);
        move(dx, dy);
      }
      f.x = e.clientX; f.y = e.clientY;
    }, { passive: false });

    const end = (e) => {
      const f = fingers.get(e.pointerId);
      if (!f) return;
      fingers.delete(e.pointerId);
      if (f.kind === 'btn') { f.btn.classList.remove('on'); press(f.what, false); }
      else if (f.kind === 'stick') { knob.style.transform = ''; setArrows(new Set()); }
      // A tap (not a drag) clicks where the finger is: the game steers its cursor there first when its profile
      // says where the cursor is (host/input.c: input_tap; in a mission, with no cursor, a tap does nothing).
      // Otherwise it clicks wherever the cursor is.
      else if (f.moved < 12 && performance.now() - f.t0 < 300) {
        const p = gamePoint(f.x, f.y);
        if (!(M._input_tap && M._input_tap(p.x, p.y))) { press({ mouse: 0 }, true); press({ mouse: 0 }, false); }
      }
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
    root.addEventListener('contextmenu', (e) => e.preventDefault());
    // no double-tap zoom, pinch or page scroll while playing
    root.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    root.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    window.addEventListener('blur', () => {
      for (const [id, f] of fingers) end({ pointerId: id });
    });
  }

  // Landscape, fullscreen where the browser allows it (not on iPhone; there, Add to Home Screen gives the
  // most room). Called from the Play tap, which counts as the user gesture both need.
  function goFullscreen(stage) {
    const fs = stage.requestFullscreen || stage.webkitRequestFullscreen;
    const p = fs?.call(stage, { navigationUI: 'hide' });
    Promise.resolve(p).then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
  }

  return { wanted, attach, goFullscreen };
})();
