// Shared behaviour for every page.

// 1. Header: give it a dark, blurred background once the page is scrolled,
//    so page text never runs underneath the menu. Also fade out the scroll-down arrow.
(function () {
  var header = document.querySelector('.site-header');
  var cue = document.querySelector('.scroll-cue');
  if (!header) return;
  function update() {
    var scrolled = window.scrollY > 40;
    header.classList.toggle('scrolled', scrolled);
    if (cue) cue.classList.toggle('hidden', scrolled);
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
})();

// 2. Photo gallery (Hobby page): swipe, arrows, dots, keyboard, and a gentle autoplay.
(function () {
  var gallery = document.querySelector('.gallery');
  if (!gallery) return;

  var track = gallery.querySelector('.gallery-track');
  var slides = Array.prototype.slice.call(track.querySelectorAll('.gallery-slide'));
  var dotsBox = gallery.querySelector('.gallery-dots');
  var prevBtn = gallery.querySelector('.gallery-btn.prev');
  var nextBtn = gallery.querySelector('.gallery-btn.next');
  var current = 0;
  var AUTOPLAY_MS = 7500;
  var timer = null;
  var userTookOver = false;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Dots
  var dots = slides.map(function (_, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show photo ' + (i + 1));
    b.addEventListener('click', function () { stopAutoplay(); goTo(i); });
    dotsBox.appendChild(b);
    return b;
  });

  function markCurrent(i) {
    current = i;
    dots.forEach(function (d, k) {
      if (k === i) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  }

  var programmatic = false;   // true while an arrow/dot/autoplay scroll is animating
  var settleTimer = null;

  function goTo(i) {
    var n = slides.length;
    i = ((i % n) + n) % n; // wrap around
    programmatic = true;
    markCurrent(i);
    track.scrollTo({ left: i * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () { programmatic = false; }, 900);
  }

  // Keep the dots in sync when the visitor swipes
  track.addEventListener('scroll', function () {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      programmatic = false;
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i >= 0 && i < slides.length) markCurrent(i);
    }, 120);
    if (programmatic) return;
    var live = Math.round(track.scrollLeft / track.clientWidth);
    if (live !== current && live >= 0 && live < slides.length) markCurrent(live);
  }, { passive: true });

  prevBtn.addEventListener('click', function () { stopAutoplay(); goTo(current - 1); });
  nextBtn.addEventListener('click', function () { stopAutoplay(); goTo(current + 1); });

  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); stopAutoplay(); goTo(current + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); stopAutoplay(); goTo(current - 1); }
  });

  // Autoplay: stops for good once the visitor swipes or clicks,
  // pauses while hovered, and never runs for people who prefer reduced motion.
  function startAutoplay() {
    if (reduceMotion || userTookOver || timer) return;
    timer = setInterval(function () { goTo(current + 1); }, AUTOPLAY_MS);
  }
  function pauseAutoplay() {
    clearInterval(timer);
    timer = null;
  }
  function stopAutoplay() {
    userTookOver = true;
    pauseAutoplay();
  }

  track.addEventListener('touchstart', stopAutoplay, { passive: true });
  track.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stopAutoplay(); }, { passive: true });
  gallery.addEventListener('mouseenter', pauseAutoplay);
  gallery.addEventListener('mouseleave', startAutoplay);
  gallery.addEventListener('focusin', pauseAutoplay);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pauseAutoplay(); else startAutoplay();
  });

  // Keep the current photo in place when the screen rotates or resizes
  window.addEventListener('resize', function () {
    track.scrollTo({ left: current * track.clientWidth, behavior: 'instant' });
  });

  markCurrent(0);
  startAutoplay();
})();
