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

// Scroll-linked effects: header state, progress, parallax, section transitions
const parallax = [...document.querySelectorAll('[data-parallax]')];
const heroContent = document.querySelector('.hero__content');
const panels = [...document.querySelectorAll('.panel')];
const expanders = [...document.querySelectorAll('[data-expand]')];
const marquees = [...document.querySelectorAll('[data-marquee]')];
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
let ticking = false;

// Reveal on scroll. Positions are checked directly on each scroll frame
// instead of IntersectionObserver, which proved unreliable here.
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

let pending = [...document.querySelectorAll('.reveal, .reveal-group')];
const reveal = (el) => {
  el.classList.add('is-visible');
  if (!reduceMotion && ratingScore && el.contains(ratingScore)) countUp(ratingScore);
};
const checkReveals = () => {
  if (!pending.length) return;
  const trigger = window.innerHeight * 0.88;
  pending = pending.filter((el) => {
    if (reduceMotion || el.getBoundingClientRect().top < trigger) { reveal(el); return false; }
    return true;
  });
};

const onScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;

  header.classList.toggle('is-scrolled', y > 40);

  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  checkReveals();

  if (!reduceMotion) {
    const vh = window.innerHeight;
    parallax.forEach((el) => {
      const rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const offset = (rect.top + rect.height / 2 - vh / 2) * -parseFloat(el.dataset.parallax);
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });

    // Hero exit: content drifts up and fades, the scene darkens
    const h = clamp01(y / (vh * 0.8));
    heroContent.style.transform = `translate3d(0, ${(-h * 90).toFixed(1)}px, 0)`;
    heroContent.style.opacity = (1 - h * 1.1).toFixed(3);
    heroImg.style.filter = `brightness(${(1 - h * 0.55).toFixed(3)})`;

    // Panels rise and settle to full size as they enter
    panels.forEach((panel) => {
      const top = panel.getBoundingClientRect().top;
      const p = easeOut(clamp01((vh - top) / (vh * 0.65)));
      panel.style.transform = p >= 1 ? 'none' : `scale(${(0.93 + p * 0.07).toFixed(4)})`;
    });

    // Events: the inset card opens up to full width around mid-screen
    expanders.forEach((el) => {
      const r = el.getBoundingClientRect();
      const p = easeOut(clamp01((vh - r.top) / (vh * 0.75)));
      el.style.setProperty('--x', (1 - p).toFixed(3));
    });

    // Marquee rows slide with the scroll, in opposite directions
    marquees.forEach((row) => {
      const r = row.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const shift = (r.top - vh) * 0.35 * parseFloat(row.dataset.marquee);
      row.style.transform = `translate3d(calc(-25% + ${shift.toFixed(1)}px), 0, 0)`;
    });
  }
  ticking = false;
};

window.addEventListener('scroll', () => {
  checkReveals(); // cheap, and must never depend on a frame being painted
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
window.addEventListener('resize', onScroll);
window.addEventListener('load', onScroll);
onScroll();

// Mobile menu
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
nav.querySelectorAll('a').forEach((link, i) => link.style.setProperty('--i', i));

const setMenu = (open) => {
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
