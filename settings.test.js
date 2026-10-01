const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function element(extra = {}) {
  return Object.assign({ handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, showModal() { this.open = true; }, close() { this.open = false; }, getBoundingClientRect() { return { left: 100, right: 300, top: 100, bottom: 300 }; } }, extra);
}
const settings = element(), theme = element(), trigger = element(), openTheme = element();
const inputs = [element({ value: 'light' }), element({ value: 'dark' })];
const root = { dataset: {} }, storage = { '2048-theme': 'dark' };
vm.runInNewContext(fs.readFileSync('settings.js', 'utf8'), {
  document: { documentElement: root, getElementById: id => ({ 'settings-modal': settings, 'theme-modal': theme, 'open-theme': openTheme })[id], querySelectorAll: () => inputs, querySelector: () => trigger },
  localStorage: { getItem: key => storage[key], setItem: (key, value) => { storage[key] = value; } }
});
assert.equal(root.dataset.theme, 'dark');
assert.equal(inputs[1].checked, true);
trigger.handlers.click(); openTheme.handlers.click();
const outside = { target: theme, clientX: 20, clientY: 20 };
theme.handlers.pointerdown(outside); theme.handlers.click(outside);
assert.equal(theme.open, false); assert.equal(settings.open, true);
const inside = { target: settings, clientX: 150, clientY: 150 };
settings.handlers.pointerdown(inside); settings.handlers.click(inside);
assert.equal(settings.open, true);
inputs[0].handlers.change();
assert.equal(root.dataset.theme, 'light'); assert.equal(storage['2048-theme'], 'light');
const backdrop = { target: settings, clientX: 20, clientY: 20 };
settings.handlers.pointerdown(backdrop); settings.handlers.click(backdrop);
assert.equal(settings.open, false);
console.log('모달별 바깥 클릭 닫기, 내부 클릭 유지, 테마 변경 및 저장 테스트 통과');
