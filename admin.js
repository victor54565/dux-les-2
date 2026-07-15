'use strict';

/* ══════════════════════════════════════════
   Админ-панель «Дух Лес» — управление видео.
   Все действия идут на api/admin.php.
   Авторизация — серверная сессия (пароль
   проверяется на сервере через password_verify),
   изменения защищены CSRF-токеном.
══════════════════════════════════════════ */
(function () {
  const API   = 'api/admin.php';
  const PUBAPI = 'api/videos.php';

  let csrf = '';
  let videos = [];
  let editingId = '';

  // --- DOM ---
  const loginScreen = document.getElementById('login-screen');
  const loginForm   = document.getElementById('login-form');
  const loginPass   = document.getElementById('login-pass');
  const loginError  = document.getElementById('login-error');
  const loginBtn    = document.getElementById('login-btn');

  const dash      = document.getElementById('dash');
  const logoutBtn = document.getElementById('logout-btn');

  const form      = document.getElementById('video-form');
  const formTitle = document.getElementById('form-title');
  const formMsg   = document.getElementById('form-msg');
  const saveBtn   = document.getElementById('save-btn');
  const resetBtn  = document.getElementById('reset-btn');

  const fId       = document.getElementById('f-id');
  const fTitle    = document.getElementById('f-title');
  const fTag      = document.getElementById('f-tag');
  const fDuration = document.getElementById('f-duration');
  const fUrl      = document.getElementById('f-url');
  const fType     = document.getElementById('f-type');
  const fThumb    = document.getElementById('f-thumb');
  const fDesc     = document.getElementById('f-desc');

  const thumbFile = document.getElementById('f-thumb-file');
  const videoFile = document.getElementById('f-video-file');
  const uploadStatus = document.getElementById('upload-status');

  const listEl  = document.getElementById('video-list');
  const countEl = document.getElementById('count');

  /* ── сетевые помощники ── */
  async function apiJSON(action, payload) {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (csrf) headers['X-CSRF-Token'] = csrf;
    const r = await fetch(API, {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify(Object.assign({ action }, payload || {})),
    });
    return r.json();
  }

  async function apiForm(fd) {
    const headers = {};
    if (csrf) headers['X-CSRF-Token'] = csrf;
    const r = await fetch(API, { method: 'POST', credentials: 'same-origin', headers, body: fd });
    return r.json();
  }

  /* ── переключение экранов ── */
  function showLogin() {
    dash.hidden = true;
    loginScreen.hidden = false;
    loginPass.value = '';
    setTimeout(() => loginPass.focus(), 50);
  }
  function showDash() {
    loginScreen.hidden = true;
    dash.hidden = false;
    loadList();
  }

  /* ── старт: проверяем сессию ── */
  async function boot() {
    try {
      const res = await apiJSON('session');
      if (res && res.authed) {
        csrf = res.csrf || '';
        showDash();
      } else {
        showLogin();
      }
    } catch (e) {
      showLogin();
    }
  }

  /* ── вход ── */
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Проверка…';
    try {
      const res = await apiJSON('login', { password: loginPass.value });
      if (res && res.ok) {
        csrf = res.csrf || '';
        showDash();
      } else {
        loginError.textContent = 'Неверный пароль';
        loginError.hidden = false;
      }
    } catch (e) {
      loginError.textContent = 'Ошибка соединения с сервером';
      loginError.hidden = false;
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Войти';
    }
  });

  /* ── выход ── */
  logoutBtn.addEventListener('click', async () => {
    try { await apiJSON('logout'); } catch (e) {}
    csrf = '';
    showLogin();
  });

  /* ── загрузка списка ── */
  async function loadList() {
    try {
      const r = await fetch(PUBAPI, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
      const data = await r.json();
      videos = (data && Array.isArray(data.videos)) ? data.videos : [];
      renderList();
    } catch (e) {
      listEl.innerHTML = '<p class="vlist__empty">Не удалось загрузить список.</p>';
    }
  }

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

  /* ── рендер списка ── */
  function renderList() {
    countEl.textContent = String(videos.length);
    listEl.innerHTML = '';
    if (!videos.length) {
      listEl.innerHTML = '<p class="vlist__empty">Пока нет ни одного ролика. Добавьте первый слева.</p>';
      return;
    }

    videos.forEach((v, i) => {
      const item = document.createElement('div');
      item.className = 'vitem';

      // превью
      const thumb = document.createElement('div');
      thumb.className = 'vitem__thumb';
      const src = thumbFor(v);
      if (src) {
        thumb.style.backgroundImage = 'url("' + src.replace(/"/g, '&quot;') + '")';
      } else {
        const ph = document.createElement('div');
        ph.className = 'vitem__thumb-ph';
        ph.textContent = '▶';
        thumb.appendChild(ph);
      }

      // основное
      const main = document.createElement('div');
      main.className = 'vitem__main';
      const title = document.createElement('div');
      title.className = 'vitem__title';
      title.textContent = v.title || 'Без названия';
      const sub = document.createElement('div');
      sub.className = 'vitem__sub';
      const typeSpan = document.createElement('span');
      typeSpan.className = 'vitem__type';
      typeSpan.textContent = v.type || 'link';
      sub.appendChild(typeSpan);
      sub.appendChild(document.createTextNode(
        [v.tag, v.duration].filter(Boolean).join(' · ') || 'без категории'
      ));
      main.appendChild(title);
      main.appendChild(sub);

      // действия
      const actions = document.createElement('div');
      actions.className = 'vitem__actions';

      const up = iconButton('↑', 'Вверх', () => move(i, -1));
      up.disabled = i === 0;
      const down = iconButton('↓', 'Вниз', () => move(i, 1));
      down.disabled = i === videos.length - 1;
      const edit = iconButton('✎', 'Редактировать', () => startEdit(v));
      const del = iconButton('🗑', 'Удалить', () => remove(v));
      del.classList.add('iconbtn--danger');

      actions.append(up, down, edit, del);
      item.append(thumb, main, actions);
      listEl.appendChild(item);
    });
  }

  function iconButton(label, title, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'iconbtn';
    b.textContent = label;
    b.title = title;
    b.addEventListener('click', onClick);
    return b;
  }

  /* ── добавление / редактирование ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formMsg.hidden = true;
    saveBtn.disabled = true;

    const video = {
      id: fId.value || '',
      title: fTitle.value.trim(),
      tag: fTag.value.trim(),
      duration: fDuration.value.trim(),
      url: fUrl.value.trim(),
      type: fType.value,
      thumb: fThumb.value.trim(),
      description: fDesc.value.trim(),
    };

    try {
      const res = await apiJSON('save', { video });
      if (res && res.ok) {
        videos = res.videos || videos;
        renderList();
        resetForm();
        showFormMsg('Сохранено ✓', true);
      } else if (res && res.error === 'unauthorized') {
        showLogin();
      } else {
        showFormMsg('Ошибка: ' + (res.error || 'не удалось сохранить'), false);
      }
    } catch (e) {
      showFormMsg('Ошибка соединения', false);
    } finally {
      saveBtn.disabled = false;
    }
  });

  function startEdit(v) {
    editingId = v.id;
    fId.value = v.id;
    fTitle.value = v.title || '';
    fTag.value = v.tag || '';
    fDuration.value = v.duration || '';
    fUrl.value = v.url || '';
    fType.value = ['youtube', 'link', 'mp4'].includes(v.type) ? v.type : '';
    fThumb.value = v.thumb || '';
    fDesc.value = v.description || '';
    formTitle.textContent = 'Редактировать ролик';
    saveBtn.textContent = 'Сохранить';
    resetBtn.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fTitle.focus();
  }

  resetBtn.addEventListener('click', resetForm);
  function resetForm() {
    editingId = '';
    form.reset();
    fId.value = '';
    formTitle.textContent = 'Добавить ролик';
    saveBtn.textContent = 'Добавить';
    resetBtn.hidden = true;
    uploadStatus.textContent = '';
    uploadStatus.className = 'upload__status';
  }

  function showFormMsg(text, ok) {
    formMsg.textContent = text;
    formMsg.className = 'vform__msg ' + (ok ? 'is-ok' : 'is-err');
    formMsg.hidden = false;
    if (ok) setTimeout(() => { formMsg.hidden = true; }, 2500);
  }

  /* ── удаление ── */
  async function remove(v) {
    if (!confirm('Удалить ролик «' + (v.title || '') + '»?')) return;
    try {
      const res = await apiJSON('delete', { id: v.id });
      if (res && res.ok) {
        videos = res.videos || [];
        renderList();
        if (editingId === v.id) resetForm();
      } else if (res && res.error === 'unauthorized') {
        showLogin();
      }
    } catch (e) {}
  }

  /* ── сортировка ── */
  async function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= videos.length) return;
    const arr = videos.slice();
    const tmp = arr[index];
    arr[index] = arr[target];
    arr[target] = tmp;
    const order = arr.map(v => v.id);
    // оптимистично показываем сразу
    videos = arr;
    renderList();
    try {
      const res = await apiJSON('reorder', { order });
      if (res && res.ok) { videos = res.videos || videos; renderList(); }
    } catch (e) {}
  }

  /* ── загрузка файлов ── */
  thumbFile.addEventListener('change', () => uploadFile(thumbFile, 'thumb'));
  videoFile.addEventListener('change', () => uploadFile(videoFile, 'video'));

  async function uploadFile(input, kind) {
    const file = input.files && input.files[0];
    if (!file) return;
    uploadStatus.className = 'upload__status';
    uploadStatus.textContent = 'Загрузка…';
    const fd = new FormData();
    fd.append('action', 'upload');
    fd.append('kind', kind);
    fd.append('file', file);
    try {
      const res = await apiForm(fd);
      if (res && res.ok) {
        if (kind === 'thumb') {
          fThumb.value = res.url;
        } else {
          fUrl.value = res.url;
          if (!fType.value) fType.value = 'mp4';
        }
        uploadStatus.textContent = 'Готово ✓';
        uploadStatus.classList.add('is-ok');
      } else {
        uploadStatus.textContent = 'Ошибка: ' + (res.error || 'загрузка не удалась');
        uploadStatus.classList.add('is-err');
      }
    } catch (e) {
      uploadStatus.textContent = 'Ошибка соединения';
      uploadStatus.classList.add('is-err');
    } finally {
      input.value = '';
    }
  }

  boot();
})();
