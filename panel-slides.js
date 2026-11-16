/* The Swarm AI panel page: a slideshow of the panel's screens, made-up data, under the video (Nikos, 16/11). A public
   file, so the pictures and their captions can change without opening the locked page: the page holds
   <section data-slides data-src="/shots/panel/slides.json"></section> and loads this script. The list is
   [{ "img": {"el": "...", "en": "..."}, "alt": {"el": "...", "en": "..."}, "cap": {"el": "...", "en": "..."} }].
   It turns by itself every few seconds, stops for good once someone uses it, and never moves with reduced motion. */
(function () {
  'use strict';
  var box = document.querySelector('[data-slides]');
  if (!box) return;
  var lang = (document.documentElement.lang || 'en').slice(0, 2) === 'el' ? 'el' : 'en';
  var T = lang === 'el'
    ? { prev: 'Προηγούμενη εικόνα', next: 'Επόμενη εικόνα', go: 'Εικόνα ', of: ' από ', name: 'Οθόνες του πίνακα' }
    : { prev: 'Previous picture', next: 'Next picture', go: 'Picture ', of: ' of ', name: 'Screens of the panel' };
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  var css = document.createElement('style');
  css.textContent =
    '.ps{margin:18px 0 6px}' +
    '.ps__stage{position:relative;overflow:hidden;border-radius:12px;background:#08283a;box-shadow:0 14px 40px rgba(0,0,0,.35);aspect-ratio:16/10}' +
    '.ps__slide{position:absolute;inset:0;margin:0;opacity:0;transition:opacity .45s ease;visibility:hidden}' +
    '.ps__slide.is-on{opacity:1;visibility:visible}' +
    '.ps__slide img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}' +
    '.ps__cap{margin:10px 2px 0;min-height:3em;font-size:15.5px;line-height:1.45;color:#ffe2c8}' +
    '.ps__nav{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:8px}' +
    '.ps__btn{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(255,247,234,.5);' +
    'background:rgba(255,247,234,.06);color:#fff7ea;font:inherit;font-size:20px;line-height:1;cursor:pointer}' +
    '.ps__btn:hover,.ps__btn:focus-visible{background:rgba(242,139,60,.25);border-color:#f28b3c}' +
    '.ps__dots{display:flex;gap:6px}' +
    '.ps__dot{width:10px;height:10px;padding:0;border-radius:50%;border:1.5px solid rgba(255,247,234,.6);background:none;cursor:pointer}' +
    '.ps__dot[aria-current="true"]{background:#f28b3c;border-color:#f28b3c}' +
    '.ps__btn:focus-visible,.ps__dot:focus-visible{outline:3px solid #ffd27a;outline-offset:2px}' +
    '@media (prefers-reduced-motion: reduce){.ps__slide{transition:none}}';
  document.head.appendChild(css);

  fetch(box.getAttribute('data-src') || '/shots/panel/slides.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(build)
    .catch(function () { box.hidden = true; });

  function pick(o) { return o ? (o[lang] || o.en || o.el || '') : ''; }

  function build(list) {
    if (!list || !list.length) { box.hidden = true; return; }
    box.classList.add('ps');
    box.setAttribute('aria-roledescription', lang === 'el' ? 'προβολή εικόνων' : 'carousel');
    box.setAttribute('aria-label', T.name);
    var stage = document.createElement('div'); stage.className = 'ps__stage';
    var cap = document.createElement('p'); cap.className = 'ps__cap'; cap.setAttribute('aria-live', 'off');
    var nav = document.createElement('div'); nav.className = 'ps__nav';
    var prev = button('ps__btn', '‹', T.prev), next = button('ps__btn', '›', T.next);
    var dots = document.createElement('div'); dots.className = 'ps__dots';
    var slides = list.map(function (s, i) {
      var fig = document.createElement('figure'); fig.className = 'ps__slide';
      fig.setAttribute('role', 'group'); fig.setAttribute('aria-roledescription', lang === 'el' ? 'εικόνα' : 'slide');
      fig.setAttribute('aria-label', (i + 1) + T.of + list.length);
      var img = document.createElement('img');
      img.src = pick(s.img); img.alt = pick(s.alt) || pick(s.cap); img.decoding = 'async';
      if (i > 0) img.loading = 'lazy';
      img.width = 1280; img.height = 800;
      fig.appendChild(img); stage.appendChild(fig);
      var d = button('ps__dot', '', T.go + (i + 1) + T.of + list.length);
      d.addEventListener('click', function () { stop(); show(i); });
      dots.appendChild(d);
      return fig;
    });
    nav.appendChild(prev); nav.appendChild(dots); nav.appendChild(next);
    box.appendChild(stage); box.appendChild(cap); box.appendChild(nav);

    var cur = 0, timer = 0;
    function show(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (f, j) { f.classList.toggle('is-on', j === cur); f.setAttribute('aria-hidden', j === cur ? 'false' : 'true'); });
      Array.prototype.forEach.call(dots.children, function (d, j) { d.setAttribute('aria-current', j === cur ? 'true' : 'false'); });
      cap.textContent = pick(list[cur].cap);
    }
    function stop() { clearInterval(timer); timer = 0; cap.setAttribute('aria-live', 'polite'); }
    function play() { if (still && still.matches) return; timer = setInterval(function () { show(cur + 1); }, 5000); }
    prev.addEventListener('click', function () { stop(); show(cur - 1); });
    next.addEventListener('click', function () { stop(); show(cur + 1); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { stop(); show(cur - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { stop(); show(cur + 1); e.preventDefault(); }
    });
    box.addEventListener('mouseenter', function () { if (timer) { clearInterval(timer); timer = -1; } });
    box.addEventListener('mouseleave', function () { if (timer === -1) { timer = 0; play(); } });
    // a swipe on touch screens
    var x0 = null;
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (x0 === null) return; var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { stop(); show(cur + (dx < 0 ? 1 : -1)); }
    });
    show(0); play();
  }

  function button(cls, text, label) {
    var b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = text;
    b.setAttribute('aria-label', label); return b;
  }
})();
