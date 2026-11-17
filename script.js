const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('.header');
const progress = document.querySelector('.progress');

// Intro: start hero animations once the hero image is ready
const heroImg = document.querySelector('.hero__bg');
let started = false;
const start = () => {
  if (started) return;
  started = true;
  void document.body.offsetWidth; // commit initial styles so the intro transitions run
  document.body.classList.add('is-loaded');
};
if (!heroImg || heroImg.complete) start();
else {
  heroImg.addEventListener('load', start, { once: true });
  heroImg.addEventListener('error', start, { once: true });
  setTimeout(start, 1500); // never keep the page waiting on a slow image
}

// Scroll: header state, reveals, mobile action bar and (where CSS can't) the progress bar.
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
let barOn = null;
let ticking = false;
const update = () => {
  const y = window.scrollY;
  if ((y > 40) !== scrolled) { scrolled = y > 40; header.classList.toggle('is-scrolled', scrolled); }
  // mobile action bar: appears once the hero buttons have scrolled away
  const showBar = y > vh * 0.6;
  if (showBar !== barOn) { barOn = showBar; document.body.classList.toggle('has-callbar', showBar); }
  if (!cssScrollTimeline) progress.style.transform = `scaleX(${(y / maxScroll).toFixed(4)})`;
  checkReveals(y);
  ticking = false;
};

window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(update); ticking = true; }
}, { passive: true });

let resizeFrame;
const remeasure = () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => { measure(); update(); });
};
window.addEventListener('resize', remeasure);
window.addEventListener('load', remeasure);
if (document.fonts) document.fonts.ready.then(remeasure);
if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
measure();
update();

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
const navLinks = [...nav.querySelectorAll('a')];
navLinks.forEach((link, i) => link.style.setProperty('--i', i));
const isMobileNav = () => window.getComputedStyle(burger).display !== 'none';

let closingTimer;
const setMenu = (open) => {
  const wasOpen = header.classList.contains('is-open');
  if (open === wasOpen) return;
  clearTimeout(closingTimer);
  header.classList.remove('is-closing');
  if (!open) {
    // hold the solid header until the closing animation (see CSS) is over
    header.classList.add('is-closing');
    closingTimer = setTimeout(() => header.classList.remove('is-closing'), reduceMotion ? 0 : 1000);
  }
  header.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  document.documentElement.classList.toggle('menu-open', open);
  if (open) navLinks[0].focus({ preventScroll: true });
};

burger.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (!header.classList.contains('is-open')) return;
  if (e.key === 'Escape') { setMenu(false); burger.focus(); }
  // keep keyboard focus inside the open drawer
  if (e.key === 'Tab' && isMobileNav()) {
    const items = [...navLinks, burger];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
// rotating a tablet to landscape: the drawer must not stay open behind the desktop nav
window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

// Desktop nav: underline the section currently on screen
const spyLinks = navLinks.filter((a) => a.hash && a.hash !== '#top' && !a.classList.contains('btn'));
const spyTargets = spyLinks.map((a) => document.querySelector(a.hash)).filter(Boolean);
if ('IntersectionObserver' in window && spyTargets.length) {
  const visible = new Map();
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => visible.set(e.target, e.isIntersecting));
    const active = spyTargets.filter((t) => visible.get(t)).pop();
    spyLinks.forEach((a) => {
      const on = active && a.hash === `#${active.id}`;
      a.classList.toggle('is-active', !!on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  spyTargets.forEach((t) => spy.observe(t));
}

// Cards: soft light follows the pointer
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

document.getElementById('year').textContent = new Date().getFullYear();

// =========================================================
// Opening hours: read from the table in the footer, so the
// table stays the only place to edit. Times are taken in
// Italian time, whatever the visitor's time zone.
// =========================================================
const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fmt = (min) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const schedule = {}; // day (0 = Sunday) -> { open, close } in minutes, close may exceed 1440
document.querySelectorAll('.hours tr').forEach((row) => {
  const times = row.textContent.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (!times) { row.classList.add('is-closed'); return; }
  const open = toMin(times[1]);
  let close = toMin(times[2]);
  if (close <= open) close += 1440; // closes after midnight
  schedule[row.dataset.day] = { open, close };
});

const romeNow = () => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: Number(get('hour')) * 60 + Number(get('minute')) };
  } catch {
    const d = new Date();
    return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
  }
};

const getStatus = () => {
  const { day, min } = romeNow();
  const today = schedule[day];
  const yesterday = schedule[(day + 6) % 7];

  // still open from last night (e.g. Saturday at 00:30 is Friday's service)
  if (yesterday && yesterday.close > 1440 && min < yesterday.close - 1440) {
    return { open: true, closesIn: yesterday.close - 1440 - min, closeAt: yesterday.close };
  }
  if (today && min >= today.open && min < today.close) {
    return { open: true, closesIn: today.close - min, closeAt: today.close };
  }
  if (today && min < today.open) return { open: false, text: `apre alle ${fmt(today.open)}` };
  for (let i = 1; i <= 7; i++) {
    const next = schedule[(day + i) % 7];
    if (next) {
      const when = i === 1 ? 'domani' : DAY_NAMES[(day + i) % 7];
      return { open: false, text: `apre ${when} alle ${fmt(next.open)}` };
    }
  }
  return { open: false, text: '' };
};

const statusEls = document.querySelectorAll('[data-status]');
const renderStatus = () => {
  const s = getStatus();
  let label;
  let state;
  if (s.open && s.closesIn <= 60) { label = `Chiude a breve · alle ${fmt(s.closeAt)}`; state = 'soon'; }
  else if (s.open) { label = `Aperto ora · fino alle ${fmt(s.closeAt)}`; state = 'open'; }
  else { label = `Chiuso ora${s.text ? ' · ' + s.text : ''}`; state = 'closed'; }
  statusEls.forEach((el) => {
    el.dataset.state = state;
    el.querySelector('.status__text').textContent = label;
    el.hidden = false;
  });

  // "oggi" follows the service day: at 00:30 on Saturday, Friday's row is still the current one
  const { day, min } = romeNow();
  const y = schedule[(day + 6) % 7];
  const serviceDay = y && y.close > 1440 && min < y.close - 1440 ? (day + 6) % 7 : day;
  document.querySelectorAll('.hours tr').forEach((row) => {
    row.classList.toggle('is-today', row.dataset.day === String(serviceDay));
  });
};
renderStatus();
setInterval(renderStatus, 60 * 1000);

// =========================================================
// Gallery lightbox
// =========================================================
const lightbox = document.getElementById('lightbox');
const galleryItems = [...document.querySelectorAll('.gallery__item')];

if (lightbox && typeof lightbox.showModal === 'function' && galleryItems.length) {
  const lbImg = lightbox.querySelector('.lightbox__img');
  const lbCap = lightbox.querySelector('.lightbox__caption');
  let current = 0;
  let opener = null;

  const show = (i) => {
    current = (i + galleryItems.length) % galleryItems.length;
    const img = galleryItems[current].querySelector('img');
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = `${galleryItems[current].querySelector('figcaption')?.textContent || ''} · ${current + 1}/${galleryItems.length}`;
  };
  const open = (i) => {
    opener = galleryItems[i];
    show(i);
    lightbox.showModal();
    document.documentElement.classList.add('menu-open');
  };

  galleryItems.forEach((item, i) => {
    const caption = item.querySelector('figcaption')?.textContent || 'foto';
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Ingrandisci: ${caption}`);
    item.addEventListener('click', () => open(i));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  lightbox.querySelector('.lightbox__close').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('.lightbox__prev').addEventListener('click', () => show(current - 1));
  lightbox.querySelector('.lightbox__next').addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  lightbox.addEventListener('close', () => {
    document.documentElement.classList.remove('menu-open');
    opener?.focus({ preventScroll: true });
  });

  // swipe between photos on phones
  let x0 = null;
  lightbox.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}