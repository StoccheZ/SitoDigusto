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

// Scroll: header state, reveals and (where CSS can't) the progress bar.
// All scroll-linked motion (hero, sections, marquee, parallax) lives in CSS
// scroll timelines, so nothing here moves elements while you scroll.
const cssScrollTimeline = window.CSS && CSS.supports('animation-timeline: scroll()');

document.querySelectorAll('[data-stagger]').forEach((group) => {
  [...group.children].forEach((child, i) => child.style.setProperty('--d', `${i * 0.06}s`));
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

// positions are measured once (and on resize) so scrolling never reads layout
let reveals = [...document.querySelectorAll('.reveal, .reveal-group')].map((el) => ({ el, top: 0 }));
let vh = window.innerHeight;
let maxScroll = 1;

const measure = () => {
  vh = window.innerHeight;
  maxScroll = Math.max(document.documentElement.scrollHeight - vh, 1);
  const y = window.scrollY;
  reveals.forEach((o) => { o.top = o.el.getBoundingClientRect().top + y; });
};

const checkReveals = (y) => {
  if (!reveals.length) return;
  const line = y + vh * 0.9;
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
let ticking = false;
const update = () => {
  const y = window.scrollY;
  if ((y > 40) !== scrolled) { scrolled = y > 40; header.classList.toggle('is-scrolled', scrolled); }
  if (!cssScrollTimeline) progress.style.transform = `scaleX(${(y / maxScroll).toFixed(4)})`;
  checkReveals(y);
  ticking = false;
};

window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(update); ticking = true; }
  checkReveals(window.scrollY);
}, { passive: true });

const remeasure = () => { measure(); update(); };
window.addEventListener('resize', remeasure);
window.addEventListener('load', remeasure);
if (document.fonts) document.fonts.ready.then(remeasure);
if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
remeasure();

// "Torna su" and the logo: always scroll to the very top
document.querySelectorAll('a[href="#top"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

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

