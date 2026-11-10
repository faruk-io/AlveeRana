/* alveerana.com — vanilla JS, no dependencies */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Page-load sequence ---------- */
  function startHero() {
    requestAnimationFrame(function () { doc.classList.add('is-loaded'); });
  }
  var heroImg = $('.hero-photo img');
  if (reduceMotion || !heroImg || heroImg.complete) startHero();
  else {
    heroImg.addEventListener('load', startHero, { once: true });
    heroImg.addEventListener('error', startHero, { once: true });
    setTimeout(startHero, 1500); // never hold the page hostage to one image
  }

  /* ---------- Header state + back-to-top ---------- */
  var header = $('.site-header');
  var toTop = $('.to-top');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    toTop.classList.toggle('is-visible', y > window.innerHeight);
    updateTimeline();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    $('#top').focus({ preventScroll: true });
  });

  /* ---------- Mobile nav ---------- */
  var toggle = $('.nav-toggle');
  var nav = $('#site-nav');
  function setNav(open) {
    doc.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { var first = $('a', nav); if (first) first.focus(); }
  }
  toggle.addEventListener('click', function () { setNav(!doc.classList.contains('nav-open')); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && doc.classList.contains('nav-open')) { setNav(false); toggle.focus(); }
  });
  // tap outside the dropdown closes it; widening the window past the breakpoint resets it
  document.addEventListener('click', function (e) {
    if (doc.classList.contains('nav-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setNav(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860 && doc.classList.contains('nav-open')) setNav(false);
  });

  /* ---------- Active section in nav ---------- */
  var links = $$('.nav-list a[href^="#"]');
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && byId[en.target.id]) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          byId[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Timeline progress ---------- */
  var tl = $('.timeline');
  var tlItems = $$('.timeline li');
  function updateTimeline() {
    if (!tl) return;
    var r = tl.getBoundingClientRect();
    var mark = window.innerHeight * 0.6;
    var p = Math.min(1, Math.max(0, (mark - r.top) / r.height));
    tl.style.setProperty('--progress', p.toFixed(3));
    tlItems.forEach(function (li) {
      li.classList.toggle('is-reached', li.getBoundingClientRect().top < mark);
    });
  }

  /* ---------- Counters ---------- */
  var nf = new Intl.NumberFormat('en-US');
  function runCounter(el) {
    var target = Number(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = nf.format(target) + suffix; return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 4);
      el.textContent = nf.format(Math.round(target * eased)) + suffix;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else counters.forEach(runCounter);

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox');
  var items = $$('.g-item button');
  var lbImg = $('#lb-img'), lbCap = $('#lb-caption'), lbCount = $('#lb-count');
  var index = 0, lastFocus = null;
  function show(i) {
    index = (i + items.length) % items.length;
    var b = items[index];
    lbImg.classList.remove('is-changing'); void lbImg.offsetWidth; lbImg.classList.add('is-changing');
    lbImg.src = b.dataset.full;
    lbImg.alt = b.querySelector('img').alt;
    lbCap.textContent = b.dataset.caption;
    lbCount.textContent = (index + 1) + ' / ' + items.length;
    // preload neighbour
    var n = new Image(); n.src = items[(index + 1) % items.length].dataset.full;
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    show(i);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    $('.lb-close', lb).focus();
  }
  function closeLb() {
    if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open');
  }
  if (lb) {
    items.forEach(function (b, i) { b.addEventListener('click', function () { openLb(i); }); });
    $('.lb-close', lb).addEventListener('click', closeLb);
    $('.lb-prev', lb).addEventListener('click', function () { show(index - 1); });
    $('.lb-next', lb).addEventListener('click', function () { show(index + 1); });
    lb.addEventListener('close', function () { if (lastFocus) lastFocus.focus(); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) closeLb(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  /* ---------- Contact form validation ---------- */
  var form = $('#contact-form');
  if (form) {
    var started = Date.now();
    var rules = {
      name: function (v) {
        if (!v) return 'Enter your name.';
        if (v.length < 2) return 'Name must be at least 2 characters.';
        if (v.length > 80) return 'Name must be 80 characters or fewer.';
        if (!/^[\p{L}\p{M}\s.'-]+$/u.test(v)) return 'Use letters, spaces, dots, hyphens or apostrophes only.';
        return '';
      },
      email: function (v) {
        if (!v) return 'Enter your email address.';
        if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return 'Enter a valid email, like name@company.com.';
        return '';
      },
      phone: function (v) {
        if (!v) return '';
        var d = v.replace(/[\s()-]/g, '');
        if (!/^\+?\d{7,15}$/.test(d)) return 'Enter a valid phone number, like +8801712345678.';
        return '';
      },
      topic: function (v) { return v ? '' : 'Choose what your message is about.'; },
      message: function (v) {
        if (!v) return 'Write your message.';
        if (v.length < 20) return 'Message must be at least 20 characters (' + v.length + ' so far).';
        if (v.length > 2000) return 'Message must be 2,000 characters or fewer.';
        return '';
      }
    };

    function check(field, show) {
      var el = form.elements[field];
      var msg = rules[field](el.value.trim());
      var box = el.closest('.field');
      var err = $('#' + field + '-error');
      if (show) {
        err.textContent = msg;
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        box.classList.toggle('is-valid', !msg && el.value.trim() !== '');
      }
      return !msg;
    }

    Object.keys(rules).forEach(function (f) {
      var el = form.elements[f];
      var touched = false;
      el.addEventListener('blur', function () { touched = true; check(f, true); });
      el.addEventListener('input', function () { if (touched || el.getAttribute('aria-invalid') === 'true') check(f, true); });
      el.addEventListener('change', function () { if (el.tagName === 'SELECT') { touched = true; check(f, true); } });
    });

    var msgEl = form.elements.message, countEl = $('#message-count');
    function updateCount() {
      var n = msgEl.value.length;
      countEl.textContent = nf.format(n) + ' / 2,000';
      countEl.classList.toggle('is-over', n > 2000);
    }
    msgEl.addEventListener('input', updateCount); updateCount();

    var status = $('#form-status');
    var submit = $('button[type="submit"]', form);
    var label = $('.label', submit);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status'; status.textContent = '';
      var firstBad = null;
      Object.keys(rules).forEach(function (f) { if (!check(f, true) && !firstBad) firstBad = form.elements[f]; });
      if (firstBad) { firstBad.focus(); return; }

      var data = new FormData(form);
      data.append('elapsed', String(Math.round((Date.now() - started) / 1000)));
      form.classList.add('is-sending'); submit.disabled = true; label.textContent = 'Sending…';

      fetch(form.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.ok && res.body.ok) {
            status.className = 'form-status is-success';
            status.textContent = 'Message sent. Thank you for getting in touch.';
            form.reset(); updateCount();
            $$('.field', form).forEach(function (f) { f.classList.remove('is-valid'); });
          } else {
            var errs = (res.body && res.body.errors) || {};
            Object.keys(errs).forEach(function (f) {
              var el = form.elements[f]; var err = $('#' + f + '-error');
              if (el && err) { err.textContent = errs[f]; el.setAttribute('aria-invalid', 'true'); }
            });
            status.className = 'form-status is-error';
            status.textContent = (res.body && res.body.message) || 'The message was not sent. Check the fields above and try again.';
          }
        })
        .catch(function () {
          status.className = 'form-status is-error';
          status.textContent = 'The message was not sent because the connection failed. Try again, or email alvee.rana@unionlimited.com directly.';
        })
        .then(function () {
          form.classList.remove('is-sending'); submit.disabled = false; label.textContent = 'Send message';
          status.focus();
        });
    });
  }

  /* ---------- Footer year ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  onScroll();
})();
