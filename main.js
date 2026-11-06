/* Stefi Saraili — page behaviour. Everything here is progressive: the page reads fine without it. */

document.documentElement.classList.add('js'); // hides .reveal items only once this script is running

/* ------------------------------------------------------------------
   INSTAGRAM REELS — @s2hairstories
   To add a reel: copy its link from Instagram (…/reel/CODE/), paste the
   CODE below, and pick a shade: blonde | brunette | copper | cut.
   ------------------------------------------------------------------ */
const INSTAGRAM = 's2hairstories';
const REELS = [
  { code: 'DfXfTc8I9BV', shade: 'copper',   title: 'A touch of magic' },
  { code: 'DfKt118oSsa', shade: 'blonde',   title: 'Not just blonde, a whole mood' },
  { code: 'DfFmLuNokZy', shade: 'brunette', title: 'Brunette, worn with ease' },
  { code: 'DeuPKQ8odzd', shade: 'blonde',   title: 'Dimensional beige blonde' },
  { code: 'De33okTzEG3', shade: 'copper',   title: 'A little contrast, a lot of character' },
  { code: 'DehXWITInsa', shade: 'blonde',   title: 'The blonde. The waves.' },
  { code: 'DePNYzmI9Fr', shade: 'cut',      title: 'New cut, new colour' },
  { code: 'DeKFi91I0NH', shade: 'blonde',   title: 'From deep brunette to dreamy blonde' },
  { code: 'Dd9KRQFok_i', shade: 'copper',   title: 'Copper season' },
  { code: 'Dd3_sUbo0nd', shade: 'cut',      title: 'Elegance in every detail' },
  { code: 'Ddvm52roBAo', shade: 'brunette', title: 'A perfectly blended balayage' },
];
const SHADE_SERVICE = {
  blonde: 'Blonde highlights',
  brunette: 'Balayage',
  copper: 'Copper & fashion shades',
  cut: 'Creative cut',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Reels ---------- */
const frames = new Map(); // iframe window -> iframe element, for Instagram's height messages

(() => {
  const box = document.getElementById('reels');
  if (!box) return;

  REELS.forEach((r) => {
    const fig = document.createElement('figure');
    fig.className = 'reel';
    fig.dataset.shade = r.shade;
    fig.dataset.code = r.code;
    const url = `https://www.instagram.com/reel/${r.code}/`;
    fig.innerHTML = `
      <a class="reel-ph" href="${url}" target="_blank" rel="noopener">
        <img src="assets/reels/${r.code}.jpg" alt="" width="461" height="820" decoding="async">
        <b>${r.title}</b><span>Watch on Instagram</span>
      </a>
      <figcaption class="sr-only">${r.title}</figcaption>`;
    box.appendChild(fig);
  });

  const noEmbed = new URLSearchParams(location.search).has('noembed'); // for offline layout checks
  const load = (fig) => {
    if (fig.dataset.loaded || noEmbed) return;
    fig.dataset.loaded = '1';
    const title = fig.querySelector('figcaption')?.textContent || 'Instagram reel';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.instagram.com/reel/${fig.dataset.code}/embed/`;
    iframe.title = `Instagram reel by @${INSTAGRAM}: ${title}`;
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; clipboard-write';
    iframe.setAttribute('scrolling', 'no');
    // keep the cover photo up until Instagram says the player is drawn (MEASURE below); fallback after load
    iframe.addEventListener('load', () => setTimeout(() => fig.classList.add('is-loaded'), 6000));
    fig.prepend(iframe);
    requestAnimationFrame(() => frames.set(iframe.contentWindow, iframe));
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '600px 0px' });
  box.querySelectorAll('.reel').forEach((f) => io.observe(f));

  // Instagram's embed posts its real height; size each frame to fit.
  window.addEventListener('message', (e) => {
    if (e.origin !== 'https://www.instagram.com') return;
    let data = e.data;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch { return; }
    if (data?.type !== 'MEASURE' || !data.details?.height) return;
    const iframe = frames.get(e.source);
    if (iframe) {
      iframe.style.height = `${Math.ceil(data.details.height)}px`;
      iframe.parentElement.style.minHeight = '0';
      setTimeout(() => iframe.parentElement.classList.add('is-loaded'), 400);
    }
  });

  // Pick a shade: see that work, and the booking form takes the matching service.
  const buttons = [...document.querySelectorAll('.shade')];
  const service = document.getElementById('f-service');
  buttons.forEach((btn) => btn.addEventListener('click', () => {
    const shade = btn.dataset.shade;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    box.querySelectorAll('.reel').forEach((f) => {
      const show = shade === 'all' || f.dataset.shade === shade;
      f.hidden = !show;
      if (show) load(f);
    });
    if (service && SHADE_SERVICE[shade]) service.value = SHADE_SERVICE[shade];
  }));
})();

/* ---------- Booking: compose the request, send it via Instagram DM ---------- */
(() => {
  const form = document.getElementById('book-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const day = form.querySelector('#f-day');
  if (day) day.min = new Date().toISOString().slice(0, 10);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    let ok = true;
    ['name', 'phone'].forEach((n) => {
      const el = form.elements[n];
      const bad = !String(f.get(n) || '').trim();
      el.setAttribute('aria-invalid', String(bad));
      if (bad && ok) { el.focus(); ok = false; }
    });
    if (!ok) { status.textContent = 'Please add your name and phone so we can confirm.'; return; }

    const when = f.get('day') ? new Date(f.get('day')).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : 'any day';
    const msg = [
      `Hi Stefi! I'd like to book: ${f.get('service')}.`,
      `When: ${when}, ${String(f.get('time')).toLowerCase()}.`,
      `Name: ${f.get('name')} · Phone: ${f.get('phone')}`,
      f.get('note') ? `Note: ${f.get('note')}` : '',
    ].filter(Boolean).join('\n');

    const win = window.open(`https://ig.me/m/${INSTAGRAM}`, '_blank', 'noopener');
    try {
      await navigator.clipboard.writeText(msg);
      status.textContent = 'Your request is copied. Paste it into the Instagram chat and send.';
    } catch {
      status.textContent = 'Instagram is opening. Tell us the service, day and your phone in the chat.';
    }
    if (!win) location.href = `https://ig.me/m/${INSTAGRAM}`;
  });
})();

/* ---------- Entrances: heading, then text, then the rest ---------- */
(() => {
  const els = [...document.querySelectorAll('.reveal')];
  if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
  document.querySelectorAll('section, footer').forEach((sec) => {
    sec.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 6) * 80}ms`));
  });
  // Plain scroll check rather than IntersectionObserver: it also fires when the page
  // is jumped to an anchor or scrolled programmatically, so nothing can stay hidden.
  let pending = [...els, ...document.querySelectorAll('.verb')];
  const check = () => {
    const limit = window.innerHeight * 0.94;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('is-in'); return false; }
      return true;
    });
    if (!pending.length) window.removeEventListener('scroll', onScroll);
  };
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { check(); ticking = false; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  check();
})();
