(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width:720px), (pointer:coarse)').matches;
  const rand = Math.random, pick = (a) => a[(rand() * a.length) | 0];

  const fxC = $('#fx'), emC = $('#embers');
  const fx = fxC.getContext('2d'), em = emC.getContext('2d');
  let W = 0, H = 0, started = false;

  /* ---------- canvas sizing (DPR capped for mobile performance) ---------- */
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    W = innerWidth; H = innerHeight;
    for (const [c, x] of [[fxC, fx], [emC, em]]) {
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (reduce.matches) drawEmbers(0);
  }
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });

  /* ---------- floating gold embers ---------- */
  const embers = [];
  function makeEmbers() {
    const n = mobile ? 28 : 56;
    for (let i = 0; i < n; i++) embers.push({
      x: rand() * W, y: rand() * H, r: 0.6 + rand() * 1.8,
      vy: -(0.12 + rand() * 0.4), vx: (rand() - 0.5) * 0.2, ph: rand() * 6.28, a: 0.35 + rand() * 0.5
    });
  }
  function drawEmbers(dt, t = 0) {
    em.clearRect(0, 0, W, H);
    for (const e of embers) {
      e.y += e.vy * dt; e.x += (e.vx + Math.sin(t * 0.001 + e.ph) * 0.15) * dt;
      if (e.y < -10) { e.y = H + 10; e.x = rand() * W; }
      const a = e.a * (0.65 + 0.35 * Math.sin(t * 0.002 + e.ph));
      em.fillStyle = `rgba(255,190,90,${a * 0.18})`;
      em.beginPath(); em.arc(e.x, e.y, e.r * 3.2, 0, 6.283); em.fill();
      em.fillStyle = `rgba(255,226,150,${a})`;
      em.beginPath(); em.arc(e.x, e.y, e.r, 0, 6.283); em.fill();
    }
  }

  /* ---------- fireworks & crackers ---------- */
  const P = [], R = [], F = [];
  const MAXP = mobile ? 520 : 1100;
  const PAL = [
    ['#ffd36b', '#ff9d2e', '#fff3c4'], ['#ff5d8f', '#ff9ec0', '#ffd1e0'],
    ['#5de0ff', '#8ea8ff', '#d8f4ff'], ['#8dff9e', '#e4ff7a', '#f4ffd0'],
    ['#c58bff', '#ff8be8', '#f2dcff'], ['#ff6a3d', '#ffb347', '#ffe2b0']
  ];
  function spark(x, y, vx, vy, col, life, sz, grav, drag, pop) {
    if (P.length < MAXP) P.push({ x, y, vx, vy, col, life, max: life, sz, grav, drag, pop });
  }
  function burst(x, y, type) {
    const pal = pick(PAL), k = mobile ? 0.65 : 1;
    type = type || pick(['peony', 'ring', 'willow', 'crackle', 'heart']);
    const col = () => pick(pal);
    if (type === 'heart') {
      const n = Math.round(64 * k), s = 0.27 + rand() * 0.05;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * 6.283;
        const hx = 16 * Math.sin(t) ** 3;
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        spark(x, y, hx * s, -hy * s, '#ff7aa8', 70 + rand() * 12, 2.2, 0.035, 0.985);
      }
      return;
    }
    const n = Math.round({ peony: 80, ring: 56, willow: 64, crackle: 52 }[type] * k);
    for (let i = 0; i < n; i++) {
      const a = type === 'ring' ? (i / n) * 6.283 : rand() * 6.283;
      if (type === 'ring') {
        spark(x, y, Math.cos(a) * 4.6, Math.sin(a) * 4.6, col(), 62, 2.2, 0.04, 0.975);
      } else if (type === 'willow') {
        const s = 1.2 + rand() * 3.4;
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s, '#ffcf6b', 110 + rand() * 40, 1.7, 0.07, 0.985);
      } else {
        const s = 1 + rand() * 4.6;
        spark(x, y, Math.cos(a) * s, Math.sin(a) * s, col(), 55 + rand() * 30, 2.4, 0.05, 0.978, type === 'crackle');
      }
    }
  }
  function launch(x) {
    x = x ?? W * (0.12 + rand() * 0.76);
    const ty = H * (0.14 + rand() * 0.34), a = 0.12;
    R.push({ x, y: H + 8, vx: (rand() - 0.5) * 0.8, vy: -Math.sqrt(2 * a * (H - ty)), a });
  }
  function fountain(x, frames = 200) { F.push({ x, left: frames }); }

  let last = 0, dirty = false;
  function frame(t) {
    const dt = Math.min((t - last) / 16.67 || 1, 2.5); last = t;
    if (!reduce.matches) drawEmbers(dt, t);

    for (let i = R.length - 1; i >= 0; i--) {         // rockets
      const r = R[i];
      r.x += r.vx * dt; r.y += r.vy * dt; r.vy += r.a * dt;
      spark(r.x, r.y, (rand() - 0.5) * 0.6, rand() * 0.8, '#ffd98a', 16, 1.4, 0.02, 0.96);
      if (r.vy > -0.6) { burst(r.x, r.y); R.splice(i, 1); }
    }
    for (let i = F.length - 1; i >= 0; i--) {         // ground fountains (anar)
      const f = F[i]; f.left -= dt;
      for (let j = 0; j < (mobile ? 2 : 4); j++) {
        const a = -1.5708 + (rand() - 0.5) * 0.7, s = 5 + rand() * 4.5;
        spark(f.x, H, Math.cos(a) * s, Math.sin(a) * s * (H / 800 + 0.4), rand() < 0.5 ? '#ffc04a' : '#ff8a2a', 45 + rand() * 20, 1.8, 0.13, 0.985);
      }
      if (f.left <= 0) F.splice(i, 1);
    }

    if (P.length || R.length) {
      fx.clearRect(0, 0, W, H);
      fx.globalCompositeOperation = 'lighter';
      fx.lineCap = 'round';
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt); p.vy += p.grav * dt;
        const px = p.x, py = p.y;
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.life <= 0) {
          if (p.pop) for (let j = 0; j < 4; j++) spark(p.x, p.y, (rand() - 0.5) * 3, (rand() - 0.5) * 3, '#fff6d0', 14, 1.2, 0.05, 0.95);
          P[i] = P[P.length - 1]; P.pop(); continue;
        }
        const al = p.life / p.max;
        fx.globalAlpha = al > 0.25 ? 1 : al * 4;
        fx.strokeStyle = p.col; fx.lineWidth = p.sz * (0.5 + al * 0.5);
        fx.beginPath(); fx.moveTo(px - p.vx * 0.8, py - p.vy * 0.8); fx.lineTo(p.x, p.y); fx.stroke();
      }
      fx.globalAlpha = 1;
      for (const r of R) { fx.fillStyle = '#fff1bf'; fx.beginPath(); fx.arc(r.x, r.y, 2.2, 0, 6.283); fx.fill(); }
      fx.globalCompositeOperation = 'source-over';
      dirty = true;
    } else if (dirty) { fx.clearRect(0, 0, W, H); dirty = false; }

    if (!reduce.matches) requestAnimationFrame(frame);
  }

  /* ---------- show choreography ---------- */
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  function ambient() {
    if (!document.hidden && !reduce.matches && R.length < 2) launch();
    later(ambient, 2400 + rand() * 1800);
  }
  function showTime() {
    timers.forEach(clearTimeout); timers = [];
    if (reduce.matches) return;
    fountain(W * 0.1); fountain(W * 0.9);
    for (let i = 0; i < 8; i++) later(() => launch(), 150 + i * 360);
    later(() => { burst(W / 2, H * 0.3, 'heart'); }, 1700);
    later(() => { for (let i = 0; i < 6; i++) later(() => launch(W * (0.1 + i * 0.16)), i * 140); }, 3600);
    later(ambient, 6200);
  }

  /* ---------- flow ---------- */
  const welcome = $('#welcome'), screen = $('#cardScreen'), title = $('#cTitle');
  function reveal(delay) {
    later(() => {
      welcome.hidden = true; screen.hidden = false;
      void screen.offsetWidth; screen.classList.add('show');
      title.focus({ preventScroll: true });
    }, delay);
  }
  $('#start').addEventListener('click', () => {
    started = true; welcome.classList.add('out');
    showTime(); reveal(reduce.matches ? 300 : 1300);
  });
  $('#replay').addEventListener('click', () => {
    screen.classList.remove('show'); screen.scrollTop = 0;
    void screen.offsetWidth; showTime();
    later(() => screen.classList.add('show'), reduce.matches ? 100 : 900);
  });

  let lastTap = 0;
  document.addEventListener('pointerdown', (e) => {
    if (!started || reduce.matches || e.target.closest('button')) return;
    const n = performance.now(); if (n - lastTap < 140) return; lastTap = n;
    burst(e.clientX, e.clientY);
  });

  /* ---------- personal touch: ?to=Name ---------- */
  const name = (new URLSearchParams(location.search).get('to') || '').trim().slice(0, 30);
  if (name) { const to = $('#to'); to.textContent = 'Dear ' + name + ','; to.hidden = false; }

  /* ---------- share with copy-link fallback ---------- */
  const toast = $('#toast'); let tt;
  function say(msg) { toast.textContent = msg; toast.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 2600); }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* fall through */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (_) { return false; }
  }
  $('#share').addEventListener('click', async () => {
    const url = location.href.split('#')[0];
    if (navigator.share) {
      try { await navigator.share({ title: 'शुभ दीपावली!', text: 'Wishing you a very happy Diwali! 🪔✨', url }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    if (await copy(url)) say('Link copied. Paste it anywhere to share.');
    else window.prompt('Copy this link to share:', url);
  });

  /* ---------- init ---------- */
  size(); makeEmbers();
  if (reduce.matches) drawEmbers(0); else requestAnimationFrame(frame);
  reduce.addEventListener?.('change', () => { if (!reduce.matches) requestAnimationFrame(frame); });
})();
