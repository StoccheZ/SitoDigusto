const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('.header');
const progress = document.querySelector('.progress');

// Intro: start hero animations once the hero image is ready
const heroImg = document.querySelector('.hero__bg');
const start = () => {
  void document.body.offsetWidth; // commit initial styles so the intro transitions run
  document.body.classList.add('is-loaded');
};
if (heroImg.complete) start();
else {
  heroImg.addEventListener('load', start, { once: true });
  setTimeout(start, 1500); // never keep the page waiting on a slow image
}

// Scroll-linked effects: header state, progress, reveals, parallax, section transitions.
// Performance: element positions are measured once (and again on resize), so each
// frame only does math on scrollY and writes transform/opacity, which the GPU
// composites without repainting.
const heroContent = document.querySelector('.hero__content');
const heroShade = document.querySelector('.hero__shade');
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

document.querySelectorAll('[data-stagger]').forEach((group) => {
  [...group.children].forEach((child, i) => child.style.setProperty('--d', `${i * 0.12}s`));
});
document.querySelectorAll('.reveal-group').forEach((group) => {
  [...group.children].forEach((child, i) => child.style.setProperty('--i', i));
});

const ratingScore = document.querySelector('[data-count]');
const countUp = (el) => {
  const target = parseFloat(el.dataset.count);
  const duration = 1400;
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = (target * eased).toFixed(1).replace('.', ',');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const tracked = (selector, extra = {}) =>
  [...document.querySelectorAll(selector)].map((el) => ({ el, top: 0, height: 0, ...extra }));

let reveals = tracked('.reveal, .reveal-group');
const parallax = tracked('[data-parallax]').map((o) => ({ ...o, speed: parseFloat(o.el.dataset.parallax) }));
const panels = tracked('.panel');
const expanders = tracked('[data-expand]');
const marquees = tracked('[data-marquee]').map((o) => ({ ...o, dir: parseFloat(o.el.dataset.marquee) }));
let vh = window.innerHeight;
let maxScroll = 1;

const measure = () => {
  vh = window.innerHeight;
  maxScroll = Math.max(document.documentElement.scrollHeight - vh, 1);
  const y = window.scrollY;
  // parallax layers are measured through their (untransformed) section
  parallax.forEach((o) => { const r = o.el.parentElement.getBoundingClientRect(); o.top = r.top + y; o.height = r.height; });
  [reveals, panels, expanders, marquees].forEach((list) => list.forEach((o) => {
    const r = o.el.getBoundingClientRect();
    o.top = r.top + y;
    o.height = r.height;
  }));
};

const checkReveals = (y) => {
  if (!reveals.length) return;
  const line = y + vh * 0.88;
  reveals = reveals.filter((o) => {
    if (reduceMotion || o.top < line) {
      o.el.classList.add('is-visible');
      if (!reduceMotion && ratingScore && o.el.contains(ratingScore)) countUp(ratingScore);
      return false;
    }
    return true;
  });
};

let scrolled = null;
const update = () => {
  const y = window.scrollY;

  if ((y > 40) !== scrolled) { scrolled = y > 40; header.classList.toggle('is-scrolled', scrolled); }
  progress.style.transform = `scaleX(${(y / maxScroll).toFixed(4)})`;
  checkReveals(y);

  if (!reduceMotion) {
    // Hero exit: content drifts up and fades, a shade darkens the photo
    if (y < vh * 1.2) {
      const h = clamp01(y / (vh * 0.8));
      heroContent.style.transform = `translate3d(0, ${(-h * 90).toFixed(1)}px, 0)`;
      heroContent.style.opacity = Math.max(1 - h * 1.1, 0).toFixed(3);
      heroShade.style.opacity = (h * 0.55).toFixed(3);
    }

    parallax.forEach((o) => {
      const top = o.top - y;
      if (top > vh || top + o.height < 0) return;
      const offset = (top + o.height / 2 - vh / 2) * -o.speed;
      o.el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });

    // Panels rise and settle to full size as they enter
    panels.forEach((o) => {
      const p = easeOut(clamp01((vh - (o.top - y)) / (vh * 0.65)));
      if (p === o.last) return;
      o.last = p;
      o.el.style.transform = `scale(${(0.93 + p * 0.07).toFixed(4)})`;
    });

    // Events: the inset card grows to full width
    expanders.forEach((o) => {
      const p = easeOut(clamp01((vh - (o.top - y)) / (vh * 0.75)));
      if (p === o.last) return;
      o.last = p;
      o.el.style.transform = `scale(${(0.92 + p * 0.08).toFixed(4)})`;
    });

    // Marquee rows slide with the scroll, in opposite directions
    marquees.forEach((o) => {
      const top = o.top - y;
      if (top > vh || top + o.height < 0) return;
      const shift = (top - vh) * 0.35 * o.dir;
      o.el.style.transform = `translate3d(calc(-25% + ${shift.toFixed(1)}px), 0, 0)`;
    });
  }
  ticking = false;
};

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(update); ticking = true; }
  checkReveals(window.scrollY); // cheap: no layout reads
}, { passive: true });

const remeasure = () => { measure(); update(); };
window.addEventListener('resize', remeasure);
window.addEventListener('load', remeasure);
if (document.fonts) document.fonts.ready.then(remeasure);
if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
remeasure();

// Mobile menu
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
nav.querySelectorAll('a').forEach((link, i) => link.style.setProperty('--i', i));

let closingTimer;
const setMenu = (open) => {
  const wasOpen = header.classList.contains('is-open');
  clearTimeout(closingTimer);
  header.classList.remove('is-closing');
  if (!open && wasOpen) {
    // hold the solid header until the closing animation (see CSS) is over
    header.classList.add('is-closing');
    closingTimer = setTimeout(() => header.classList.remove('is-closing'), reduceMotion ? 0 : 1000);
  }
  header.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  document.body.style.overflow = open ? 'hidden' : '';
};

burger.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// Cards: soft light follows the pointer
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

document.getElementById('year').textContent = new Date().getFullYear();

// Opening hours: highlight today and closed days
document.querySelectorAll('.hours tr').forEach((row) => {
  if (row.dataset.day === String(new Date().getDay())) row.classList.add('is-today');
  if (/chiuso/i.test(row.textContent)) row.classList.add('is-closed');
});

// Map: load it in the background once the page is ready, so it is already
// drawn when the visitor scrolls down; fade it in when Google has rendered it.
const mapFrame = document.querySelector('.footer__map iframe[data-src]');
if (mapFrame) {
  mapFrame.addEventListener('load', () => mapFrame.classList.add('is-ready'), { once: true });
  const loadMap = () => { if (!mapFrame.src) mapFrame.src = mapFrame.dataset.src; };
  const whenIdle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 800));
  if (document.readyState === 'complete') whenIdle(loadMap);
  else window.addEventListener('load', () => whenIdle(loadMap), { once: true });
  setTimeout(loadMap, 4000); // safety net
}
