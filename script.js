/**
 * script.js — Bouncing, wobbling image
 *
 * Finds <img id="img"> on the page and slowly moves it around the viewport,
 * rotating, stretching and squashing it, bouncing off the viewport edges.
 *
 * CONFIGURATION (any of these, later ones win):
 *   1. Edit DEFAULTS below.
 *   2. Define a global before this script loads:
 *        <script>window.IMG_BOUNCE_CONFIG = { moveSpeed: 200, rotateSpeed: 45 };</script>
 *   3. data-* attributes on the image (camelCase keys become kebab-case):
 *        <img id="img" src="..." data-move-speed="200" data-rotate-speed="45">
 *   4. At runtime:  window.imgBounce.set({ moveSpeed: 300 })
 *
 * RUNTIME API (window.imgBounce):
 *   .set(options)  – change any config option on the fly
 *   .pause() / .resume() / .toggle()
 *   .config        – the live config object
 */
(function () {
  'use strict';

  var DEFAULTS = {
    // Global time multiplier for everything (0.5 = half speed, 2 = double).
    animationSpeed: 1,

    // Movement speed in pixels per second.
    moveSpeed: 120,
    // Initial direction in degrees (0 = right, 90 = down). null = random.
    direction: null,

    // Rotation speed in degrees per second (negative = counter-clockwise).
    rotateSpeed: 20,

    // Stretch/squash wobble: 0.25 means scale oscillates between 0.75 and 1.25.
    stretchAmount: 0.2,
    // Wobble cycles per second.
    stretchSpeed: 0.3,
    // Base scale of the image.
    scale: 1,

    // Distance in pixels from the viewport edge to treat as the wall.
    edgePadding: 0,

    // Stay still if the user's OS requests reduced motion.
    respectReducedMotion: true,

    // z-index applied to the image while it floats.
    zIndex: 9999
  };

  function readDataAttributes(el) {
    var out = {};
    Object.keys(DEFAULTS).forEach(function (key) {
      var raw = el.dataset[key];
      if (raw === undefined) return;
      if (raw === 'true' || raw === 'false') out[key] = raw === 'true';
      else if (raw === 'null') out[key] = null;
      else if (!isNaN(parseFloat(raw))) out[key] = parseFloat(raw);
    });
    return out;
  }

  function init() {
    var img = document.getElementById('img');
    if (!img || img.tagName !== 'IMG') return;

    var config = Object.assign({}, DEFAULTS, window.IMG_BOUNCE_CONFIG || {}, readDataAttributes(img));

    if (config.respectReducedMotion &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (img.complete && img.naturalWidth) start(img, config);
    else img.addEventListener('load', function () { start(img, config); }, { once: true });
  }

  function start(img, config) {
    // Measure at the current rendered size before pulling it out of the flow.
    var rect = img.getBoundingClientRect();
    var baseW = rect.width || img.naturalWidth;
    var baseH = rect.height || img.naturalHeight;

    img.style.position = 'fixed';
    img.style.left = '0';
    img.style.top = '0';
    img.style.margin = '0';
    img.style.width = baseW + 'px';
    img.style.height = baseH + 'px';
    img.style.maxWidth = 'none';
    img.style.zIndex = String(config.zIndex);
    img.style.transformOrigin = '50% 50%';
    img.style.willChange = 'transform';
    img.style.pointerEvents = 'none';

    var dirDeg = config.direction == null ? Math.random() * 360 : config.direction;
    var dirRad = dirDeg * Math.PI / 180;

    var state = {
      // Centre position, starting where the image originally sat.
      x: rect.left + baseW / 2,
      y: rect.top + baseH / 2,
      dx: Math.cos(dirRad),   // unit direction vector
      dy: Math.sin(dirRad),
      angle: 0,               // degrees
      phase: 0,               // wobble phase (radians)
      running: true,
      last: null
    };

    // Half-size of the rotated + scaled image's axis-aligned bounding box.
    function extents(sx, sy) {
      var r = state.angle * Math.PI / 180;
      var c = Math.abs(Math.cos(r));
      var s = Math.abs(Math.sin(r));
      var w = baseW * sx;
      var h = baseH * sy;
      return { hw: (w * c + h * s) / 2, hh: (w * s + h * c) / 2 };
    }

    function frame(now) {
      if (!state.running) return;
      if (state.last == null) state.last = now;
      // Clamp dt so switching tabs doesn't cause a huge jump.
      var dt = Math.min((now - state.last) / 1000, 0.05) * config.animationSpeed;
      state.last = now;

      // Move.
      state.x += state.dx * config.moveSpeed * dt;
      state.y += state.dy * config.moveSpeed * dt;

      // Rotate.
      state.angle = (state.angle + config.rotateSpeed * dt) % 360;

      // Wobble: stretch one axis while squashing the other.
      state.phase += config.stretchSpeed * 2 * Math.PI * dt;
      var wobble = Math.sin(state.phase) * config.stretchAmount;

      var sx = config.scale * (1 + wobble);
      var sy = config.scale * (1 - wobble);

      // Collide with viewport edges.
      var vw = document.documentElement.clientWidth;
      var vh = document.documentElement.clientHeight;
      var pad = config.edgePadding;
      var e = extents(sx, sy);

      if (e.hw * 2 >= vw - pad * 2) {
        state.x = vw / 2; // larger than the viewport: keep centred
      } else if (state.x - e.hw < pad) {
        state.x = pad + e.hw; state.dx = Math.abs(state.dx);
      } else if (state.x + e.hw > vw - pad) {
        state.x = vw - pad - e.hw; state.dx = -Math.abs(state.dx);
      }

      if (e.hh * 2 >= vh - pad * 2) {
        state.y = vh / 2;
      } else if (state.y - e.hh < pad) {
        state.y = pad + e.hh; state.dy = Math.abs(state.dy);
      } else if (state.y + e.hh > vh - pad) {
        state.y = vh - pad - e.hh; state.dy = -Math.abs(state.dy);
      }

      // Rotation is applied before scale so the stretch follows the image's own axes.
      img.style.transform =
        'translate(' + (state.x - baseW / 2) + 'px,' + (state.y - baseH / 2) + 'px) ' +
        'rotate(' + state.angle + 'deg) ' +
        'scale(' + sx + ',' + sy + ')';

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

    window.imgBounce = {
      config: config,
      set: function (opts) {
        Object.assign(config, opts || {});
        if (opts && opts.direction != null) {
          var r = opts.direction * Math.PI / 180;
          state.dx = Math.cos(r);
          state.dy = Math.sin(r);
        }
      },
      pause: function () { state.running = false; },
      resume: function () {
        if (state.running) return;
        state.running = true;
        state.last = null;
        requestAnimationFrame(frame);
      },
      toggle: function () { state.running ? this.pause() : this.resume(); }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
