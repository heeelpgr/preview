/* The hub's cards play their short clip while hovered or focused, as on heeelp.eu (Nikos, 16/11). A public file, so it
   can change without opening the locked pages: the hub only loads it with <script src="/hub-motion.js" defer>.
   Nothing loads until a card is hovered; nothing moves on touch screens, with reduced motion, or for a card that has no
   clip. The clips are the public ones in /clips. */
(function () {
  'use strict';
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var hover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');
  if ((still && still.matches) || (hover && !hover.matches)) return;

  var BASE = 'https://samples.heeelp.eu/clips/';
  var lang = (document.documentElement.lang || 'en').slice(0, 2) === 'el' ? 'el' : 'en';
  // the clip of each demo; the video card plays the overview, omics and panel have one per language
  function clipFor(key, lng) {
    if (key === 'video') return BASE + 'all-' + lng + '.mp4';
    if (key === 'omics' || key === 'panel') return BASE + key + '-' + lng + '.mp4';
    if (key === 'copd' || key === 'dicom' || key === 'iot' || key === 'rehab') return BASE + key + '.mp4';
    return null;
  }

  var css = document.createElement('style');
  css.textContent = '.thumb.hm-box{position:relative}' +
    '.hm-clip{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;opacity:0;' +
    'transition:opacity .25s ease;pointer-events:none}.hm-clip.hm-on{opacity:1}';
  document.head.appendChild(css);

  Array.prototype.forEach.call(document.querySelectorAll('.card'), function (card) {
    var thumb = card.querySelector('a.thumb');
    if (!thumb) return;
    var href = thumb.getAttribute('href') || '';
    var m = /(?:^|\/)s\/([a-z0-9]+?)(-en)?\/?(?:#|$)/.exec(href);
    // the physiotherapy demo lives at /rehab/, outside s/ (18/11)
    var key = m ? m[1] : (/(?:^|\/)rehab\/?(?:#|$)/.test(href) ? 'rehab' : null);
    if (!key) return;
    var src = clipFor(key, m && m[2] ? 'en' : lang);
    if (!src) return;
    var video = null;
    thumb.classList.add('hm-box');
    function start() {
      if (still && still.matches) return;
      if (!video) {
        video = document.createElement('video');
        video.className = 'hm-clip';
        video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
        video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true');
        video.setAttribute('disablepictureinpicture', ''); video.setAttribute('controlslist', 'nodownload');
        video.src = src;
        video.addEventListener('playing', function () { video.classList.add('hm-on'); });
        video.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        thumb.appendChild(video);
      }
      var p = video.play(); if (p && p.catch) p.catch(function () {});
    }
    function stop() {
      if (!video) return;
      video.pause(); video.classList.remove('hm-on');
      try { video.currentTime = 0; } catch (e) {}
    }
    card.addEventListener('mouseenter', start);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('focusin', start);
    card.addEventListener('focusout', function (e) { if (!card.contains(e.relatedTarget)) stop(); });
  });
})();
