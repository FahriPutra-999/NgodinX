/* ==========================================================================
   EduGame Track — Shared Application Script
   --------------------------------------------------------------------------
   Berisi utilitas yang dipakai bersama oleh seluruh halaman:
   - EG.theme    : light/dark toggle (+ anti-FOUC via inline head script)
   - EG.toast    : notifikasi toast (pengganti alert bawaan browser)
   - EG.modal    : pembuka modal yang diseragamkan
   - EG.reveal   : animasi muncul saat scroll (IntersectionObserver)
   - EG.counter  : angka beranimasi (count up)
   - EG.navbar   : state navbar + section spy
   - EG.sidebar  : sidebar off-canvas di layar kecil
   - EG.confetti : konfeti canvas saat quest selesai
   - EG.chart    : grafik garis SVG buatan sendiri (tanpa library)
   ========================================================================== */

(function (window, document) {
  'use strict';

  const EG = {};
  window.EG = EG;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  EG.reducedMotion = prefersReducedMotion;

  /* Helper aman: event target belum tentu sebuah Element */
  function closestOf(event, selector) {
    const target = event && event.target;
    return target && typeof target.closest === 'function' ? target.closest(selector) : null;
  }

  /* ------------------------------------------------------------------ *
   * 1. Theme (light / dark)
   * ------------------------------------------------------------------ */
  EG.theme = {
    KEY: 'eg-theme',

    get() {
      return document.documentElement.getAttribute('data-bs-theme') || 'light';
    },

    apply(theme) {
      document.documentElement.setAttribute('data-bs-theme', theme);
      try { localStorage.setItem(EG.theme.KEY, theme); } catch (e) { /* private mode */ }
      document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        const icon = btn.querySelector('[data-theme-icon]');
        if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('aria-label', theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
        btn.setAttribute('title', theme === 'dark' ? 'Mode terang' : 'Mode gelap');
      });
      document.dispatchEvent(new CustomEvent('eg:themechange', { detail: { theme } }));
    },

    toggle() {
      const next = EG.theme.get() === 'dark' ? 'light' : 'dark';
      EG.theme.apply(next);
      EG.toast(
        next === 'dark' ? 'Mode gelap aktif' : 'Mode terang aktif',
        { type: 'info', icon: next === 'dark' ? '🌙' : '☀️', timeout: 1800 }
      );
    },

    init() {
      EG.theme.apply(EG.theme.get());
      document.addEventListener('click', (e) => {
        const btn = closestOf(e, '[data-theme-toggle]');
        if (btn) { e.preventDefault(); EG.theme.toggle(); }
      });
    }
  };

  /* ------------------------------------------------------------------ *
   * 2. Navigasi
   * ------------------------------------------------------------------ */
  EG.go = function (url) {
    if (!url) return;
    try {
      window.location.href = url;
    } catch (e) {
      window.location.assign(url);
    }
  };

  /* ------------------------------------------------------------------ *
   * 3. Toast
   * ------------------------------------------------------------------ */
  function toastWrap() {
    let wrap = document.querySelector('.eg-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'eg-toast-wrap';
      wrap.setAttribute('role', 'status');
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    return wrap;
  }

  EG.toast = function (message, options) {
    const opts = Object.assign({ type: 'info', title: '', icon: null, timeout: 3600 }, options || {});
    const icons = { success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️' };

    const el = document.createElement('div');
    el.className = 'eg-toast eg-toast-' + opts.type;
    el.innerHTML =
      '<span class="eg-toast-icon">' + (opts.icon || icons[opts.type] || 'ℹ️') + '</span>' +
      '<div class="flex-grow-1">' +
        (opts.title ? '<div class="eg-toast-title"></div>' : '') +
        '<div class="eg-toast-msg"></div>' +
      '</div>' +
      '<button type="button" class="btn-close btn-close-sm" aria-label="Tutup notifikasi"></button>';

    if (opts.title) el.querySelector('.eg-toast-title').textContent = opts.title;
    el.querySelector('.eg-toast-msg').textContent = message;

    const dismiss = () => {
      if (!el.isConnected) return;
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 300);
    };

    el.querySelector('.btn-close').addEventListener('click', dismiss);
    toastWrap().appendChild(el);
    setTimeout(dismiss, opts.timeout);
    return el;
  };

  /* ------------------------------------------------------------------ *
   * 3. Modal
   * ------------------------------------------------------------------ */
  EG.modal = function (target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return null;
    if (window.bootstrap && bootstrap.Modal) {
      return bootstrap.Modal.getOrCreateInstance(el).show();
    }
    el.classList.add('show');
    el.style.display = 'block';
    el.removeAttribute('aria-hidden');
    document.body.classList.add('modal-open');
    return el;
  };

  /* ------------------------------------------------------------------ *
   * 4. Scroll reveal
   * ------------------------------------------------------------------ */
  EG.reveal = function (root) {
    const nodes = (root || document).querySelectorAll('[data-reveal]');
    if (!nodes.length) return;

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      nodes.forEach((n) => n.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    nodes.forEach((n) => io.observe(n));
  };

  /* ------------------------------------------------------------------ *
   * 5. Counter (count up)
   * ------------------------------------------------------------------ */
  EG.counter = function (el) {
    if (!el) return;
    const target = parseFloat(el.dataset.count || '0');
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = parseInt(el.dataset.duration || '1400', 10);

    const render = (value) => {
      el.textContent = prefix + value.toFixed(decimals) + suffix;
    };

    if (prefersReducedMotion) { render(target); return; }

    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      render(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else render(target);
    };
    requestAnimationFrame(step);
  };

  EG.initCounters = function (root) {
    const nodes = (root || document).querySelectorAll('[data-count]');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      nodes.forEach(EG.counter);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        EG.counter(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    nodes.forEach((n) => io.observe(n));
  };

  /* ------------------------------------------------------------------ *
   * 6. Progress bar (isi otomatis saat terlihat)
   * ------------------------------------------------------------------ */
  EG.initProgress = function (root) {
    const nodes = (root || document).querySelectorAll('[data-progress]');
    if (!nodes.length) return;
    const fill = (el) => { el.style.width = (el.dataset.progress || 0) + '%'; };

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      nodes.forEach(fill);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        fill(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    nodes.forEach((n) => io.observe(n));
  };

  /* ------------------------------------------------------------------ *
   * 7. Navbar: state scroll + section spy
   * ------------------------------------------------------------------ */
  EG.navbar = function () {
    const nav = document.querySelector('[data-navbar]');
    if (!nav) return;
    const links = Array.from(nav.querySelectorAll('[data-nav-link]'));
    const sections = links
      .map((l) => document.querySelector(l.getAttribute('href')))
      .filter(Boolean);

    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!sections.length || !('IntersectionObserver' in window)) return;

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((s) => spy.observe(s));
  };

  /* ------------------------------------------------------------------ *
   * 8. Sidebar off-canvas (mobile)
   * ------------------------------------------------------------------ */
  EG.sidebar = function () {
    const sidebar = document.querySelector('[data-sidebar]');
    if (!sidebar) return;

    let backdrop = document.querySelector('.eg-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'eg-backdrop';
      document.body.appendChild(backdrop);
    }

    const open = () => {
      sidebar.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    document.addEventListener('click', (e) => {
      if (closestOf(e, '[data-sidebar-toggle]')) { e.preventDefault(); open(); }
      if (closestOf(e, '[data-sidebar-close]') || e.target === backdrop) { e.preventDefault(); close(); }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  };

  /* ------------------------------------------------------------------ *
   * 9. Confetti
   * ------------------------------------------------------------------ */
  EG.confetti = function (options) {
    const opts = Object.assign({
      duration: 2800,
      particles: 150,
      colors: ['#4f46e5', '#7c3aed', '#f59e0b', '#10b981', '#0ea5e9', '#ec4899']
    }, options || {});

    if (prefersReducedMotion) return;

    let canvas = document.getElementById('eg-confetti');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'eg-confetti';
      canvas.className = 'eg-canvas-confetti';
      document.body.appendChild(canvas);
    }    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;   // lingkungan tanpa dukungan canvas
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const W = window.innerWidth;
    const H = window.innerHeight;
    const pieces = [];

    for (let i = 0; i < opts.particles; i++) {
      const fromLeft = i % 2 === 0;
      pieces.push({
        x: fromLeft ? -20 : W + 20,
        y: H * (0.55 + Math.random() * 0.4),
        vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 7),
        vy: -(6 + Math.random() * 8),
        size: 6 + Math.random() * 7,
        color: opts.colors[(Math.random() * opts.colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.28,
        life: 0
      });
    }

    const start = performance.now();
    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;

      pieces.forEach((p) => {
        p.life++;
        p.vy += 0.32;          // gravitasi
        p.vx *= 0.995;          // hambatan udara
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        if (p.y > H + 60 || p.life > 340) return;
        alive++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - elapsed / opts.duration);
        if (p.size % 3 === 0) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (elapsed < opts.duration && alive > 0) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, W, H);
        window.removeEventListener('resize', resize);
      }
    }
    requestAnimationFrame(frame);
  };

  /* ------------------------------------------------------------------ *
   * 10. Grafik garis SVG (tanpa library eksternal)
   * ------------------------------------------------------------------ */
  function smoothPath(points) {
    if (points.length < 2) return '';
    let d = 'M ' + points[0][0] + ' ' + points[0][1];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ',' +
                 c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ',' +
                 p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /**
   * EG.chart.line(el, {labels, values, max, min})
   */
  EG.chart = {
    line(container, config) {
      if (!container) return;
      const cfg = Object.assign({
        labels: [], values: [], min: 0, max: 100,
        width: 720, height: 260, unit: '', label: ''
      }, config || {});

      const W = cfg.width, H = cfg.height;
      const padL = 40, padR = 18, padT = 18, padB = 34;
      const innerW = W - padL - padR;
      const innerH = H - padT - padB;
      const n = cfg.values.length;
      if (!n) return;

      const x = (i) => padL + (n === 1 ? innerW / 2 : (i * innerW) / (n - 1));
      const y = (v) => padT + (1 - (v - cfg.min) / (cfg.max - cfg.min)) * innerH;
      const pts = cfg.values.map((v, i) => [x(i), y(v)]);

      const uid = 'eg' + Math.random().toString(36).slice(2, 8);
      const gridCount = 4;
      let grid = '';
      for (let g = 0; g <= gridCount; g++) {
        const val = cfg.min + ((cfg.max - cfg.min) * g) / gridCount;
        const gy = y(val);
        grid +=
          '<line class="grid-line" x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + gy.toFixed(1) + '"/>' +
          '<text class="axis-label" x="' + (padL - 9) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end">' +
            Math.round(val) + '</text>';
      }

      let xLabels = '';
      cfg.labels.forEach((lb, i) => {
        xLabels += '<text class="axis-label" x="' + x(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle">' + lb + '</text>';
      });

      let dots = '';
      pts.forEach((p, i) => {
        dots +=
          '<circle class="point" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="5"><title>' +
            cfg.labels[i] + ': ' + cfg.values[i] + cfg.unit + '</title></circle>' +
          '<text class="point-label" x="' + p[0].toFixed(1) + '" y="' + (p[1] - 13).toFixed(1) + '" text-anchor="middle">' +
            cfg.values[i] + cfg.unit + '</text>';
      });

      const lineD = smoothPath(pts);
      const areaD = lineD + ' L ' + pts[pts.length - 1][0].toFixed(1) + ' ' + (padT + innerH) +
                    ' L ' + pts[0][0].toFixed(1) + ' ' + (padT + innerH) + ' Z';

      container.innerHTML =
        '<svg class="eg-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
          (cfg.label || 'Grafik') + '" preserveAspectRatio="xMidYMid meet">' +
          '<defs>' +
            '<linearGradient id="' + uid + 'g" x1="0" y1="0" x2="1" y2="0">' +
              '<stop offset="0%" style="stop-color:var(--eg-primary)"/>' +
              '<stop offset="100%" style="stop-color:var(--eg-violet)"/>' +
            '</linearGradient>' +
            '<linearGradient id="' + uid + 'a" x1="0" y1="0" x2="0" y2="1">' +
              '<stop offset="0%" style="stop-color:var(--eg-primary);stop-opacity:.28"/>' +
              '<stop offset="100%" style="stop-color:var(--eg-primary);stop-opacity:0"/>' +
            '</linearGradient>' +
          '</defs>' +
          grid + xLabels +
          '<path class="area-path" style="fill:url(#' + uid + 'a)" d="' + areaD + '"/>' +
          '<path class="line-path" style="stroke:url(#' + uid + 'g)" id="' + uid + 'l" d="' + lineD + '"/>' +
          dots +
        '</svg>';

      const line = container.querySelector('#' + uid + 'l');
      if (line && typeof line.getTotalLength === 'function') {
        const len = line.getTotalLength();
        line.style.strokeDasharray = len;
        line.style.strokeDashoffset = len;
        requestAnimationFrame(() => {
          line.style.transition = 'stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1)';
          line.style.strokeDashoffset = '0';
        });
      }
      requestAnimationFrame(() => container.querySelector('svg').classList.add('is-visible'));
    },

    /** Donat/ring progress: isi berdasarkan nilai 0..max */
    ring(el, value, max, options) {
      if (!el) return;
      const cfg = Object.assign({ size: 120, stroke: 10, color: 'var(--eg-primary)' }, options || {});
      const r = (cfg.size - cfg.stroke) / 2;
      const c = 2 * Math.PI * r;
      const pct = Math.max(0, Math.min(1, value / (max || 100)));

      el.setAttribute('viewBox', '0 0 ' + cfg.size + ' ' + cfg.size);
      el.innerHTML =
        '<circle cx="' + cfg.size / 2 + '" cy="' + cfg.size / 2 + '" r="' + r + '" ' +
          'style="stroke:var(--eg-surface-3)" stroke-width="' + cfg.stroke + '"/>' +
        '<circle class="eg-donut-progress" cx="' + cfg.size / 2 + '" cy="' + cfg.size / 2 + '" r="' + r +
          '" style="stroke:' + cfg.color + '" stroke-width="' + cfg.stroke + '" ' +
          'stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + c.toFixed(2) + '"/>';

      const arc = el.querySelector('.eg-donut-progress');
      requestAnimationFrame(() => {
        setTimeout(() => { arc.setAttribute('stroke-dashoffset', (c * (1 - pct)).toFixed(2)); }, 180);
      });
    }
  };

  /* ------------------------------------------------------------------ *
   * 11. Init
   * ------------------------------------------------------------------ */
  function boot() {
    EG.theme.init();
    EG.reveal();
    EG.initCounters();
    EG.initProgress();
    EG.navbar();
    EG.sidebar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window, document);
