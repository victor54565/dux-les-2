'use strict';

/* ─────────────────────────────────────────
   1. Scroll-reveal via IntersectionObserver
   Elements need class "reveal-up" or "reveal-right"
   and optional data-delay="Nms" attribute.
───────────────────────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll('.reveal-up, .reveal-right, .reveal-left, .reveal-scale, .reveal-blur');

  // Apply data-delay as CSS custom property so transition-delay works
  els.forEach(el => {
    const ms = parseInt(el.dataset.delay || '0', 10);
    el.style.setProperty('--reveal-delay', ms + 'ms');
  });

  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything immediately
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        // Повторяем анимацию каждый раз при входе в зону видимости —
        // и сбрасываем при выходе, чтобы работало при скролле вверх/вниз.
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach(el => observer.observe(el));
})();

/* ─────────────────────────────────────────
   1b. Мобильное меню (бургер)
───────────────────────────────────────── */
(function initMobileNav() {
  const nav = document.querySelector('.nav');
  const burger = document.getElementById('nav-burger');
  const menu = document.getElementById('nav-menu');
  if (!nav || !burger || !menu) return;

  function closeMenu() {
    nav.classList.remove('is-menu-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function openMenu() {
    nav.classList.add('is-menu-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  burger.addEventListener('click', () => {
    nav.classList.contains('is-menu-open') ? closeMenu() : openMenu();
  });

  // Закрыть по клику на любую ссылку меню
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Закрыть по клику вне меню
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('is-menu-open')) return;
    if (!nav.contains(e.target)) closeMenu();
  });

  // Закрыть по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Закрыть при переходе на десктопный размер (иначе меню зависнет открытым)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMenu();
  });
})();

/* ─────────────────────────────────────────
   2. Catalog — переключение объёма / цены / бутылки
───────────────────────────────────────── */
(function initCatalog() {
  const pantherCard = document.querySelector('.catalog__card[data-product="panther"]');
  if (!pantherCard) return;

  const volBtns  = pantherCard.querySelectorAll('.catalog__vol');
  const bottles  = pantherCard.querySelectorAll('.catalog__bottle');
  const priceVal = pantherCard.querySelector('.catalog__price-val');
  const buyBtn   = pantherCard.querySelector('.catalog__buy');

  const scaleMap = { '100': 'scale-sm', '250': 'scale-md', '500': '' };

  volBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const vol   = btn.dataset.vol;
      const price = parseInt(btn.dataset.price, 10);

      volBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      priceVal.textContent = price.toLocaleString('ru-RU');

      bottles.forEach(img => {
        img.classList.remove('is-active', 'scale-sm', 'scale-md');
        if (img.classList.contains('catalog__bottle--' + vol)) {
          img.classList.add('is-active');
          if (scaleMap[vol]) img.classList.add(scaleMap[vol]);
        }
      });
    });
  });

  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      const activeVolBtn = pantherCard.querySelector('.catalog__vol.is-active');
      const productName = pantherCard.querySelector('.catalog__name').textContent.trim();
      const volume = parseInt(activeVolBtn.dataset.vol, 10);
      const price = parseInt(activeVolBtn.dataset.price, 10);

      if (window.addToCart) {
        window.addToCart(productName, volume, price);
      }
    });
  }

  const muhomorCard = document.querySelector('.catalog__card[data-product="muhomor"]');
  if (muhomorCard) {
    const muhomorBuyBtn = muhomorCard.querySelector('.catalog__buy');
    if (muhomorBuyBtn) {
      muhomorBuyBtn.addEventListener('click', () => {
        const volBtn = muhomorCard.querySelector('.catalog__vol.is-active');
        const productName = muhomorCard.querySelector('.catalog__name').textContent.trim();
        const volume = parseInt(volBtn.dataset.vol, 10);
        const price = parseInt(volBtn.dataset.price, 10);

        if (window.addToCart) {
          window.addToCart(productName, volume, price);
        }
      });
    }
  }
})();

/* ─────────────────────────────────────────
   3. History Accordion
───────────────────────────────────────── */
(function initAccordion() {
  const items = document.querySelectorAll('[data-acc]');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.acc__head');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      items.forEach(i => {
        i.classList.remove('is-open');
        i.querySelector('.acc__head').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

/* ─────────────────────────────────────────
   4. Force hero animations to replay
   on back-navigation (bfcache restore)
───────────────────────────────────────── */
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  document.querySelectorAll('.anim-fade, .anim-nav').forEach(el => {
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = '';
  });
});

/* ─────────────────────────────────────────
   5. Shopping Cart Management
───────────────────────────────────────── */
(function initCart() {
  const cart = [];

  function addToCart(productName, volume, price) {
    const item = cart.find(i => i.name === productName && i.volume === volume);
    if (item) {
      item.quantity++;
    } else {
      cart.push({ name: productName, volume, price, quantity: 1 });
    }
    updateCartUI();
  }

  function removeFromCart(productName, volume) {
    const index = cart.findIndex(i => i.name === productName && i.volume === volume);
    if (index > -1) {
      cart.splice(index, 1);
    }
    updateCartUI();
  }

  function updateCartUI() {
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('total-price');

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="checkout__empty-state">
          <p>Корзина пуста</p>
          <small>Добавьте товары из каталога выше</small>
        </div>
      `;
      totalPrice.textContent = '0 ₸';
      return;
    }

    const itemsHTML = cart.map((item, idx) => `
      <div class="checkout__item">
        <div class="checkout__item-name">${item.name} ${item.volume}мл</div>
        <div class="checkout__item-qty">×${item.quantity}</div>
        <div class="checkout__item-price">${(item.price * item.quantity).toLocaleString('ru-RU')} ₸</div>
        <button class="checkout__item-remove" data-index="${idx}" title="Удалить">✕</button>
      </div>
    `).join('');

    cartItems.innerHTML = itemsHTML;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = total.toLocaleString('ru-RU') + ' ₸';

    document.querySelectorAll('.checkout__item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        removeFromCart(cart[idx].name, cart[idx].volume);
      });
    });
  }

  function generateWhatsAppMessage() {
    const name = document.getElementById('customer-name').value || '@customer';
    const city = document.querySelector('#customer-city .checkout__dropdown-value').dataset.value || 'не указан';
    const payment = document.querySelector('#payment-method .checkout__dropdown-value').dataset.value || 'не выбран';

    if (cart.length === 0) {
      alert('Добавьте товары в корзину');
      return '';
    }

    const items = cart.map(item => `${item.name} ${item.volume}мл ${item.quantity}х`).join(', ');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const cityText = city === 'Другой город' ? 'город вне списка' : `В город ${city}`;
    const message = `Здравствуйте, хочу заказать ${items}. ${cityText}. Оплата: ${payment}. ${name}`;
    return message;
  }

  const whatsappBtn = document.getElementById('whatsapp-btn');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      const message = generateWhatsAppMessage();
      if (message) {
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/77055975890?text=${encoded}`, '_blank');
      }
    });
  }

  window.addToCart = addToCart;
  window.cart = cart;
})();

/* ─────────────────────────────────────────
   6. Custom Dropdowns (Город / Способ оплаты)
───────────────────────────────────────── */
(function initDropdowns() {
  const dropdowns = document.querySelectorAll('[data-dropdown]');
  if (!dropdowns.length) return;

  dropdowns.forEach(dd => {
    const btn = dd.querySelector('.checkout__dropdown-btn');
    const valueEl = dd.querySelector('.checkout__dropdown-value');
    const options = dd.querySelectorAll('.checkout__dropdown-option');

    valueEl.dataset.value = '';

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dd.classList.contains('is-open');
      dropdowns.forEach(d => d.classList.remove('is-open'));
      if (!isOpen) dd.classList.add('is-open');
    });

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        const value = opt.dataset.value;
        valueEl.textContent = value;
        valueEl.dataset.value = value;
        valueEl.classList.add('has-value');
        options.forEach(o => o.classList.remove('is-selected'));
        opt.classList.add('is-selected');
        dd.classList.remove('is-open');
      });
    });
  });

  document.addEventListener('click', () => {
    dropdowns.forEach(d => d.classList.remove('is-open'));
  });
})();

/* ─────────────────────────────────────────
   7. Usage — 3D Coverflow Carousel (колесо)
   Авто-вращение, пауза при наведении,
   деформация карточек внутрь по бокам.
───────────────────────────────────────── */
(function initUsageWheel() {
  const stage = document.getElementById('usage-stage');
  if (!stage) return;

  const cards = Array.from(stage.querySelectorAll('.usage__card'));
  const dotsWrap = document.getElementById('usage-dots');
  const prevBtn = document.getElementById('usage-prev');
  const nextBtn = document.getElementById('usage-next');
  const n = cards.length;
  if (!n) return;

  let current = 0;
  let autoTimer = null;
  let paused = false;
  const AUTO_MS = 3200;

  // Точки-индикаторы
  const dots = cards.map((_, i) => {
    const d = document.createElement('button');
    d.className = 'usage__dot';
    d.setAttribute('aria-label', 'Слайд ' + (i + 1));
    d.addEventListener('click', () => { goTo(i); restart(); });
    dotsWrap.appendChild(d);
    return d;
  });

  // Раскладка coverflow: смещение каждой карточки от центра
  function layout() {
    cards.forEach((card, i) => {
      let offset = i - current;
      // Кольцевой сдвиг — берём кратчайший путь
      if (offset > n / 2) offset -= n;
      if (offset < -n / 2) offset += n;

      const abs = Math.abs(offset);
      const dir = Math.sign(offset);

      let x, z, rotY, scale, opacity, blur;

      if (abs === 0) {
        x = 0; z = 60; rotY = 0; scale = 1; opacity = 1; blur = 0;
      } else if (abs === 1) {
        x = dir * 320; z = -180; rotY = -dir * 48; scale = 0.86; opacity = 0.72; blur = 1;
      } else if (abs === 2) {
        x = dir * 520; z = -420; rotY = -dir * 58; scale = 0.72; opacity = 0.30; blur = 2.5;
      } else {
        x = dir * 640; z = -640; rotY = -dir * 64; scale = 0.6; opacity = 0; blur = 4;
      }

      card.style.transform =
        `translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`;
      card.style.opacity = opacity;
      card.style.filter = blur ? `blur(${blur}px)` : 'none';
      card.style.zIndex = String(100 - abs);
      card.style.pointerEvents = abs === 0 ? 'auto' : 'none';
      card.classList.toggle('is-active', abs === 0);
    });

    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
  }

  function goTo(i) {
    current = ((i % n) + n) % n;
    layout();
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => { if (!paused) next(); }, AUTO_MS);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }
  function restart() { startAuto(); }

  // Пауза при наведении — карточка замирает по центру для чтения
  stage.addEventListener('mouseenter', () => { paused = true; });
  stage.addEventListener('mouseleave', () => { paused = false; });

  // Клик по боковой карточке — центрируем её
  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (i !== current) { goTo(i); restart(); }
    });
  });

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restart(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restart(); });

  // Свайп на тач-устройствах
  let startX = 0;
  stage.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); restart(); }
  }, { passive: true });

  layout();

  // Запускаем авто-вращение только когда блок виден
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => en.isIntersecting ? startAuto() : stopAuto());
    }, { threshold: 0.25 });
    io.observe(stage);
  } else {
    startAuto();
  }
})();

/* ─────────────────────────────────────────
   8. Benefits — Blur Swap слайдер (GSAP)
   Карточки и стрелки стоят на месте. Уходящая карточка размывается
   и гаснет, затем на её месте проступает следующая — сперва размытая,
   потом чёткая. Никаких клонов/осколков — только filter+opacity
   на самих карточках, дёшево для GPU.
───────────────────────────────────────── */
(function initBenefitsDeck() {
  const deck = document.getElementById('benefits-deck');
  if (!deck || typeof gsap === 'undefined') return;

  const stacks = [
    { el: document.getElementById('benefits-stack-left'),
      cards: Array.from(document.querySelectorAll('#benefits-stack-left [data-card]')) },
    { el: document.getElementById('benefits-stack-right'),
      cards: Array.from(document.querySelectorAll('#benefits-stack-right [data-card]')) }
  ];
  const prevBtn = document.getElementById('benefits-prev');
  const nextBtn = document.getElementById('benefits-next');
  const n = stacks[0].cards.length;
  if (!n) return;

  const OUT_DUR = 0.45;
  const IN_DUR = 0.55;
  const LOCK_MS = (OUT_DUR + IN_DUR) * 1000 + 100;
  const BLUR = 'blur(14px)';
  const CONTENT_SEL = '.benefits__card-top, .benefits__card-title, .benefits__card-text';

  let index = 0;
  let isAnimating = false;

  stacks.forEach(s => s.cards.forEach((c, i) => c.classList.toggle('is-active', i === 0)));

  /* Сама плашка (фон, рамка, свечение) неподвижна и всегда видна —
     размывается и гаснет только контент внутри (иконка, цифра, текст).
     Плашка переключается на новую МГНОВЕННО, ровно в момент, когда
     старый контент уже полностью невидим — подмену никто не замечает. */
  function blurSwap(stack, outCard, inCard) {
    stack.classList.add('is-animating');
    const outContent = outCard.querySelectorAll(CONTENT_SEL);
    const inContent = inCard.querySelectorAll(CONTENT_SEL);
    gsap.killTweensOf(outContent);
    gsap.killTweensOf(inContent);

    gsap.fromTo(outContent,
      { filter: 'blur(0px)', opacity: 1 },
      { filter: BLUR, opacity: 0, duration: OUT_DUR, ease: 'power2.in',
        onComplete: () => {
          outCard.classList.remove('is-active');
          gsap.set(outContent, { clearProps: 'filter,opacity' });

          inCard.classList.add('is-active');
          gsap.set(inContent, { filter: BLUR, opacity: 0 });
          gsap.to(inContent,
            { filter: 'blur(0px)', opacity: 1, duration: IN_DUR, ease: 'power2.out',
              onComplete: () => {
                gsap.set(inContent, { clearProps: 'filter,opacity' });
                stack.classList.remove('is-animating');
              }
            }
          );
        }
      }
    );
  }

  function step(dir) {
    if (isAnimating) return;
    isAnimating = true;
    const from = index;
    index = (index + dir + n) % n;
    stacks.forEach(s => blurSwap(s.el, s.cards[from], s.cards[index]));
    setTimeout(() => { isAnimating = false; }, LOCK_MS);
  }

  const next = () => step(1);
  const prev = () => step(-1);

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restart(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restart(); });

  // Мобильные кнопки сверху и снизу (по две кнопки в каждом наборе)
  document.querySelectorAll('.benefits__nav--mobile').forEach(btn => {
    const isPrev = btn.classList.contains('benefits__nav--prev');
    btn.addEventListener('click', () => { (isPrev ? prev : next)(); restart(); });
  });

  /* Тап по самой карточке (актуально для мобильных, где нет hover) —
     карточка вспыхивает и конвейер сразу листает дальше */
  stacks.forEach(s => {
    s.cards.forEach(card => {
      card.addEventListener('click', () => {
        if (isAnimating || !card.classList.contains('is-active')) return;
        card.classList.add('is-flash');
        card.addEventListener('animationend', () => card.classList.remove('is-flash'), { once: true });
        next();
        restart();
      });
    });
  });

  // Авто-листание
  let autoTimer = null;
  let paused = false;
  const AUTO_MS = 4600;
  function startAuto() { stopAuto(); autoTimer = setInterval(() => { if (!paused && !isAnimating) next(); }, AUTO_MS); }
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
  function restart() { startAuto(); }

  deck.addEventListener('mouseenter', () => { paused = true; });
  deck.addEventListener('mouseleave', () => { paused = false; });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => en.isIntersecting ? startAuto() : stopAuto());
    }, { threshold: 0.25 });
    io.observe(deck);
  } else {
    startAuto();
  }
})();

/* ─────────────────────────────────────────
   Reviews marquee: тап по карточке ставит весь
   трек на паузу и приподнимает эту карточку;
   повторный тап по НЕЙ ЖЕ — снимает паузу и
   конвейер едет дальше как обычно.
───────────────────────────────────────── */
(function initReviewsToggle() {
  const marquee = document.querySelector('.reviews__marquee');
  if (!marquee) return;

  let selectedCard = null;

  marquee.addEventListener('click', (e) => {
    const card = e.target.closest('.reviews__card');
    if (!card) return;
    e.stopPropagation();

    if (selectedCard === card) {
      // Повторный тап по той же карточке — возобновляем конвейер
      selectedCard.classList.remove('is-selected');
      selectedCard = null;
      marquee.classList.remove('is-paused-manual');
    } else {
      // Тап по новой карточке — снимаем выделение со старой (если было),
      // паузим трек и приподнимаем эту
      if (selectedCard) selectedCard.classList.remove('is-selected');
      selectedCard = card;
      selectedCard.classList.add('is-selected');
      marquee.classList.add('is-paused-manual');
    }
  });
})();

/* ─────────────────────────────────────────
   Videos CMS: витрина видеоматериалов.
   • данные тянутся из api/videos.php;
   • пагинация — 8 карточек на страницу (десктоп),
     4 на страницу (мобилка ≤768px);
   • страницы появляются сами по мере роста числа роликов;
   • неполная страница = просто пустое место (без заглушек);
   • клик по карточке открывает плеер (YouTube/mp4) или ссылку.
───────────────────────────────────────── */
(function initVideosCMS() {
  const grid  = document.getElementById('videos-grid');
  const state = document.getElementById('videos-state');
  const pager = document.getElementById('videos-pagination');
  if (!grid) return;

  const API = 'api/videos.php';
  let videos = [];
  let page = 1;

  const perPage = () =>
    window.matchMedia('(max-width: 768px)').matches ? 4 : 8;

  const totalPages = () => Math.max(1, Math.ceil(videos.length / perPage()));

  /* --- YouTube helpers --- */
  function ytId(url) {
    if (!url) return '';
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return m ? m[1] : '';
  }

  function thumbFor(v) {
    if (v.thumb) return v.thumb;
    const id = ytId(v.url);
    if (v.type === 'youtube' && id) return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
    return '';
  }

  /* --- построение одной карточки --- */
  function buildCard(v, idx) {
    const card = document.createElement('a');
    card.className = 'videos__card videos__card--dyn';
    card.href = v.url || '#';
    card.style.setProperty('--dyn-delay', (idx * 60) + 'ms');
    if (v.url) {
      card.setAttribute('target', '_blank');
      card.setAttribute('rel', 'noopener');
    }

    const thumb = document.createElement('div');
    thumb.className = 'videos__thumb';

    const src = thumbFor(v);
    if (src) {
      const img = document.createElement('div');
      img.className = 'videos__thumb-img';
      img.style.backgroundImage = 'url("' + src.replace(/"/g, '&quot;') + '")';
      thumb.appendChild(img);
    } else {
      const bg = document.createElement('div');
      bg.className = 'videos__thumb-bg';
      thumb.appendChild(bg);
    }

    const play = document.createElement('div');
    play.className = 'videos__play';
    play.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>';
    thumb.appendChild(play);

    if (v.duration) {
      const dur = document.createElement('div');
      dur.className = 'videos__duration';
      dur.textContent = v.duration;
      thumb.appendChild(dur);
    }

    const info = document.createElement('div');
    info.className = 'videos__info';
    if (v.tag) {
      const tag = document.createElement('span');
      tag.className = 'videos__tag';
      tag.textContent = v.tag;
      info.appendChild(tag);
    }
    const name = document.createElement('h3');
    name.className = 'videos__name';
    name.textContent = v.title || 'Без названия';
    info.appendChild(name);
    if (v.description) {
      const cap = document.createElement('p');
      cap.className = 'videos__caption';
      cap.textContent = v.description;
      info.appendChild(cap);
    }

    card.appendChild(thumb);
    card.appendChild(info);

    card.addEventListener('click', (e) => {
      // YouTube и mp4 проигрываем в модалке; обычные ссылки — в новой вкладке.
      if (!v.url) { e.preventDefault(); return; }
      if (v.type === 'youtube' || v.type === 'mp4') {
        e.preventDefault();
        openPlayer(v);
      }
      // type 'link' — не мешаем: сработает штатный переход по href в новой вкладке
    });

    return card;
  }

  /* --- рендер текущей страницы --- */
  function render() {
    const pp = perPage();
    const pages = totalPages();
    if (page > pages) page = pages;
    if (page < 1) page = 1;

    grid.innerHTML = '';

    if (!videos.length) {
      state.hidden = false;
      state.textContent = 'Видеоматериалы скоро появятся.';
      pager.innerHTML = '';
      return;
    }
    state.hidden = true;

    const start = (page - 1) * pp;
    const slice = videos.slice(start, start + pp);
    const frag = document.createDocumentFragment();
    slice.forEach((v, i) => frag.appendChild(buildCard(v, i)));
    grid.appendChild(frag);

    renderPager(pages);
  }

  /* --- панель пагинации --- */
  function renderPager(pages) {
    pager.innerHTML = '';
    if (pages <= 1) return;

    const mkBtn = (label, targetPage, opts = {}) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'videos__page-btn' + (opts.active ? ' is-active' : '');
      b.textContent = label;
      if (opts.disabled) {
        b.disabled = true;
      } else {
        b.addEventListener('click', () => goTo(targetPage));
      }
      if (opts.aria) b.setAttribute('aria-label', opts.aria);
      return b;
    };

    pager.appendChild(mkBtn('‹', page - 1, { disabled: page === 1, aria: 'Назад' }));
    for (let p = 1; p <= pages; p++) {
      pager.appendChild(mkBtn(String(p), p, { active: p === page }));
    }
    pager.appendChild(mkBtn('›', page + 1, { disabled: page === pages, aria: 'Вперёд' }));
  }

  function goTo(p) {
    page = p;
    render();
    // Подкрутить к началу секции, чтобы новая страница была видна.
    const sec = document.getElementById('videos');
    if (sec) {
      const y = sec.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  /* --- модальный плеер --- */
  const modal = document.getElementById('vmodal');
  const mFrame = document.getElementById('vmodal-frame');
  const mMeta = document.getElementById('vmodal-meta');

  function openPlayer(v) {
    if (!modal) { window.open(v.url, '_blank', 'noopener'); return; }
    mFrame.innerHTML = '';
    if (v.type === 'youtube') {
      const id = ytId(v.url);
      const ifr = document.createElement('iframe');
      ifr.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
      ifr.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      ifr.allowFullscreen = true;
      mFrame.appendChild(ifr);
    } else if (v.type === 'mp4') {
      const vid = document.createElement('video');
      vid.src = v.url;
      vid.controls = true;
      vid.autoplay = true;
      vid.playsInline = true;
      mFrame.appendChild(vid);
    }
    mMeta.innerHTML = '';
    if (v.tag) {
      const t = document.createElement('span');
      t.className = 'vmodal__tag';
      t.textContent = v.tag;
      mMeta.appendChild(t);
    }
    const h = document.createElement('h3');
    h.className = 'vmodal__title';
    h.textContent = v.title || '';
    mMeta.appendChild(h);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closePlayer() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    mFrame.innerHTML = '';           // остановить воспроизведение
    document.body.style.overflow = '';
  }

  if (modal) {
    modal.querySelectorAll('[data-vclose]').forEach(el =>
      el.addEventListener('click', closePlayer));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closePlayer();
    });
  }

  /* --- реакция на смену размера экрана (пересчёт per-page) --- */
  let lastPP = perPage();
  const reflow = () => {
    const pp = perPage();
    if (pp !== lastPP) {
      lastPP = pp;
      render();
    }
  };
  window.addEventListener('resize', reflow);
  // Надёжнее resize: событие срабатывает ровно при пересечении границы 768px.
  const mql = window.matchMedia('(max-width: 768px)');
  if (mql.addEventListener) {
    mql.addEventListener('change', reflow);
  } else if (mql.addListener) {
    mql.addListener(reflow);
  }
  // Если вьюпорт «устаканился» уже после первого рендера — перерисуем с верным per-page.
  window.addEventListener('load', () => {
    if (videos.length) { lastPP = perPage(); render(); }
  });

  /* --- загрузка данных --- */
  function load() {
    fetch(API, { headers: { 'Accept': 'application/json' } })
      .then(r => r.json())
      .then(data => {
        videos = (data && data.ok && Array.isArray(data.videos)) ? data.videos : [];
        render();
      })
      .catch(() => {
        state.hidden = false;
        state.textContent = 'Не удалось загрузить видеоматериалы.';
      });
  }
  load();
})();

/* ─────────────────────────────────────────
   Секретный вход в админ-панель:
   двойной клик по логотипу «ДУХ ЛЕС» открывает admin.html.
───────────────────────────────────────── */
(function initAdminGate() {
  const logo = document.querySelector('.nav__logo');
  if (!logo) return;
  logo.addEventListener('dblclick', (e) => {
    e.preventDefault();
    window.location.href = 'admin.html';
  });
})();
