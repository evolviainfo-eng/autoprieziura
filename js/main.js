/* Automobilių priežiūra Kaunas — main.js */
(function () {
  'use strict';
  document.body.classList.add('js');
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = mq.matches;

  /* ---------- nav scrolled state ---------- */
  var nav = document.getElementById('nav');
  var onScrollNav = function () {
    nav.classList.toggle('scrolled', window.scrollY > 24);
    document.body.classList.toggle('past-hero', window.scrollY > window.innerHeight * 0.85);
  };
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- reveals (IO + fail-to-visible safety) ---------- */
  var rEls = [].slice.call(document.querySelectorAll('[data-r]'));
  var reveal = function (el) { el.classList.add('is-in'); };
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    rEls.forEach(function (el) { io.observe(el); });
    var safety = function () {
      rEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) reveal(el);
      });
    };
    window.addEventListener('load', safety);
    document.addEventListener('visibilitychange', safety);
  } else {
    rEls.forEach(reveal);
  }

  /* ---------- Lenis smooth scroll (desktop, non-reduced) ---------- */
  var lenis = null;
  var fine = window.matchMedia('(pointer: fine)').matches;
  if (window.Lenis && fine && !reduced) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  } else if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* smooth anchors with nav offset */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (lenis) { lenis.scrollTo(t, { offset: -76 }); }
      else { window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 76, behavior: reduced ? 'auto' : 'smooth' }); }
    });
  });

  /* ---------- ledger scrub line ---------- */
  var fill = document.getElementById('ledgerFill');
  if (fill && window.gsap && window.ScrollTrigger && !reduced) {
    gsap.to(fill, {
      scaleY: 1, ease: 'none', force3D: false,
      scrollTrigger: { trigger: '.ledger-wrap', start: 'top 72%', end: 'bottom 45%', scrub: 0.6 }
    });
  } else if (fill) {
    fill.style.transform = 'scaleY(1)';
  }

  /* ---------- service selector / sum bar ---------- */
  var rows = [].slice.call(document.querySelectorAll('.lrow[data-price]'));
  var bar = document.getElementById('sumbar');
  var elC = document.getElementById('sbCount');
  var elS = document.getElementById('sbSum');
  var clearBtn = document.getElementById('sbClear');
  var plural = function (n) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return n + ' paslauga';
    if (m10 >= 2 && m10 <= 9 && (m100 < 11 || m100 > 19)) return n + ' paslaugos';
    return n + ' paslaugų';
  };
  var update = function () {
    var sel = rows.filter(function (r) { return r.classList.contains('sel'); });
    var sum = sel.reduce(function (s, r) { return s + Number(r.dataset.price); }, 0);
    var on = sel.length > 0;
    bar.classList.toggle('on', on);
    document.body.classList.toggle('sum-on', on);
    if (on) {
      elC.textContent = plural(sel.length);
      elS.textContent = 'nuo ' + sum + ' € · patvirtinsime telefonu';
    }
  };
  rows.forEach(function (r) {
    var b = r.querySelector('.add');
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      r.classList.toggle('sel');
      b.setAttribute('aria-pressed', r.classList.contains('sel') ? 'true' : 'false');
      update();
    });
  });
  clearBtn.addEventListener('click', function () {
    rows.forEach(function (r) {
      r.classList.remove('sel');
      var b = r.querySelector('.add'); if (b) b.setAttribute('aria-pressed', 'false');
    });
    update();
  });

  /* ---------- estimate dialog ---------- */
  var estBack = document.getElementById('estBack');
  var estRows = document.getElementById('estRows');
  var estSum = document.getElementById('estSum');
  var estDate = document.getElementById('estDate');
  var estMail = document.getElementById('estMail');
  var EMAIL = 'automobiliuprieziurakaunas@gmail.com';
  var esc = function (s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  var openEst = function () {
    var sel = rows.filter(function (r) { return r.classList.contains('sel'); });
    if (!sel.length) return;
    var sum = sel.reduce(function (s, r) { return s + Number(r.dataset.price); }, 0);
    estRows.innerHTML = sel.map(function (r, i) {
      return '<li><span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="nm">' + esc(r.dataset.name) + '</span><i class="dots"></i>' +
        '<span class="pr">nuo ' + r.dataset.price + ' €</span></li>';
    }).join('');
    estSum.textContent = 'nuo ' + sum + ' €';
    estDate.textContent = new Date().toLocaleDateString('lt-LT') + ' · Kaunas';
    var body = 'Sveiki,\n\nnorėčiau užsisakyti šias paslaugas:\n' +
      sel.map(function (r, i) { return (i + 1) + '. ' + r.dataset.name + ' — nuo ' + r.dataset.price + ' €'; }).join('\n') +
      '\n\nPreliminari suma: nuo ' + sum + ' €\n\nAutomobilis (markė, modelis, metai): \nTelefonas: \n';
    estMail.href = 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent('Užklausa dėl paslaugų — preliminari sąmata') +
      '&body=' + encodeURIComponent(body);
    estBack.hidden = false;
    requestAnimationFrame(function () { estBack.classList.add('on'); });
    document.body.classList.add('est-open');
    if (lenis) lenis.stop();
  };
  var closeEst = function () {
    estBack.classList.remove('on');
    document.body.classList.remove('est-open');
    if (lenis) lenis.start();
    setTimeout(function () { estBack.hidden = true; }, 300);
  };
  document.getElementById('sbEst').addEventListener('click', openEst);
  document.getElementById('estX').addEventListener('click', closeEst);
  estBack.addEventListener('click', function (e) { if (e.target === estBack) closeEst(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !estBack.hidden) closeEst();
  });

  /* ---------- prieš/po mobile rail counter ---------- */
  var rail = document.getElementById('baRail');
  var ui = document.getElementById('baUi');
  if (rail && ui) {
    var count = document.getElementById('baCount');
    var prog = document.getElementById('baProg');
    var hint = document.getElementById('baHint');
    var cards = rail.children.length;
    var hinted = false;
    rail.addEventListener('scroll', function () {
      var max = rail.scrollWidth - rail.clientWidth;
      if (max <= 0) return;
      var p = rail.scrollLeft / max;
      var idx = Math.min(cards, Math.max(1, Math.round(p * (cards - 1)) + 1));
      count.textContent = idx + ' / ' + cards;
      prog.style.transform = 'translateX(' + (p * (100 / 0.17 - 100)) + '%)';
      if (!hinted) { hinted = true; hint.classList.add('off'); }
    }, { passive: true });
  }

  /* ---------- hide call bar at contacts ---------- */
  var contact = document.getElementById('kontaktai');
  if (contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { document.body.classList.toggle('at-contact', e.isIntersecting); });
    }, { threshold: 0.12 }).observe(contact);
  }
})();
