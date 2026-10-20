"use strict";
/* Apply the theme in <head>, before stylesheets and first body paint.
 * An unavailable storage backend degrades to an in-page preference.
 * Source blocks, trace frames and algorithm state are never changed. */
(function themeToggle() {
  var KEY = 'comp2521-tracer:theme';
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (error) { /* optional storage */ }
  if (choice !== 'dark' && choice !== 'light') choice = null;

  function resolve() { return choice || (media && media.matches ? 'dark' : 'light'); }
  function persist() {
    try {
      if (choice === null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, choice);
    } catch (error) { /* keep the explicit in-page choice */ }
  }
  function syncControls(theme) {
    var button = document.getElementById('themeBtn');
    if (button) {
      button.setAttribute(button.getAttribute('role') === 'menuitemcheckbox' ? 'aria-checked' : 'aria-pressed', String(theme === 'dark'));
      button.textContent = 'Dark mode';
      button.title = theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme';
    }
    var systemButton = document.getElementById('themeSystemBtn');
    if (systemButton) {
      systemButton.textContent = choice === null ? 'Using system theme' : 'Use system theme';
      systemButton.title = choice === null ? 'The theme follows your system setting' : 'Follow your system setting';
    }
  }
  function apply() {
    var theme = resolve();
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#12100D' : '#FFA500');
    syncControls(theme);
    return theme;
  }
  function set(theme) {
    if (theme !== 'dark' && theme !== 'light') throw new TypeError('Theme must be dark or light');
    choice = theme; persist(); return apply();
  }
  function followSystem() { choice = null; persist(); return apply(); }
  apply();
  if (media) {
    var changed = function () { if (choice === null) apply(); };
    if (typeof media.addEventListener === 'function') media.addEventListener('change', changed);
    else if (typeof media.addListener === 'function') media.addListener(changed);
  }
  window.addEventListener('storage', function (event) {
    if (event.key !== KEY && event.key !== null) return;
    choice = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : null;
    apply();
  });
  function wire() {
    syncControls(resolve());
    var button = document.getElementById('themeBtn');
    if (button) button.addEventListener('click', function () {
      var theme = set(resolve() === 'dark' ? 'light' : 'dark');
      var status = document.getElementById('status') || document.getElementById('searchStatus');
      if (status) status.textContent = theme === 'dark' ? 'Dark theme on' : 'Light theme on';
    });
    var systemButton = document.getElementById('themeSystemBtn');
    if (systemButton) systemButton.addEventListener('click', function () { followSystem(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire, {once:true});
  else wire();
  window.COMP2521Theme = Object.freeze({
    current: function () { return root.getAttribute('data-theme'); },
    preference: function () { return choice; }, set:set, followSystem:followSystem
  });
})();
