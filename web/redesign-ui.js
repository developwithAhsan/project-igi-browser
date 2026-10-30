/* UI-only helpers. This file does not access or modify game runtime state. */
(function () {
  'use strict';
  var menu = document.getElementById('menu-toggle');
  var nav = document.getElementById('site-nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      });
    });
  }
  var toolbarFullscreen = document.getElementById('toolbar-fullscreen');
  var existingFullscreen = document.getElementById('fs');
  if (toolbarFullscreen && existingFullscreen) {
    toolbarFullscreen.addEventListener('click', function () { existingFullscreen.click(); });
  }
  var toolbarSettings = document.getElementById('toolbar-settings');
  var controls = document.getElementById('kbd');
  if (toolbarSettings && controls) {
    toolbarSettings.addEventListener('click', function () {
      document.body.classList.add('settings-open');
    });
  }
  if (controls) { var close = document.getElementById('kbd-close'); if (close) close.addEventListener('click', function(){ document.body.classList.remove('settings-open'); }); document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.body.classList.contains('settings-open'))document.body.classList.remove('settings-open');}); }
  var controlsToggle = document.getElementById('mobile-controls-toggle');
  if (controlsToggle && controls) {
    controlsToggle.addEventListener('click', function (event) {
      event.stopPropagation();
      var collapsed = controls.classList.toggle('mobile-collapsed');
      controlsToggle.textContent = collapsed ? 'Expand' : 'Collapse';
      controlsToggle.setAttribute('aria-expanded', String(!collapsed));
    });
  }
})();
