/* ============================================================
   DIGITAL ONE REVIEWS — script.js
   100% Vanilla JavaScript. No frameworks, no dependencies.
   Features: sticky header, scroll progress, mobile menu,
   scroll reveal, counters, testimonial slider, FAQ accordion,
   video modal, back-to-top, ripple, parallax, blog search UI,
   text reveal, active nav highlighting.
   ============================================================ */
(function () {
  'use strict';

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. Sticky header + scroll progress bar + back-to-top
  ---------------------------------------------------------- */
  const header   = $('.site-header');
  const progress = $('.scroll-progress');
  const backTop  = $('.back-top');

  function onScroll() {
    const y = window.scrollY;

    if (header) header.classList.toggle('is-scrolled', y > 40);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }

    if (backTop) backTop.classList.toggle('is-visible', y > 600);

    // Parallax hero visual (subtle, desktop only)
    if (!reducedMotion && window.innerWidth > 820) {
      const px = $('[data-parallax]');
      if (px && y < window.innerHeight) {
        px.style.transform = 'translateY(' + y * 0.12 + 'px)';
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
    );
  }

  /* ----------------------------------------------------------
     2. Mobile menu + dropdown toggles
  ---------------------------------------------------------- */
  const navToggle = $('.nav-toggle');
  const mainNav   = $('.main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // On touch layouts, first tap on "Services" opens the submenu
  $$('.has-dropdown > a').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 820) {
        const li = link.parentElement;
        if (!li.classList.contains('is-open')) {
          e.preventDefault();
          li.classList.add('is-open');
        }
      }
    });
  });

  /* ----------------------------------------------------------
     3. Scroll reveal — fade up / left / right / in
  ---------------------------------------------------------- */
  const revealEls = $$('.reveal, .reveal-left, .reveal-right, .reveal-fade');
  if (revealEls.length) {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('in-view'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('in-view');
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ----------------------------------------------------------
     4. Animated counters  <span data-count="95" data-suffix="%">
  ---------------------------------------------------------- */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reducedMotion) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el     = en.target;
          const target = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || '';
          const dur    = 1800;
          const t0     = performance.now();

          (function tick(now) {
            const p    = Math.min((now - t0) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
            el.textContent = Math.round(target * ease) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          })(t0);

          cio.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => {
      el.textContent = el.dataset.count + (el.dataset.suffix || '');
    });
  }

  /* ----------------------------------------------------------
     5. Testimonial slider (auto-play, dots, arrows, swipe)
  ---------------------------------------------------------- */
  $$('.testi-slider').forEach((slider) => {
    const track  = $('.testi-slides', slider);
    const slides = $$('.testi-slide', slider);
    const dotsEl = $('.testi-nav', slider);
    if (!track || slides.length < 2) return;

    let index = 0;
    let timer = null;

    // Build dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'testi-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.addEventListener('click', () => go(i, true));
      dotsEl.appendChild(dot);
    });
    const dots = $$('.testi-dot', slider);

    function go(i, user) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + index * 100 + '%)';
      dots.forEach((d, j) => d.setAttribute('aria-selected', String(j === index)));
      if (user) restart();
    }
    function restart() {
      clearInterval(timer);
      if (!reducedMotion) timer = setInterval(() => go(index + 1), 6000);
    }

    const prev = $('.testi-arrow--prev', slider);
    const next = $('.testi-arrow--next', slider);
    if (prev) prev.addEventListener('click', () => go(index - 1, true));
    if (next) next.addEventListener('click', () => go(index + 1, true));

    // Touch swipe
    let x0 = null;
    track.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    track.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1), true);
      x0 = null;
    }, { passive: true });

    go(0);
    restart();
  });

  /* ----------------------------------------------------------
     6. FAQ accordion (one open at a time, animated height)
  ---------------------------------------------------------- */
  $$('.faq').forEach((faq) => {
    $$('.faq-q', faq).forEach((btn) => {
      btn.addEventListener('click', () => {
        const answer = btn.nextElementSibling;
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Close all siblings
        $$('.faq-q', faq).forEach((b) => {
          b.setAttribute('aria-expanded', 'false');
          b.nextElementSibling.style.maxHeight = null;
        });

        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  });

  /* ----------------------------------------------------------
     7. Video modal — cards with [data-video] open a player
  ---------------------------------------------------------- */
  const modal = $('.video-modal');
  if (modal) {
    const player   = $('video', modal);
    const closeBtn = $('.video-modal-close', modal);
    let lastFocus  = null;

    function openModal(src, title) {
      lastFocus = document.activeElement;
      player.src = src;
      player.setAttribute('aria-label', title || 'Video player');
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      player.play().catch(() => {}); // autoplay may be blocked — controls remain
      closeBtn.focus();
    }
    function closeModal() {
      player.pause();
      player.removeAttribute('src');
      player.load();
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    $$('[data-video]').forEach((card) => {
      card.addEventListener('click', () =>
        openModal(card.dataset.video, card.dataset.title)
      );
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(card.dataset.video, card.dataset.title);
        }
      });
    });

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

  /* ----------------------------------------------------------
     8. Button ripple
  ---------------------------------------------------------- */
  $$('.btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      if (reducedMotion) return;
      const rect = this.getBoundingClientRect();
      const d    = Math.max(rect.width, rect.height);
      const span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = span.style.height = d + 'px';
      span.style.left  = e.clientX - rect.left - d / 2 + 'px';
      span.style.top   = e.clientY - rect.top - d / 2 + 'px';
      this.appendChild(span);
      setTimeout(() => span.remove(), 700);
    });
  });

  /* ----------------------------------------------------------
     9. Hero text reveal — split headline into rising words
  ---------------------------------------------------------- */
  $$('[data-text-reveal]').forEach((el) => {
    if (reducedMotion) return;
    const nodes = Array.from(el.childNodes);
    el.textContent = '';
    let wordIndex = 0;

    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/\s+/).filter(Boolean).forEach((word) => {
          el.appendChild(makeWord(word, wordIndex++));
          el.appendChild(document.createTextNode(' '));
        });
      } else {
        // Preserve accent spans etc.
        const wrap = makeWord(node.textContent, wordIndex++);
        wrap.firstChild.className = node.className || '';
        el.appendChild(wrap);
        el.appendChild(document.createTextNode(' '));
      }
    });

    function makeWord(text, i) {
      const outer = document.createElement('span');
      outer.className = 'tr-word';
      const inner = document.createElement('span');
      inner.textContent = text;
      inner.style.animationDelay = 0.08 * i + 's';
      outer.appendChild(inner);
      return outer;
    }
  });

  /* ----------------------------------------------------------
     10. Blog search + category filter (UI only, client-side)
  ---------------------------------------------------------- */
  const blogSearch = $('#blog-search');
  const blogCards  = $$('[data-post]');
  if (blogSearch && blogCards.length) {
    let activeCat = 'all';

    function filterPosts() {
      const q = blogSearch.value.trim().toLowerCase();
      blogCards.forEach((card) => {
        const text  = card.textContent.toLowerCase();
        const cat   = card.dataset.cat || '';
        const okCat = activeCat === 'all' || cat === activeCat;
        const okQ   = !q || text.includes(q);
        card.style.display = okCat && okQ ? '' : 'none';
      });
    }
    blogSearch.addEventListener('input', filterPosts);

    $$('.cat-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        $$('.cat-chip').forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        activeCat = chip.dataset.cat;
        filterPosts();
      });
    });
  }

  /* ----------------------------------------------------------
     11. Footer year
  ---------------------------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
