const lightTileBackgrounds = ['#eee8dc', '#ece0c7', '#efb274', '#ee965c', '#ec7c61', '#e76044', '#e8bc51', '#e8bc51', '#e8bc51', '#dfaa30', '#dfaa30', '#dfaa30', '#dfaa30', '#dfaa30', '#dfaa30', '#dfaa30', '#dfaa30'];
function defaultCustomTheme(baseTheme = 'light') {
  const dark = baseTheme === 'dark';
  return { baseTheme: dark ? 'dark' : 'light', background: dark ? '#1c1b19' : '#faf8f2', primary: dark ? '#eee8dc' : '#50493f', scoreBox: dark ? '#36322d' : '#e9e3d8', secondary: '#edac45', repeat: false, period: 11,
    tiles: lightTileBackgrounds.map((background, i) => ({ background: dark && i < 2 ? ['#635b4f', '#82715a'][i] : background, text: dark && i < 2 ? ['#f5efe4', '#fff5e2'][i] : i < 2 ? '#635a4e' : '#ffffff' })) };
}
function tileColorIndex(index, repeat, period) {
  if (!Number.isInteger(period) || period < 1 || period > 16) throw new RangeError('반복 단위는 1~16의 정수여야 합니다.');
  return repeat ? index % period : Math.min(index, 16);
}
function validCustomTheme(value) {
  const color = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  return value && ['background', 'primary', 'scoreBox', 'secondary'].every(key => color(value[key])) && typeof value.repeat === 'boolean' && Number.isInteger(value.period) && value.period >= 1 && value.period <= 16 && Array.isArray(value.tiles) && value.tiles.length === 17 && value.tiles.every(tile => tile && color(tile.background) && color(tile.text));
}
function randomizeUnlocked(colors, keys, locks, prefix, randomColor) {
  for (const key of keys) if (locks[`${prefix}${key}`] !== true) colors[key] = randomColor();
}
if (typeof module !== 'undefined') module.exports = { defaultCustomTheme, tileColorIndex, validCustomTheme, randomizeUnlocked };
if (typeof document !== 'undefined') {
  const get = id => document.getElementById(id);
  let custom = defaultCustomTheme();
  try { const saved = JSON.parse(localStorage.getItem('2048-custom')); if (saved && saved.scoreBox === undefined) saved.scoreBox = '#e9e3d8'; if (saved && Array.isArray(saved.tiles) && saved.tiles.length === 16) saved.tiles.push(defaultCustomTheme().tiles[16]); if (validCustomTheme(saved)) custom = saved; } catch {}
  const customStyle = document.createElement('style');
  document.head.append(customStyle);
  function lockButton(key, title, disabled = false) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'color-lock'; button.disabled = disabled;
    const update = () => {
      const locked = custom.locks?.[key] === true;
      button.setAttribute('aria-pressed', String(locked)); button.setAttribute('aria-label', `${title} 색상 잠금`);
      button.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="${locked ? 'M8 10V7a4 4 0 0 1 8 0v3' : 'M8 10V7a4 4 0 0 1 8 0'}"/><path d="M12 14v3"/></svg>`;
    };
    button.addEventListener('click', () => {
      custom.locks = custom.locks && typeof custom.locks === 'object' ? custom.locks : {};
      custom.locks[key] = custom.locks[key] !== true;
      update();
      try { localStorage.setItem('2048-custom', JSON.stringify(custom)); } catch {}
    });
    update(); return button;
  }
  function renderBaseLocks() {
    for (const key of ['background', 'primary', 'scoreBox', 'secondary']) {
      const input = get(`custom-${key}`), label = input.parentElement;
      let group = label.parentElement;
      if (!group.classList.contains('base-color-control')) {
        group = document.createElement('div'); group.className = 'base-color-control'; label.before(group); group.append(label);
      }
      group.querySelector('.color-lock')?.remove();
      group.append(lockButton(key, label.textContent));
    }
  }
  function updateStyles() {
    document.documentElement.dataset.baseTheme = custom.baseTheme === 'dark' ? 'dark' : 'light';
    customStyle.textContent = `[data-theme="custom"] body{background:${custom.background};color:${custom.primary}}[data-theme="custom"] h1 span{color:${custom.secondary}}[data-theme="custom"] #restart{background:${custom.primary};color:${custom.scoreBox}}[data-theme="custom"] .scores>div{background:${custom.scoreBox}}[data-theme="custom"] #restart:hover{filter:brightness(.9)}[data-theme="custom"] .settings-button{color:${custom.primary}}` + custom.tiles.map((_, i) => {
      const tile = custom.tiles[tileColorIndex(i, custom.repeat, custom.period)];
      return `[data-theme="custom"] .tile[data-value="${2 ** (i + 1)}"]{background:${tile.background};color:${tile.text}}`;
    }).join('');
  }
  function save() {
    document.documentElement.dataset.theme = 'custom';
    document.querySelectorAll('input[name="theme"]').forEach(input => { input.checked = false; });
    updateStyles();
    try { localStorage.setItem('2048-custom', JSON.stringify(custom)); localStorage.setItem('2048-theme', 'custom'); } catch {}
  }
  for (const key of ['background', 'primary', 'scoreBox', 'secondary']) {
    const input = get(`custom-${key}`);
    input.value = custom[key];
    input.addEventListener('input', () => { custom[key] = input.value; save(); });
  }
  function renderTiles() {
    get('tile-color-list').replaceChildren(...custom.tiles.map((tile, index) => {
      const row = document.createElement('div'); row.className = 'tile-color-row';
      const sample = document.createElement('span'); sample.className = 'color-sample'; sample.textContent = (2 ** (index + 1)).toLocaleString();
      const effective = custom.tiles[tileColorIndex(index, custom.repeat, custom.period)];
      sample.style.background = effective.background; sample.style.color = effective.text; row.append(sample);
      for (const [key, title] of [['background', '배경'], ['text', '글자']]) {
        const label = document.createElement('div'); label.className = 'tile-color-field';
        const caption = document.createElement('span'); caption.textContent = title; label.append(caption);
        const input = document.createElement('input'); input.type = 'color'; input.value = effective[key];
        input.setAttribute('aria-label', `${sample.textContent} 타일 ${title} 색상`);
        input.disabled = custom.repeat && index >= custom.period;
        input.addEventListener('input', () => {
          tile[key] = input.value; save();
          // Keep the active picker mounted while updating repeated previews.
          get('tile-color-list').querySelectorAll('.tile-color-row').forEach((r, i) => {
            const colors = custom.tiles[tileColorIndex(i, custom.repeat, custom.period)];
            r.firstChild.style.background = colors.background; r.firstChild.style.color = colors.text;
            r.querySelectorAll('input').forEach((field, j) => { field.value = colors[j === 0 ? 'background' : 'text']; });
          });
        });
        const controls = document.createElement('div'); controls.className = 'tile-color-controls';
        controls.append(input, lockButton(`tile-${index}-${key}`, `${sample.textContent} 타일 ${title}`, input.disabled));
        label.append(controls); row.append(label);
      }
      return row;
    }));
  }
  get('custom-repeat').value = String(custom.repeat);
  get('custom-period').value = custom.period;
  get('custom-period').disabled = !custom.repeat;
  function syncStepper() {
    get('period-down').disabled = !custom.repeat || custom.period <= 1;
    get('period-up').disabled = !custom.repeat || custom.period >= 16;
  }
  for (const [id, delta] of [['period-down', -1], ['period-up', 1]]) {
    get(id).addEventListener('click', () => {
      get('custom-period').value = Math.max(1, Math.min(16, custom.period + delta));
      get('custom-period').dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  syncStepper();
  get('custom-repeat').addEventListener('change', event => {
    custom.repeat = event.target.value === 'true'; get('custom-period').disabled = !custom.repeat;
    get('custom-period').value = custom.period; get('custom-period').setCustomValidity(''); get('period-error').textContent = ''; save(); renderTiles();
    syncStepper();
  });
  get('custom-period').addEventListener('input', event => {
    const period = event.target.valueAsNumber;
    const valid = Number.isInteger(period) && period >= 1 && period <= 16;
    get('period-error').textContent = valid ? '' : '반복 단위는 1~16의 정수만 입력할 수 있습니다.';
    event.target.setCustomValidity(valid ? '' : '1~16의 정수를 입력하세요.');
    if (valid) { custom.period = period; save(); renderTiles(); syncStepper(); }
  });
  const randomColor = () => '#' + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0');
  let pendingUnlock = 'base', skipWarning = false;
  try { skipWarning = localStorage.getItem('2048-skip-unlock-warning') === 'true'; } catch {}
  function bulkLock(scope, locked) {
    custom.locks = custom.locks && typeof custom.locks === 'object' ? custom.locks : {};
    const keys = scope === 'base' ? ['background', 'primary', 'scoreBox', 'secondary'] : custom.tiles.flatMap((_, i) => [`tile-${i}-background`, `tile-${i}-text`]);
    keys.forEach(key => { custom.locks[key] = locked; });
    try { localStorage.setItem('2048-custom', JSON.stringify(custom)); } catch {}
    renderBaseLocks(); renderTiles();
  }
  document.querySelectorAll('[data-lock]').forEach(button => button.addEventListener('click', () => bulkLock(button.dataset.lock, true)));
  document.querySelectorAll('[data-unlock]').forEach(button => button.addEventListener('click', () => {
    pendingUnlock = button.dataset.unlock;
    if (skipWarning) bulkLock(pendingUnlock, false);
    else { get('skip-unlock-warning').checked = false; get('unlock-modal').showModal(); }
  }));
  get('cancel-unlock').addEventListener('click', () => get('unlock-modal').close());
  get('confirm-unlock').addEventListener('click', () => {
    skipWarning = get('skip-unlock-warning').checked;
    try { localStorage.setItem('2048-skip-unlock-warning', String(skipWarning)); } catch {}
    bulkLock(pendingUnlock, false); get('unlock-modal').close();
  });
  get('random-base-colors').addEventListener('click', () => {
    for (const key of ['background', 'primary', 'scoreBox', 'secondary']) {
      randomizeUnlocked(custom, [key], custom.locks || {}, '', randomColor);
      get(`custom-${key}`).value = custom[key];
    }
    save();
  });
  get('reset-custom').addEventListener('click', () => get('reset-modal').showModal());
  get('cancel-reset').addEventListener('click', () => get('reset-modal').close());
  get('confirm-reset').addEventListener('click', () => {
    custom = defaultCustomTheme();
    for (const key of ['background', 'primary', 'scoreBox', 'secondary']) get(`custom-${key}`).value = custom[key];
    get('custom-repeat').value = 'false';
    get('custom-period').value = custom.period;
    get('custom-period').disabled = true; syncStepper();
    get('custom-period').setCustomValidity('');
    get('period-error').textContent = '';
    save();
    applyTheme('light');
    try { localStorage.setItem('2048-theme', 'light'); } catch {}
    renderTiles(); renderBaseLocks(); get('reset-modal').close();
  });
  get('random-colors').addEventListener('click', () => {
    for (let i = 0; i < (custom.repeat ? custom.period : custom.tiles.length); i++) randomizeUnlocked(custom.tiles[i], ['background', 'text'], custom.locks || {}, `tile-${i}-`, randomColor);
    save(); renderTiles();
  });
  get('open-custom').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme;
    if (theme !== 'custom' && theme !== (custom.baseTheme || 'light')) {
      custom = defaultCustomTheme(theme);
      for (const key of ['background', 'primary', 'scoreBox', 'secondary']) get(`custom-${key}`).value = custom[key];
      get('custom-repeat').value = 'false';
      get('custom-period').value = custom.period;
      get('custom-period').disabled = true; syncStepper();
      get('custom-period').setCustomValidity('');
      get('period-error').textContent = '';
      renderTiles(); renderBaseLocks();
    }
    save(); get('custom-modal').showModal();
  });
  updateStyles(); renderTiles(); renderBaseLocks();
}
