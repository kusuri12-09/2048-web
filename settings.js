const settingsModal = document.getElementById('settings-modal');
const themeModal = document.getElementById('theme-modal');
const themeInputs = document.querySelectorAll('input[name="theme"]');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeInputs.forEach(input => { input.checked = input.value === theme; });
}

let savedTheme = 'light';
try { savedTheme = localStorage.getItem('2048-theme') === 'dark' ? 'dark' : 'light'; } catch {}
applyTheme(savedTheme);

document.querySelector('.settings-button').addEventListener('click', () => settingsModal.showModal());
document.getElementById('open-theme').addEventListener('click', () => themeModal.showModal());

for (const modal of [settingsModal, themeModal]) {
  // Backdrop clicks target the dialog; clicks inside its bounds keep it open.
  let startedOutside = false;
  const isOutside = event => {
    const rect = modal.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  modal.addEventListener('pointerdown', event => { startedOutside = event.target === modal && isOutside(event); });
  modal.addEventListener('click', event => {
    if (startedOutside && event.target === modal && isOutside(event)) modal.close();
    startedOutside = false;
  });
}

themeInputs.forEach(input => input.addEventListener('change', () => {
  applyTheme(input.value);
  try { localStorage.setItem('2048-theme', input.value); } catch {}
}));
