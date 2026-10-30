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
  var closeSettings = document.getElementById('kbd-close');
  var previousFocus = null;

  function openSettings(event) {
    if (!controls) return;
    if (event) event.preventDefault();
    previousFocus = document.activeElement;
    controls.classList.add('is-open');
    controls.setAttribute('aria-hidden', 'false');
    document.body.classList.add('settings-open');
    if (closeSettings) closeSettings.focus();
  }

  function hideSettings() {
    if (!controls) return;
    controls.classList.remove('is-open');
    controls.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('settings-open');
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  if (toolbarSettings && controls) toolbarSettings.addEventListener('click', openSettings);
  if (closeSettings) closeSettings.addEventListener('click', hideSettings);
  if (controls) controls.addEventListener('click', function (event) {
    if (event.target === controls) hideSettings();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && controls && controls.classList.contains('is-open')) hideSettings();
  });

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
