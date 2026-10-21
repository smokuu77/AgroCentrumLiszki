(function () {
  'use strict';

  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  var desktopQuery = window.matchMedia('(min-width: 56rem)');

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    menu.classList.toggle('is-open', open);
  }

  function isMenuOpen() {
    return toggle && toggle.getAttribute('aria-expanded') === 'true';
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!isMenuOpen());
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isMenuOpen()) {
        setMenu(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (isMenuOpen() && !menu.contains(e.target) && !toggle.contains(e.target)) {
        setMenu(false);
      }
    });

    desktopQuery.addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  var header = document.querySelector('[data-header]');
  var sentinel = document.querySelector('[data-sentinel]');

  if (header && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  var navLinks = document.querySelectorAll('.nav__link[href^="#"]');

  if (navLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    navLinks.forEach(function (link) {
      var section = document.querySelector(link.getAttribute('href'));
      if (section) spy.observe(section);
    });

    var startSection = document.getElementById('start');
    if (startSection) spy.observe(startSection);
  }

  document.querySelectorAll('[data-tabs]').forEach(function (tabsRoot) {
    var tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll('[role="tab"]'));
    var tablist = tabsRoot.querySelector('[role="tablist"]');
    var leaveTimer = null;

    tabsRoot.querySelectorAll('.tabpanel').forEach(function (panel) {
      var chips = panel.querySelectorAll('.chips li');
      panel.style.setProperty('--chips', chips.length);
      chips.forEach(function (chip, i) { chip.style.setProperty('--i', i); });
    });

    tabs.forEach(function (tab) {
      tab.insertAdjacentHTML('beforeend',
        '<svg class="tab__outline" aria-hidden="true" focusable="false">' +
        '<rect width="100%" height="100%" rx="8" ry="8" pathLength="1"/></svg>');
    });

    function measureOutlines() {
      tabs.forEach(function (tab) {
        var w = tab.offsetWidth + 2;
        var h = tab.offsetHeight + 2;
        var r = Math.min(8, w / 2, h / 2);
        var perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
        var f = (w / 2 - r) / perimeter;
        tab.style.setProperty('--o-from', (-f).toFixed(4) + 'px');
        tab.style.setProperty('--o-to', (0.5 - f).toFixed(4) + 'px');
      });
    }

    measureOutlines();
    window.addEventListener('resize', measureOutlines);
    if (document.fonts) document.fonts.ready.then(measureOutlines);

    function currentTab() {
      return tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    }

    function restart(el, cls) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    function select(tab, focus) {
      var previous = currentTab();
      if (tab === previous) {
        if (focus) tab.focus();
        return;
      }

      tabsRoot.querySelectorAll('.tabpanel').forEach(function (p) {
        p.classList.remove('is-leaving', 'is-entering');
      });

      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (!panel) return;
        panel.hidden = !selected;
        if (selected) restart(panel, 'is-entering');
        else if (t === previous) restart(panel, 'is-leaving');
      });

      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(function () {
        tabsRoot.querySelectorAll('.tabpanel.is-leaving').forEach(function (p) {
          p.classList.remove('is-leaving');
        });
      }, 350);

      tabs.forEach(function (t) { t.classList.remove('is-drawing'); });
      restart(tab, 'is-drawing');
      if (focus) tab.focus({ preventScroll: true });

      if (!desktopQuery.matches) {
        tablist.scrollTo({
          left: tab.offsetLeft - (tablist.clientWidth - tab.offsetWidth) / 2,
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        select(tab, false);
      });

      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          select(next, true);
        }
      });
    });
  });

  var hours = {
    1: [420, 1020], 2: [420, 1020], 3: [420, 1020], 4: [420, 1020], 5: [420, 1020],
    6: [420, 780]
  };

  var now = new Date();
  var day = now.getDay();
  var minutes = now.getHours() * 60 + now.getMinutes();
  var today = hours[day];
  var isOpen = !!today && minutes >= today[0] && minutes < today[1];

  function fmt(m) {
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  var statusText;
  if (isOpen) {
    statusText = 'Liszki: otwarte do\u00a0' + fmt(today[1]);
  } else if (today && minutes < today[0]) {
    statusText = 'Liszki: zamknięte, otwieramy dziś o\u00a0' + fmt(today[0]);
  } else {
    statusText = 'Liszki: teraz zamknięte';
  }

  document.querySelectorAll('[data-open-status]').forEach(function (el) {
    el.dataset.state = isOpen ? 'open' : 'closed';
    var text = el.querySelector('.status__text');
    if (text) text.textContent = statusText;
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var counters = document.querySelectorAll('[data-count]');
  var starsFill = document.querySelector('[data-stars-fill]');

  if (!reduceMotion && counters.length) {
    var countDuration = 1800;
    var countDelay = 700;
    var targetFill = starsFill ? parseFloat(starsFill.style.getPropertyValue('--fill')) : 0;

    function renderCounters(progress) {
      counters.forEach(function (el) {
        var target = parseFloat(el.dataset.count);
        var decimals = parseInt(el.dataset.decimals || '0', 10);
        el.textContent = (target * progress).toFixed(decimals);
      });
      if (starsFill) starsFill.style.setProperty('--fill', (targetFill * progress) + '%');
    }

    renderCounters(0);

    setTimeout(function () {
      var start = null;
      function tick(ts) {
        if (start === null) start = ts;
        var t = Math.min((ts - start) / countDuration, 1);
        renderCounters(1 - Math.pow(1 - t, 3));
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, countDelay);
  }

  var progressBar = document.querySelector('[data-scroll-progress]');

  if (progressBar) {
    var progressTicking = false;

    function updateProgress() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.setProperty('--progress', max > 0 ? window.scrollY / max : 0);
      progressTicking = false;
    }

    window.addEventListener('scroll', function () {
      if (!progressTicking) {
        progressTicking = true;
        requestAnimationFrame(updateProgress);
      }
    }, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  var callFab = document.querySelector('[data-call-fab]');
  var aboutSection = document.getElementById('o-nas');
  var footer = document.querySelector('.site-footer');

  if (callFab && aboutSection && 'IntersectionObserver' in window) {
    var aboutReached = false;
    var footerInView = false;

    var fabObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target === aboutSection) {
          aboutReached = entry.isIntersecting || entry.boundingClientRect.top < 0;
        } else {
          footerInView = entry.isIntersecting;
        }
      });
      var visible = aboutReached && !footerInView;
      callFab.classList.toggle('is-visible', visible);
      callFab.tabIndex = visible ? 0 : -1;
    });
    fabObserver.observe(aboutSection);
    if (footer) fabObserver.observe(footer);
  } else if (callFab) {
    callFab.classList.add('is-visible');
  }

  var revealEls = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });

    revealEls.forEach(function (el) {
      revealer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  var promoVideo = document.querySelector('[data-promo-video]');
  var promoToggle = document.querySelector('[data-promo-toggle]');

  if (promoVideo && promoToggle) {
    var saveData = navigator.connection && navigator.connection.saveData;
    var userPaused = reduceMotion || saveData;

    function setPromoState(playing) {
      promoToggle.setAttribute('data-state', playing ? 'playing' : 'paused');
      promoToggle.setAttribute('aria-label', playing ? 'Zatrzymaj film' : 'Odtwórz film');
    }

    function playPromo() {
      var attempt = promoVideo.play();
      if (attempt && attempt.catch) attempt.catch(function () { setPromoState(false); });
    }

    promoVideo.addEventListener('play', function () { setPromoState(true); });
    promoVideo.addEventListener('pause', function () { setPromoState(false); });

    promoToggle.addEventListener('click', function () {
      if (promoVideo.paused) {
        userPaused = false;
        playPromo();
      } else {
        userPaused = true;
        promoVideo.pause();
      }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!userPaused) playPromo();
          } else if (!promoVideo.paused) {
            promoVideo.pause();
          }
        });
      }, { threshold: 0.35 }).observe(promoVideo);
    }
  }

  var gallery = document.querySelector('[data-gallery]');
  var lightbox = document.querySelector('[data-lightbox]');
  var openLightbox = null;

  function unlockScroll() {
    if (document.querySelector('dialog[open]')) return;
    document.documentElement.style.overflow = '';
    document.documentElement.style.scrollbarGutter = '';
  }

  if (lightbox && typeof lightbox.showModal === 'function') {
    var links = [];
    var lbImg = lightbox.querySelector('[data-lightbox-img]');
    var lbCaption = lightbox.querySelector('[data-lightbox-caption]');
    var lbCount = lightbox.querySelector('[data-lightbox-count]');
    var lbFigure = lightbox.querySelector('.lightbox__figure');
    var current = 0;
    var lastFocus = null;
    var lbClosing = false;
    var FLY_MS = 550;
    var FLY_EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

    function thumbOf(i) {
      return links[i].querySelector('img');
    }

    function sizeImage() {
      var thumb = thumbOf(current);
      var ratio = (thumb.naturalWidth || 3) / (thumb.naturalHeight || 4);
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      var padX = parseFloat(getComputedStyle(lbFigure).paddingLeft) || 16;
      var maxW = Math.min(60 * rem, window.innerWidth - padX * 2);
      var maxH = window.innerHeight - 9 * rem;
      var width = Math.min(maxW, maxH * ratio);
      lbImg.style.width = width + 'px';
      lbImg.style.height = (width / ratio) + 'px';
    }

    function show(index) {
      links[current].classList.remove('is-flying');
      current = (index + links.length) % links.length;
      var link = links[current];
      var thumb = thumbOf(current);
      var large = link.getAttribute('href');

      lbImg.src = thumb.currentSrc || thumb.src;
      lbImg.alt = thumb.alt;
      var full = new Image();
      full.onload = function () {
        if (links[current] === link) lbImg.src = large;
      };
      full.src = large;

      lbCaption.textContent = link.dataset.caption || '';
      lbCount.textContent = (current + 1) + ' / ' + links.length;
      sizeImage();
      if (lightbox.open) link.classList.add('is-flying');

      [current + 1, current - 1].forEach(function (i) {
        new Image().src = links[(i + links.length) % links.length].getAttribute('href');
      });
    }

    function thumbFrame() {
      var thumb = thumbOf(current);
      var t = links[current].getBoundingClientRect();
      var f = lbImg.getBoundingClientRect();
      if (!t.width || t.bottom < 0 || t.top > window.innerHeight) return null;

      var s = Math.max(t.width / f.width, t.height / f.height);
      var pos = getComputedStyle(thumb).objectPosition.split(' ');
      var px = (parseFloat(pos[0]) || 50) / 100;
      var py = (parseFloat(pos[1]) || 50) / 100;
      var extraX = f.width - t.width / s;
      var extraY = f.height - t.height / s;
      var left = extraX * px;
      var top = extraY * py;
      var radius = parseFloat(getComputedStyle(links[current]).borderTopLeftRadius) || 0;

      return {
        transform: 'translate(' + (t.left - f.left - s * left) + 'px, ' + (t.top - f.top - s * top) + 'px) scale(' + s + ')',
        clipPath: 'inset(' + top + 'px ' + (extraX - left) + 'px ' + (extraY - top) + 'px ' + left + 'px round ' + (radius / s) + 'px)'
      };
    }

    function imageFrame() {
      var radius = parseFloat(getComputedStyle(lbImg).borderTopLeftRadius) || 0;
      return { transform: 'translate(0px, 0px) scale(1)', clipPath: 'inset(0px 0px 0px 0px round ' + radius + 'px)' };
    }

    function fly(from, to) {
      lbImg.style.transformOrigin = '0 0';
      return lbImg.animate([from, to], { duration: FLY_MS, easing: FLY_EASE });
    }

    openLightbox = function (set, index) {
      links = set;
      current = 0;
      lastFocus = document.activeElement;
      lbClosing = false;
      document.documentElement.style.scrollbarGutter = 'stable';
      document.documentElement.style.overflow = 'hidden';
      show(index);
      lightbox.showModal();
      links[current].classList.add('is-flying');
      void lightbox.offsetWidth;
      lightbox.classList.add('is-open');

      var from = reduceMotion ? null : thumbFrame();
      if (from) fly(from, imageFrame());
    };

    // Przejście do sąsiedniego zdjęcia: stare odjeżdża w bok, nowe wjeżdża z drugiej strony
    var slideOut = null;
    var slideTarget = 0;
    var SLIDE_PX = 48;

    function finishSlide() {
      if (!slideOut) return;
      slideOut.onfinish = null;
      slideOut.cancel();
      slideOut = null;
      lbCaption.parentNode.getAnimations().forEach(function (a) { a.cancel(); });
      show(slideTarget);
    }

    function go(delta) {
      if (lbClosing || links.length < 2) return;
      finishSlide();
      var target = current + delta;
      if (reduceMotion || !lightbox.open) {
        show(target);
        return;
      }

      var dir = delta > 0 ? 1 : -1;
      var caption = lbCaption.parentNode;
      lbImg.getAnimations().forEach(function (a) { a.cancel(); });
      slideTarget = target;
      slideOut = lbImg.animate([
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(' + (-dir * SLIDE_PX) + 'px)', opacity: 0 }
      ], { duration: 170, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
      caption.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 170, fill: 'forwards' });

      slideOut.onfinish = function () {
        var done = slideOut;
        slideOut = null;
        show(target);
        done.cancel();
        lbImg.animate([
          { transform: 'translateX(' + (dir * SLIDE_PX) + 'px)', opacity: 0 },
          { transform: 'translateX(0)', opacity: 1 }
        ], { duration: 340, easing: FLY_EASE });
        caption.getAnimations().forEach(function (a) { a.cancel(); });
        caption.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 340, easing: FLY_EASE });
      };
    }

    function closeLightbox() {
      if (!lightbox.open || lbClosing) return;
      finishSlide();
      lbImg.getAnimations().forEach(function (a) { a.cancel(); });
      lbClosing = true;
      lightbox.classList.remove('is-open');

      var to = reduceMotion ? null : thumbFrame();
      if (!to) {
        lightbox.close();
        return;
      }
      fly(imageFrame(), to).onfinish = function () {
        lightbox.close();
      };
    }

    if (gallery) {
      var shopLinks = Array.prototype.slice.call(gallery.querySelectorAll('.gallery__link'));
      shopLinks.forEach(function (link, i) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          openLightbox(shopLinks, i);
        });
      });
    }

    lightbox.querySelector('[data-lightbox-prev]').addEventListener('click', function () { go(-1); });
    lightbox.querySelector('[data-lightbox-next]').addEventListener('click', function () { go(1); });
    lightbox.querySelector('[data-lightbox-close]').addEventListener('click', closeLightbox);

    lightbox.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeLightbox();
    });

    lightbox.addEventListener('keydown', function (e) {
      if (lbClosing) return;
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target === lbFigure) closeLightbox();
    });

    lightbox.addEventListener('close', function () {
      lbClosing = false;
      lightbox.classList.remove('is-open');
      links.forEach(function (link) { link.classList.remove('is-flying'); });
      lbImg.style.transformOrigin = '';
      unlockScroll();
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    });

    window.addEventListener('resize', function () {
      if (lightbox.open) sizeImage();
    });

    var touchX = null;
    lightbox.addEventListener('touchstart', function (e) {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      touchX = null;
    });
  }

  var fan = document.querySelector('[data-fan]');
  var works = document.querySelector('[data-works]');

  if (fan && works && typeof works.showModal === 'function') {
    var fanCards = Array.prototype.slice.call(fan.querySelectorAll('[data-fan-card]'));
    var albumsView = works.querySelector('[data-works-albums]');
    var albumView = works.querySelector('[data-works-album]');
    var albumsList = albumsView.querySelector('.works__albums');
    var albumBar = albumView.querySelector('.works__bar');
    var albumCards = Array.prototype.slice.call(works.querySelectorAll('[data-album-card]'));
    var chips = Array.prototype.slice.call(works.querySelectorAll('[data-album-chip]'));
    var grids = Array.prototype.slice.call(works.querySelectorAll('[data-album]'));
    var banner = works.querySelector('[data-works-banner]');
    var bannerImg = banner.querySelector('[data-works-banner-img]');
    var bannerNum = banner.querySelector('[data-works-banner-num]');
    var bannerTitle = banner.querySelector('[data-works-banner-title]');
    var bannerDesc = banner.querySelector('[data-works-banner-desc]');
    var flyers = [];
    var landTimer = null;
    var worksClosing = false;
    var currentAlbum = null;
    var FLY_IN_MS = 800;
    var FLY_STAGGER = 90;
    var ALBUM_FLY_MS = 650;

    function cardFor(key) {
      return albumCards.filter(function (c) { return c.dataset.albumCard === key; })[0];
    }

    function gridFor(key) {
      return grids.filter(function (g) { return g.dataset.album === key; })[0];
    }

    function fanState(card) {
      var box = fan.getBoundingClientRect();
      return {
        left: box.left + card.offsetLeft,
        top: box.top + card.offsetTop,
        width: card.offsetWidth,
        height: card.offsetHeight,
        transform: getComputedStyle(card).transform
      };
    }

    function rectState(el) {
      var r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height, transform: 'none' };
    }

    function apply(el, s) {
      el.style.left = s.left + 'px';
      el.style.top = s.top + 'px';
      el.style.width = s.width + 'px';
      el.style.height = s.height + 'px';
      el.style.transform = s.transform;
    }

    function makeFlyer(src, extraClass) {
      var flyer = document.createElement('div');
      flyer.className = 'works__flyer' + (extraClass ? ' ' + extraClass : '');
      flyer.setAttribute('aria-hidden', 'true');
      var img = document.createElement('img');
      img.alt = '';
      img.src = src;
      flyer.appendChild(img);
      works.appendChild(flyer);
      return flyer;
    }

    function clearFlyers() {
      clearTimeout(landTimer);
      flyers.forEach(function (f) { f.remove(); });
      flyers = [];
      albumCards.forEach(function (c) { c.classList.remove('is-landing'); });
      banner.classList.remove('is-landing');
    }

    function restart(el, cls) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    function coverSrc(grid, size) {
      return 'img/realizacje/' + size + '/' + grid.dataset.cover + '.webp';
    }

    grids.forEach(function (grid) {
      var tiles = Array.prototype.slice.call(grid.querySelectorAll('.works__tile'));
      tiles.forEach(function (tile, i) {
        tile.parentNode.style.setProperty('--i', Math.min(i, 14));
        tile.addEventListener('click', function (e) {
          if (!openLightbox) return;
          e.preventDefault();
          openLightbox(tiles, i);
        });
      });
    });

    function showAlbums(animate) {
      currentAlbum = null;
      albumView.hidden = true;
      albumsView.hidden = false;
      albumsView.classList.remove('is-entering');
      albumsList.querySelectorAll('.works__albums-item').forEach(function (li) { li.classList.remove('is-target'); });
      if (animate) {
        works.scrollTop = 0;
        restart(albumsView, 'is-entering');
        restart(albumsList, 'is-in');
      }
    }

    function openAlbum(key, fromCard) {
      var grid = gridFor(key);
      if (!grid) return;
      clearFlyers();
      currentAlbum = key;

      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', chip.dataset.albumChip === key ? 'true' : 'false');
      });
      grids.forEach(function (g) {
        g.hidden = g !== grid;
        g.classList.remove('is-in');
      });

      bannerImg.src = coverSrc(grid, 'mini');
      var large = new Image();
      large.onload = function () {
        if (currentAlbum === key) bannerImg.src = large.src;
      };
      large.src = coverSrc(grid, 'duze');
      bannerNum.textContent = grid.dataset.num;
      bannerTitle.textContent = grid.dataset.title;
      bannerDesc.textContent = grid.dataset.desc;

      var from = fromCard && !reduceMotion ? rectState(fromCard) : null;
      var wasAlbums = !albumsView.hidden;

      albumsView.hidden = true;
      albumView.classList.remove('is-entering');
      banner.classList.remove('is-swapping');
      albumView.hidden = false;
      works.scrollTop = 0;
      if (from) restart(albumBar, 'is-entering');
      else if (wasAlbums) restart(albumView, 'is-entering');

      if (from) {
        banner.classList.add('is-landing');
        var flyer = makeFlyer(coverSrc(grid, 'mini'), 'works__flyer--plain');
        flyer.style.transition = 'none';
        apply(flyer, from);
        flyers.push(flyer);
        void flyer.offsetWidth;
        flyer.style.transition = '';
        apply(flyer, rectState(banner));
        landTimer = setTimeout(clearFlyers, ALBUM_FLY_MS + 50);
      } else {
        restart(banner, 'is-swapping');
      }

      restart(grid, 'is-in');

      var activeChip = chips.filter(function (c) { return c.dataset.albumChip === key; })[0];
      if (activeChip) {
        if (fromCard) activeChip.focus({ preventScroll: true });
        activeChip.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    }

    function openWorks() {
      if (works.open) return;
      worksClosing = false;
      document.documentElement.style.scrollbarGutter = 'stable';
      document.documentElement.style.overflow = 'hidden';

      showAlbums(false);
      works.showModal();
      works.scrollTop = 0;

      var pairs = reduceMotion ? [] : fanCards.map(function (card) {
        return { card: card, target: cardFor(card.dataset.fanCard) };
      }).filter(function (p) { return p.target; });

      pairs.forEach(function (p) {
        p.target.classList.add('is-landing');
        p.target.parentNode.classList.add('is-target');
      });

      flyers = pairs.map(function (p) {
        var flyer = makeFlyer(p.card.querySelector('img').currentSrc || p.card.querySelector('img').src);
        flyer.style.transition = 'none';
        apply(flyer, fanState(p.card));
        return flyer;
      });

      fan.classList.add('is-expanded');
      restart(albumsList, 'is-in');
      void works.offsetWidth;
      works.classList.add('is-open');

      flyers.forEach(function (flyer, i) {
        flyer.style.transition = '';
        flyer.style.setProperty('--d', (i * FLY_STAGGER) + 'ms');
        flyer.classList.add('is-landed');
        apply(flyer, rectState(pairs[i].target));
      });

      landTimer = setTimeout(clearFlyers, FLY_IN_MS + FLY_STAGGER * pairs.length + 50);
    }

    function closeWorks() {
      if (!works.open || worksClosing) return;
      worksClosing = true;
      clearFlyers();

      var flyBack = !reduceMotion && !albumsView.hidden;
      works.classList.remove('is-open');

      if (!flyBack) {
        setTimeout(function () {
          if (works.open) works.close();
        }, reduceMotion ? 0 : 350);
        return;
      }

      var pairs = fanCards.map(function (card) {
        return { card: card, target: cardFor(card.dataset.fanCard) };
      }).filter(function (p) { return p.target; });

      flyers = pairs.map(function (p) {
        var flyer = makeFlyer(p.card.querySelector('img').currentSrc || p.card.querySelector('img').src, 'is-landed');
        flyer.style.transition = 'none';
        apply(flyer, rectState(p.target));
        p.target.classList.add('is-landing');
        return flyer;
      });

      void works.offsetWidth;

      flyers.forEach(function (flyer, i) {
        flyer.style.transition = '';
        flyer.style.setProperty('--d', ((flyers.length - 1 - i) * FLY_STAGGER) + 'ms');
        flyer.classList.remove('is-landed');
        apply(flyer, fanState(pairs[i].card));
      });

      setTimeout(function () {
        if (works.open) works.close();
      }, FLY_IN_MS + FLY_STAGGER * pairs.length + 100);
    }

    works.addEventListener('close', function () {
      worksClosing = false;
      clearFlyers();
      works.classList.remove('is-open');
      fan.classList.remove('is-expanded');
      unlockScroll();
      fan.focus({ preventScroll: true });
    });

    fan.addEventListener('click', openWorks);
    works.querySelector('[data-works-close]').addEventListener('click', closeWorks);

    works.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeWorks();
    });

    albumCards.forEach(function (card) {
      card.addEventListener('click', function () {
        openAlbum(card.dataset.albumCard, card);
      });
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (chip.dataset.albumChip !== currentAlbum) openAlbum(chip.dataset.albumChip, null);
      });
    });

    works.querySelector('[data-works-back]').addEventListener('click', function () {
      var last = currentAlbum;
      clearFlyers();
      showAlbums(true);
      var card = cardFor(last);
      if (card) card.focus({ preventScroll: true });
    });

    window.addEventListener('resize', function () {
      if (flyers.length) clearFlyers();
    });
  }

  var productsData = document.querySelector('[data-products]');
  var productDialog = document.querySelector('[data-product-dialog]');
  var peek = document.querySelector('[data-product-peek]');

  if (productsData && productDialog && typeof productDialog.showModal === 'function') {
    var products = JSON.parse(productsData.textContent);
    var hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    var productChips = Array.prototype.slice.call(document.querySelectorAll('[data-product]'));
    var pdPanel = productDialog.querySelector('.product__panel');
    var pdMedia = productDialog.querySelector('.product__media');
    var pdImg = productDialog.querySelector('[data-product-img]');
    var pdBrand = productDialog.querySelector('[data-product-brand]');
    var pdName = productDialog.querySelector('[data-product-name]');
    var pdDesc = productDialog.querySelector('[data-product-desc]');
    var pdVariants = productDialog.querySelector('[data-product-variants]');
    var pdSizesRow = productDialog.querySelector('[data-product-sizes-row]');
    var pdSizes = productDialog.querySelector('[data-product-sizes]');
    var pdNav = productDialog.querySelector('.product__nav');
    var pdCount = productDialog.querySelector('[data-product-count]');
    var pdList = [];
    var pdIndex = 0;
    var pdChip = null;
    var pdClosing = false;
    var pdCloseTimer = null;

    function imgSrc(name, mini) {
      return 'img/produkty/' + (mini ? 'mini/' : '') + name + '.webp';
    }

    // Najpierw miniatura z chipa (jest już w cache), potem pełne zdjęcie
    function setImage(img, item) {
      img.width = item.w;
      img.height = item.h;
      img.dataset.want = item.img;
      img.src = imgSrc(item.img, true);
      var full = new Image();
      full.onload = function () {
        if (img.dataset.want === item.img) img.src = full.src;
      };
      full.src = imgSrc(item.img);
    }

    function sizesOf(p, item) {
      return item.sizes || p.sizes || '';
    }

    function renderVariant(i, animate) {
      var p = products[pdChip.dataset.product];
      var item = p.items[i];
      setImage(pdImg, item);
      pdImg.alt = p.name + (item.label ? ', ' + item.label : '');
      if (animate) {
        pdImg.classList.remove('is-in');
        void pdImg.offsetWidth;
        pdImg.classList.add('is-in');
      }

      var sizes = sizesOf(p, item);
      pdSizes.textContent = sizes;
      pdSizesRow.hidden = !sizes;

      pdVariants.querySelectorAll('button').forEach(function (b, j) {
        b.setAttribute('aria-pressed', String(j === i));
      });
    }

    function renderProduct() {
      var p = products[pdChip.dataset.product];

      pdBrand.textContent = p.brand || '';
      pdBrand.hidden = !p.brand;
      pdName.textContent = p.name;
      pdDesc.textContent = p.desc;

      pdVariants.innerHTML = '';
      if (p.items.length > 1) {
        p.items.forEach(function (item, i) {
          var li = document.createElement('li');
          var btn = document.createElement('button');
          var thumb = document.createElement('img');
          btn.type = 'button';
          btn.className = 'product__variant';
          thumb.src = imgSrc(item.img, true);
          thumb.alt = '';
          btn.appendChild(thumb);
          btn.appendChild(document.createTextNode(item.label));
          btn.addEventListener('click', function () { renderVariant(i, true); });
          li.appendChild(btn);
          pdVariants.appendChild(li);
        });
      }
      pdVariants.hidden = p.items.length < 2;
      renderVariant(0);

      pdCount.textContent = (pdIndex + 1) + ' / ' + pdList.length;
      pdNav.hidden = pdList.length < 2;

      [pdIndex + 1, pdIndex - 1].forEach(function (i) {
        var chip = pdList[(i + pdList.length) % pdList.length];
        new Image().src = imgSrc(products[chip.dataset.product].items[0].img);
      });
    }

    // Zmiana produktu: zdjęcie i opis odjeżdżają w bok, nowe wjeżdżają z drugiej strony
    var pdBody = productDialog.querySelector('.product__body');
    var pdSlideOut = null;
    var pdSlideTarget = 0;

    function applyProduct(index) {
      pdIndex = (index + pdList.length) % pdList.length;
      pdChip = pdList[pdIndex];
      pdPanel.scrollTop = 0;
      renderProduct();
    }

    function finishProductSlide() {
      if (!pdSlideOut) return;
      pdSlideOut.onfinish = null;
      pdSlideOut = null;
      [pdImg, pdBody].forEach(function (el) {
        el.getAnimations().forEach(function (a) { a.cancel(); });
      });
      applyProduct(pdSlideTarget);
    }

    function stepProduct(d) {
      if (pdList.length < 2 || pdClosing) return;
      finishProductSlide();
      var target = pdIndex + d;
      if (reduceMotion) {
        applyProduct(target);
        return;
      }

      var dir = d > 0 ? 1 : -1;
      var outFrames = [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(' + (-dir * 32) + 'px)', opacity: 0 }
      ];
      var inFrames = [
        { transform: 'translateX(' + (dir * 32) + 'px)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ];
      pdImg.classList.remove('is-in');
      pdSlideTarget = target;
      pdBody.animate(outFrames, { duration: 160, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
      pdSlideOut = pdImg.animate(outFrames, { duration: 160, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });

      pdSlideOut.onfinish = function () {
        pdSlideOut = null;
        [pdImg, pdBody].forEach(function (el) {
          el.getAnimations().forEach(function (a) { a.cancel(); });
        });
        applyProduct(target);
        pdImg.animate(inFrames, { duration: 340, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
        pdBody.animate(inFrames, { duration: 340, delay: 40, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', fill: 'backwards' });
      };
    }

    function openProduct(chip) {
      var panel = chip.closest('.tabpanel') || document;
      pdList = Array.prototype.slice.call(panel.querySelectorAll('[data-product]'));
      pdIndex = Math.max(pdList.indexOf(chip), 0);
      pdChip = chip;
      hidePeek(true);
      clearTimeout(pdCloseTimer);
      pdClosing = false;
      renderProduct();

      document.documentElement.style.scrollbarGutter = 'stable';
      document.documentElement.style.overflow = 'hidden';
      productDialog.showModal();
      pdPanel.scrollTop = 0;
      void productDialog.offsetWidth;
      productDialog.classList.add('is-open');
    }

    function closeProduct() {
      if (!productDialog.open || pdClosing) return;
      finishProductSlide();
      pdClosing = true;
      productDialog.classList.remove('is-open');
      pdCloseTimer = setTimeout(function () {
        productDialog.close();
      }, reduceMotion ? 0 : 300);
    }

    productDialog.addEventListener('close', function () {
      pdClosing = false;
      productDialog.classList.remove('is-open');
      unlockScroll();
      if (pdList.indexOf(pdChip) !== -1 && !pdChip.closest('[hidden]')) pdChip.focus({ preventScroll: true });
    });

    productDialog.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeProduct();
    });

    productDialog.addEventListener('click', function (e) {
      if (e.target === productDialog) closeProduct();
    });

    productDialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') stepProduct(-1);
      else if (e.key === 'ArrowRight') stepProduct(1);
    });

    productDialog.querySelector('[data-product-close]').addEventListener('click', closeProduct);
    productDialog.querySelector('[data-product-prev]').addEventListener('click', function () { stepProduct(-1); });
    productDialog.querySelector('[data-product-next]').addEventListener('click', function () { stepProduct(1); });

    // Telefon: przesunięcie zdjęcia w bok zmienia produkt, przeciągnięcie w dół zamyka panel
    var pdTouch = null;
    productDialog.addEventListener('touchstart', function (e) {
      pdTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY, onMedia: pdMedia.contains(e.target), top: pdPanel.scrollTop <= 0 };
    }, { passive: true });
    productDialog.addEventListener('touchend', function (e) {
      if (!pdTouch) return;
      var dx = e.changedTouches[0].clientX - pdTouch.x;
      var dy = e.changedTouches[0].clientY - pdTouch.y;
      if (pdTouch.onMedia && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) stepProduct(dx < 0 ? 1 : -1);
      else if (pdTouch.top && dy > 90 && dy > Math.abs(dx)) closeProduct();
      pdTouch = null;
    });

    var peekTimer = null;
    var siteHeader = document.querySelector('[data-header]');

    function showPeek(chip) {
      var p = products[chip.dataset.product];
      var item = p.items[0];
      var count = p.items.length;

      peek.querySelector('[data-peek-brand]').textContent = p.brand || '';
      peek.querySelector('[data-peek-name]').textContent = p.name;
      peek.querySelector('[data-peek-sizes]').textContent =
        count > 1 ? count + (count < 5 ? ' warianty' : ' wariantów') : sizesOf(p, item);
      setImage(peek.querySelector('[data-peek-img]'), item);

      var r = chip.getBoundingClientRect();
      var w = peek.offsetWidth;
      var h = peek.offsetHeight;
      var gap = 12;
      var minTop = (siteHeader ? siteHeader.getBoundingClientRect().bottom : 0) + 8;
      var maxTop = window.innerHeight - h - 8;
      var left = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), window.innerWidth - w - 8);
      var spaceAbove = r.top - gap - minTop;
      var spaceBelow = window.innerHeight - 8 - r.bottom - gap;
      var side = h <= spaceAbove || spaceAbove >= spaceBelow ? 'top' : 'bottom';
      var top = side === 'top' ? r.top - h - gap : r.bottom + gap;
      // Gdy dymek nie mieści się w całości, dociskamy go do krawędzi ekranu
      if (top < minTop || top > maxTop) {
        top = Math.min(Math.max(top, minTop), maxTop);
        side = 'none';
      }

      var wasVisible = peek.classList.contains('is-visible');
      peek.dataset.side = side;
      peek.style.left = left + 'px';
      peek.style.top = top + 'px';
      peek.style.setProperty('--arrow-x', Math.min(Math.max(r.left + r.width / 2 - left, 18), w - 18) + 'px');
      // Przy pierwszym pokazaniu pozycja ustawia się od razu, animuje się tylko wejście
      if (!wasVisible) void peek.offsetWidth;
      peek.classList.add('is-visible');
    }

    function hidePeek(now) {
      if (!peek) return;
      clearTimeout(peekTimer);
      if (now) {
        peek.classList.remove('is-visible');
        return;
      }
      peekTimer = setTimeout(function () {
        peek.classList.remove('is-visible');
      }, 100);
    }

    if (peek) {
      productChips.forEach(function (chip) {
        chip.addEventListener('pointerenter', function (e) {
          if (e.pointerType !== 'mouse' || !hoverQuery.matches) return;
          clearTimeout(peekTimer);
          var delay = peek.classList.contains('is-visible') ? 0 : 140;
          peekTimer = setTimeout(function () { showPeek(chip); }, delay);
        });
        chip.addEventListener('pointerleave', function () { hidePeek(false); });
      });

      window.addEventListener('scroll', function () { hidePeek(true); }, { passive: true });
    }

    productChips.forEach(function (chip) {
      chip.addEventListener('click', function () { openProduct(chip); });
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
