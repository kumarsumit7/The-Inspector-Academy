(function () {
  var pre = document.querySelector('.preloader');
  if (!pre) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hide = function () {
    if (reduced) { pre.remove(); return; }
    pre.style.transition = 'opacity .6s ease';
    pre.style.opacity = '0';
    setTimeout(function () { pre.remove(); }, 650);
  };
  if (document.readyState === 'complete') setTimeout(hide, reduced ? 0 : 1600);
  else window.addEventListener('load', function () { setTimeout(hide, reduced ? 0 : 1600); });
})();

(function () {
  var page = document.getElementById('page');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('is-reduced');
  var seen = {};
  var vis = {};
  var step = 0;
  var hover = null;
  var lang = 'en';
  var typed = false;
  var rail = document.getElementById('journey-rail');
  var fill = document.getElementById('journey-fill');
  var strip = document.getElementById('strip');
  var nav = document.querySelector('header.site-header');
  var toTop = document.querySelector('.to-top');
  var sheet = document.querySelector('.menu-panel');
  var L1 = 'npm install';
  var L2 = 'npm run db:setup';

  var conn = {
    admin: ['api'], front: ['api'],
    api: ['admin', 'front', 'db', 'sched', 'email', 'stripe'],
    db: ['api'], sched: ['api'], email: ['api'], stripe: ['api']
  };
  var edgeOn = {
    fe: ['front', 'api'], adm: ['admin', 'api'], db: ['api', 'db'],
    sch: ['api', 'sched'], eml: ['api', 'email'], str: ['api', 'stripe']
  };
  var bus = ['api', 'db', 'sched', 'email', 'stripe'];

  var archMap = document.querySelector('.architecture');
  var archReadout = document.querySelector('.architecture__readout');
  var archIdle = archReadout ? archReadout.textContent : '';
  var archNames = {
    front: 'Public site', admin: 'Admin dashboard', api: 'The API',
    db: 'PostgreSQL', sched: 'Job scheduler', email: 'Email', stripe: 'webhooks'
  };
  function archList(keys) {
    var names = keys.map(function (k) { return k === 'api' ? 'the API' : archNames[k]; });
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  function setHover(hv) {
    hover = hv;
    if (archMap) archMap.classList.toggle('is-tracing', !!hv);
    if (archReadout) {
      archReadout.textContent = hv
        ? archNames[hv] + ' talks to ' + archList(conn[hv] || []) + '.'
        : archIdle;
    }
    document.querySelectorAll('[data-node]').forEach(function (el) {
      var k = el.getAttribute('data-node');
      el.classList.toggle('is-hot', !!hv && hv === k);
      el.classList.toggle('is-related', !!hv && hv !== k && (conn[hv] || []).indexOf(k) >= 0);
    });
    document.querySelectorAll('[data-edge]').forEach(function (el) {
      var e = el.getAttribute('data-edge');
      var on = false;
      if (hv) {
        if (e === 'bus') on = bus.indexOf(hv) >= 0;
        else if (edgeOn[e]) on = hv === edgeOn[e][0] || hv === edgeOn[e][1];
      }
      el.classList.toggle('is-hot', on);
    });
  }

  document.querySelectorAll('[data-node]').forEach(function (el) {
    var k = el.getAttribute('data-node');
    el.addEventListener('mouseenter', function () { setHover(k); });
    el.addEventListener('mouseleave', function () { setHover(null); });
    el.addEventListener('focus', function () { setHover(k); });
    el.addEventListener('blur', function () { setHover(null); });
  });

  function setStep(i) {
    step = i;
    document.querySelectorAll('[data-step]').forEach(function (btn) {
      var on = Number(btn.getAttribute('data-step')) === i;
      btn.classList.toggle('is-current', on);
      btn.setAttribute('aria-current', on ? 'step' : 'false');
    });
    document.querySelectorAll('[data-panel]').forEach(function (p) {
      p.classList.toggle('is-current', Number(p.getAttribute('data-panel')) === i);
    });
  }
  document.querySelectorAll('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var i = Number(btn.getAttribute('data-step'));
      setStep(i);
      if (!rail) return;
      var r = rail.getBoundingClientRect();
      var span = r.height - 680;
      if (span <= 1200) return;
      var target = ((i + 0.5) / 6) * span;
      var cur = 104 - r.top;
      try { window.scrollBy({ top: target - cur, behavior: reduced ? 'auto' : 'smooth' }); }
      catch (err) { window.scrollBy(0, target - cur); }
    });
  });

  var navMap = { product: '#product', journey: '#journey', demos: '#demos', stack: '#stack', pricing: '#pricing', docs: '#setup' };
  var navEls = page.querySelectorAll('[data-nav]');
  var ticking = false;
  function measure() {
    if (nav) nav.classList.toggle('is-scrolled', page.getBoundingClientRect().top < -8);
    if (toTop) toTop.classList.toggle('is-on', page.getBoundingClientRect().top < -480);
    if (rail && fill) {
      var r = rail.getBoundingClientRect();
      var span = r.height - 680;
      var p = span > 0 ? (104 - r.top) / span : 0;
      p = Math.max(0, Math.min(1, p));
      fill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
      if (span > 1200) {
        var next = Math.min(5, Math.floor(p * 6));
        if (next !== step) setStep(next);
      }
    }
    var act = '';
    navEls.forEach(function (el) {
      if (el.getBoundingClientRect().top < 160) act = el.getAttribute('data-nav');
    });
    document.querySelectorAll('.site-header__nav a, .menu-panel__nav a').forEach(function (a) {
      var key = '';
      Object.keys(navMap).forEach(function (k) { if (navMap[k] === a.getAttribute('href')) key = k; });
      a.classList.toggle('is-active', key && key === act);
    });
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; measure(); });
  }
  document.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onScroll);

  function mark(el, id, on) {
    if (on && !seen[id]) {
      seen[id] = true;
      if (id === 's07') startType();
    }
    vis[id] = on;
    var cls = (seen[id] ? 'is-in' : '') + (vis[id] ? ' is-live' : '');
    el.className = el.className.replace(/\bis-in\b/g, '').replace(/\bis-live\b/g, '').replace(/\s+/g, ' ').trim();
    if (cls.trim()) el.className += ' ' + cls.trim();
  }

  if (reduced || !window.IntersectionObserver) {
    page.classList.add('is-static');
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        mark(en.target, en.target.getAttribute('data-rv'), en.isIntersecting);
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
    page.querySelectorAll('[data-rv]').forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      if (!seen.hero) page.classList.add('is-static');
    }, 3000);
  }

  var I18N = {
    en: {
      dir: 'ltr', lang: 'en', ini: 'SM', name: 'Sara Malik',
      nav1: 'Dashboard', nav2: 'My Courses', nav3: 'Certificates', nav4: 'Receipts', nav5: 'Notifications', nav6: 'Settings', nav7: 'Logout',
      s1n: '3', s1: 'Enrolled Courses', s2n: '2', s2: 'In Progress', s3n: '1', s3: 'Certificates',
      box: 'Continue Learning', btn: 'Continue Learning',
      st1: 'In progress', p1: 'Spanish B1', t1: 'Evening', c1: 'Spanish B1 — Evening Batch', pr1: '42% complete',
      st2: 'Not started', p2: 'Business English', t2: 'Beginner', c2: 'Business English Essentials', pr2: '0% complete'
    },
    ar: {
      dir: 'rtl', lang: 'ar', ini: 'س م', name: 'سارة مالك',
      nav1: 'لوحة التحكم', nav2: 'دوراتي', nav3: 'الشهادات', nav4: 'الإيصالات', nav5: 'الإشعارات', nav6: 'الإعدادات', nav7: 'تسجيل الخروج',
      s1n: '٣', s1: 'الدورات المسجّلة', s2n: '٢', s2: 'قيد التقدّم', s3n: '١', s3: 'الشهادات',
      box: 'متابعة التعلّم', btn: 'متابعة التعلّم',
      st1: 'قيد التقدّم', p1: 'الإسبانية B1', t1: 'مسائي', c1: 'الإسبانية B1 — الدفعة المسائية', pr1: 'مكتمل ٤٢٪',
      st2: 'لم يبدأ', p2: 'الإنجليزية للأعمال', t2: 'مبتدئ', c2: 'أساسيات الإنجليزية للأعمال', pr2: 'مكتمل ٠٪'
    },
    es: {
      dir: 'ltr', lang: 'es', ini: 'SM', name: 'Sara Malik',
      nav1: 'Panel', nav2: 'Mis cursos', nav3: 'Certificados', nav4: 'Recibos', nav5: 'Notificaciones', nav6: 'Ajustes', nav7: 'Salir',
      s1n: '3', s1: 'Cursos inscritos', s2n: '2', s2: 'En curso', s3n: '1', s3: 'Certificados',
      box: 'Continuar aprendiendo', btn: 'Seguir aprendiendo',
      st1: 'En curso', p1: 'Español B1', t1: 'Tarde', c1: 'Español B1 — Grupo de tarde', pr1: '42 % completado',
      st2: 'Sin empezar', p2: 'Inglés de negocios', t2: 'Principiante', c2: 'Inglés de negocios esencial', pr2: '0 % completado'
    }
  };
  var ml = document.getElementById('ml');
  function applyLang(l) {
    var t = I18N[l];
    lang = l;
    if (ml) {
      ml.dir = t.dir;
      ml.lang = t.lang;
      ml.classList.toggle('is-rtl', l === 'ar');
      ml.querySelectorAll('[data-t]').forEach(function (el) {
        var k = el.getAttribute('data-t');
        if (t[k] != null) el.textContent = t[k];
      });
    }
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      var on = b.getAttribute('data-lang') === l;
      b.classList.toggle('is-current', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.getAttribute('data-lang');
      if (l === lang) return;
      if (reduced || !ml) { applyLang(l); return; }
      ml.classList.add('is-fading');
      setTimeout(function () { applyLang(l); ml.classList.remove('is-fading'); }, 170);
    });
  });

  function startType() {
    if (typed || reduced) return;
    typed = true;
    var l1 = document.getElementById('term-l1');
    var l2 = document.getElementById('term-l2');
    var row2 = document.getElementById('term-row2');
    var ok = document.getElementById('term-ok');
    var prompt = document.getElementById('term-prompt');
    if (!l1) return;
    var chars = 0;
    var total = L1.length + L2.length;
    l1.textContent = '';
    l2.textContent = '';
    row2.hidden = true;
    ok.hidden = true;
    prompt.hidden = true;
    function caret(el, on) {
      var c = el.parentNode.querySelector('.terminal__caret');
      if (on && !c) {
        c = document.createElement('span');
        c.className = 'terminal__caret';
        el.after(c);
      } else if (!on && c) c.remove();
    }
    function tick() {
      chars += 1;
      if (chars <= L1.length) {
        l1.textContent = L1.slice(0, chars);
        caret(l1, true);
        if (chars === L1.length) { caret(l1, false); setTimeout(tick, 420); return; }
        setTimeout(tick, 35);
        return;
      }
      row2.hidden = false;
      l2.textContent = L2.slice(0, chars - L1.length);
      caret(l2, true);
      if (chars < total) { setTimeout(tick, 35); return; }
      caret(l2, false);
      setTimeout(function () { ok.hidden = false; prompt.hidden = false; }, 600);
    }
    setTimeout(tick, 500);
  }

  document.querySelectorAll('.faq__question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentNode;
      var open = item.classList.contains('is-open');
      document.querySelectorAll('.faq__item').forEach(function (f) {
        f.classList.remove('is-open');
        var b = f.querySelector('.faq__question');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  function setMenu(open) {
    if (!sheet) return;
    sheet.classList.toggle('is-open', open);
    sheet.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }
  document.querySelectorAll('[data-menu]').forEach(function (b) {
    b.addEventListener('click', function () { setMenu(b.getAttribute('data-menu') === 'open'); });
  });
  document.querySelectorAll('[data-close-menu]').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  if (strip) {
    document.querySelectorAll('[data-nudge]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = strip.querySelector('.homepage-card');
        var d = card ? card.getBoundingClientRect().width + 24 : 404;
        var dir = Number(b.getAttribute('data-nudge'));
        try { strip.scrollBy({ left: dir * d, behavior: reduced ? 'auto' : 'smooth' }); }
        catch (err) { strip.scrollLeft += dir * d; }
      });
    });
    var drag = null;
    var justDragged = false;
    strip.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      drag = { x: e.clientX, s: strip.scrollLeft, moved: false };
      strip.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      strip.scrollLeft = drag.s - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!drag) return;
      strip.classList.remove('is-dragging');
      justDragged = drag.moved;
      drag = null;
      setTimeout(function () { justDragged = false; }, 50);
    });
    strip.addEventListener('click', function (e) {
      if (justDragged && e.target.closest('[data-thumb]')) e.preventDefault();
    }, true);
  }

  var preview = document.querySelector('.hero__preview');
  var deck = [];
  if (preview) {
    for (var di = 0; di < preview.children.length; di++) {
      if (preview.children[di].classList.contains('hero__window')) deck.push(preview.children[di]);
    }
  }
  var order = deck.slice();
  var deckNames = { storefront: 'public site', course: 'course page', admin: 'admin dashboard' };

  function deckPlace() {
    order.forEach(function (win, slot) {
      var front = slot === order.length - 1;
      win.classList.toggle('is-back', slot === 0);
      win.classList.toggle('is-mid', slot === 1);
      win.classList.toggle('is-front', front);
      if (front) {
        win.removeAttribute('tabindex');
        win.removeAttribute('role');
        win.removeAttribute('aria-label');
      } else {
        var kind = (win.className.match(/hero__window--(\w+)/) || [])[1];
        win.tabIndex = 0;
        win.setAttribute('role', 'button');
        win.setAttribute('aria-label', 'Bring the ' + (deckNames[kind] || 'window') + ' to the front');
      }
    });
  }

  var nudgeWin = null;
  var nudgeTo = { x: 0, y: 0 };
  var nudgeAt = { x: 0, y: 0 };
  var nudgeOn = false;
  var nudgeRaf = 0;

  function deckTick() {
    nudgeRaf = 0;
    if (!nudgeWin) return;
    nudgeAt.x += (nudgeTo.x - nudgeAt.x) * 0.12;
    nudgeAt.y += (nudgeTo.y - nudgeAt.y) * 0.12;
    var done = !nudgeOn && Math.abs(nudgeAt.x) < 0.15 && Math.abs(nudgeAt.y) < 0.15;
    if (done) {
      nudgeAt.x = 0;
      nudgeAt.y = 0;
      nudgeWin.style.transform = '';
      nudgeWin = null;
      return;
    }
    nudgeWin.style.transform = 'translate(' + nudgeAt.x.toFixed(2) + 'px,' + nudgeAt.y.toFixed(2) + 'px)';
    if (nudgeOn || Math.abs(nudgeTo.x - nudgeAt.x) > 0.15 || Math.abs(nudgeTo.y - nudgeAt.y) > 0.15) {
      nudgeRaf = requestAnimationFrame(deckTick);
    }
  }

  function deckAim(win, e) {
    var box = win.getBoundingClientRect();
    var x = ((e.clientX - box.left + nudgeAt.x) / box.width - 0.5) * 40;
    var y = ((e.clientY - box.top + nudgeAt.y) / box.height - 0.5) * 40;
    var dist = Math.sqrt(x * x + y * y);
    if (dist > 20) {
      x = x / dist * 20;
      y = y / dist * 20;
    }
    nudgeTo.x = x;
    nudgeTo.y = y;
  }

  function deckNudge(win, e) {
    if (deckDrag) return;
    if (!win.classList.contains('is-front')) return;
    if (win.classList.contains('is-lifting')) return;
    nudgeWin = win;
    nudgeOn = true;
    deckAim(win, e);
    if (!nudgeRaf) deckTick();
  }

  function deckRest() {
    nudgeOn = false;
    nudgeTo.x = 0;
    nudgeTo.y = 0;
    if (nudgeWin && !nudgeRaf) deckTick();
  }

  function deckHalt() {
    if (nudgeRaf) cancelAnimationFrame(nudgeRaf);
    nudgeRaf = 0;
    nudgeOn = false;
    nudgeTo.x = 0;
    nudgeTo.y = 0;
    nudgeAt.x = 0;
    nudgeAt.y = 0;
    if (nudgeWin) nudgeWin.style.transform = '';
    nudgeWin = null;
  }

  var tip = preview ? preview.querySelector('.hero__tip') : null;
  var tipOn = false;
  var tipFresh = true;
  var tipTo = { x: 0, y: 0 };
  var tipAt = { x: 0, y: 0 };
  var tipRaf = 0;

  function tipPlace() {
    if (!tip) return;
    tip.style.transform = 'translate3d(' + tipAt.x.toFixed(1) + 'px,' + tipAt.y.toFixed(1) + 'px,0)';
  }

  function tipTick() {
    tipRaf = 0;
    if (!tip) return;
    var k = reduced ? 1 : 0.22;
    tipAt.x += (tipTo.x - tipAt.x) * k;
    tipAt.y += (tipTo.y - tipAt.y) * k;
    tipPlace();
    if (tipOn && (Math.abs(tipTo.x - tipAt.x) > 0.35 || Math.abs(tipTo.y - tipAt.y) > 0.35)) {
      tipRaf = requestAnimationFrame(tipTick);
    }
  }

  function tipAim(e) {
    tipTo.x = e.clientX + 16;
    tipTo.y = e.clientY - 16;
  }

  function tipShow(e) {
    if (!tip) return;
    tipAim(e);
    if (tipFresh) {
      tipAt.x = tipTo.x;
      tipAt.y = tipTo.y;
      tipPlace();
      tipFresh = false;
    }
    if (!tipOn) {
      tipOn = true;
      tip.classList.add('is-on');
    }
    if (!tipRaf) tipTick();
  }

  function tipHide() {
    if (!tip || !tipOn) return;
    tipOn = false;
    tipFresh = true;
    if (tipRaf) cancelAnimationFrame(tipRaf);
    tipRaf = 0;
    tip.classList.remove('is-on');
  }

  function deckShake(win) {
    if (!win || reduced) return;
    win.classList.remove('is-shaking');
    void win.offsetWidth;
    win.classList.add('is-shaking');
    var clear = function () { win.classList.remove('is-shaking'); };
    var onEnd = function (e) {
      if (e.target !== win.querySelector('.window-frame')) return;
      win.removeEventListener('animationend', onEnd);
      clear();
    };
    win.addEventListener('animationend', onEnd);
    window.setTimeout(function () {
      win.removeEventListener('animationend', onEnd);
      clear();
    }, 800);
  }

  function deckLift(win) {
    if (!win) return;
    win.classList.add('is-lifting');
    deckShake(win);
    var clearLift = function () { win.classList.remove('is-lifting'); };
    var onEnd = function (e) {
      if (e.target !== win || e.propertyName !== 'top') return;
      win.removeEventListener('transitionend', onEnd);
      clearLift();
    };
    win.addEventListener('transitionend', onEnd);
    setTimeout(function () {
      win.removeEventListener('transitionend', onEnd);
      clearLift();
    }, 1100);
  }

  function deckFront(win) {
    var at = order.indexOf(win);
    if (at < 0 || at === order.length - 1) return;
    tipHide();
    deckHalt();
    order.splice(at, 1);
    order.push(win);
    deckPlace();
    deckLift(win);
  }

  function deckCycle(dir) {
    if (order.length < 2) return;
    tipHide();
    deckHalt();
    if (dir > 0) order.unshift(order.pop());
    else order.push(order.shift());
    deckPlace();
    deckLift(order[order.length - 1]);
  }

  var deckDrag = null;
  var deckSwiped = false;

  function deckClearDrag() {
    order.forEach(function (win) {
      win.style.top = '';
      win.style.right = '';
      win.style.zIndex = '';
      win.style.transform = '';
    });
  }

  function deckTop() {
    return order.length ? order[order.length - 1] : null;
  }

  function deckPaint(dx) {
    if (!deckDrag) return;
    var top = deckTop();
    if (!top) return;
    order.forEach(function (win) {
      if (win !== top) win.style.transform = '';
    });
    top.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,0,0)';
    top.style.zIndex = '6';
  }

  function deckSettle() {
    preview.classList.add('is-settling');
    window.setTimeout(function () { preview.classList.remove('is-settling'); }, 700);
  }

  function deckEndDrag(e, cancel) {
    if (!deckDrag) return;
    var dx = e && e.clientX != null ? e.clientX - deckDrag.x : 0;
    var moved = deckDrag.moved;
    var win = deckDrag.win;
    var dir = dx < 0 ? 1 : -1;
    var swiped = !cancel && moved && Math.abs(dx) > 36;
    deckDrag = null;
    preview.classList.remove('is-swiping');
    void preview.offsetWidth;
    deckSettle();
    if (swiped) {
      deckSwiped = true;
      deckCycle(dir);
      deckClearDrag();
      window.setTimeout(function () { deckSwiped = false; }, 120);
      return;
    }
    deckClearDrag();
    if (!cancel && !moved && win) deckFront(win);
  }

  function deckOnMove(e) {
    if (!deckDrag) return;
    var dx = e.clientX - deckDrag.x;
    var dy = e.clientY - deckDrag.y;
    if (!deckDrag.moved) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      if (e.pointerType && e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 14) {
        preview.classList.remove('is-swiping');
        deckDrag = null;
        return;
      }
      deckDrag.moved = true;
      preview.classList.add('is-swiping');
      tipHide();
      deckHalt();
    }
    if (e.cancelable) e.preventDefault();
    deckPaint(dx);
  }

  if (preview && order.length) {
    preview.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      var win = e.target.closest('.hero__window');
      if (!win) return;
      if (e.pointerType === 'mouse') e.preventDefault();
      deckHalt();
      order.forEach(function (item) { item.classList.remove('is-lifting'); });
      deckClearDrag();
      preview.classList.add('is-swiping');
      void preview.offsetWidth;
      deckDrag = {
        x: e.clientX,
        y: e.clientY,
        moved: false,
        win: win
      };
    });
    window.addEventListener('pointermove', deckOnMove, { passive: false });
    window.addEventListener('mousemove', deckOnMove, { passive: false });
    window.addEventListener('pointerup', function (e) { deckEndDrag(e, false); });
    window.addEventListener('mouseup', function (e) { deckEndDrag(e, false); });
    window.addEventListener('pointercancel', function (e) { deckEndDrag(e, true); });
  }

  var hoverDeck = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  deck.forEach(function (win) {
    win.addEventListener('click', function () {
      if (deckSwiped) return;
      deckFront(win);
    });
    win.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      deckFront(win);
    });
  });
  if (preview && hoverDeck) {
    preview.addEventListener('mousemove', function (e) {
      var win = e.target.closest('.hero__window');
      if (!win) {
        tipHide();
        deckRest();
        return;
      }
      if (win.classList.contains('is-front') && !win.classList.contains('is-lifting') && !reduced) {
        tipHide();
        deckNudge(win, e);
        return;
      }
      deckRest();
      if (!tip || win.classList.contains('is-front') || win.classList.contains('is-lifting')) {
        tipHide();
        return;
      }
      tipShow(e);
    });
    preview.addEventListener('mouseleave', function () {
      tipHide();
      deckRest();
    });
  }
  if (order.length) {
    deckPlace();
    deckShake(deckTop());
  }

  function copyFallback(text) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(field);
    field.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    field.remove();
    return ok ? Promise.resolve() : Promise.reject();
  }

  function copyText(text) {
    if (!navigator.clipboard || !window.isSecureContext) return copyFallback(text);
    return navigator.clipboard.writeText(text).catch(function () { return copyFallback(text); });
  }

  document.querySelectorAll('.demo-list__copy, .terminal__copy, .demo-access__field, .live-demo__fill').forEach(function (btn) {
    var label = btn.getAttribute('aria-label');
    var timer;
    btn.addEventListener('click', function () {
      copyText(btn.dataset.copy).then(function () {
        clearTimeout(timer);
        btn.classList.add('is-copied');
        btn.setAttribute('aria-label', 'Copied');
        timer = setTimeout(function () {
          btn.classList.remove('is-copied');
          btn.setAttribute('aria-label', label);
        }, 1600);
      });
    });
  });

  measure();
})();
