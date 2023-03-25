const canvas = document.getElementById('canvas');
const webgl = document.getElementById('webgl');
const audio = document.getElementById('audio');
const rects = document.getElementById('rects');
const font = document.getElementById('font');
const canvasMode = document.getElementById('canvas_mode');
const webglMode = document.getElementById('webgl_mode');
const audioMode = document.getElementById('audio_mode');
const rectsMode = document.getElementById('rects_mode');
const fontMode = document.getElementById('font_mode');
const canvasFresh = document.getElementById('canvas_fresh');
const webglFresh = document.getElementById('webgl_fresh');
const audioFresh = document.getElementById('audio_fresh');
const rectsFresh = document.getElementById('rects_fresh');
const fontFresh = document.getElementById('font_fresh');
const theme = document.getElementById('theme');
const notifyoff = document.getElementById('notifyoff');
const notifyon = document.getElementById('notifyon');

chrome.storage.local.get().then((result) => {
  canvas.checked = result.canvas ?? true;
  webgl.checked = result.webgl ?? true;
  audio.checked = result.audio ?? true;
  rects.checked = result.rects ?? true;
  font.checked = result.font ?? true;
  canvasMode.value = result.canvasMode ?? 'random';
  webglMode.value = result.webglMode ?? 'random';
  audioMode.value = result.audioMode ?? 'random';
  rectsMode.value = result.rectsMode ?? 'random';
  fontMode.value = result.fontMode ?? 'random';
  document.body.parentElement.dataset.theme = result.theme ?? false;
  if (result.notify ?? true) {
    notifyon.className = 'hide';
    notifyoff.className = '';
  } else {
    notifyon.className = '';
    notifyoff.className = 'hide';
  }
});

canvas.addEventListener('change', function () {
  chrome.storage.local.set({ canvas: this.checked });
});
webgl.addEventListener('change', function () {
  chrome.storage.local.set({ webgl: this.checked });
});
audio.addEventListener('change', function () {
  chrome.storage.local.set({ audio: this.checked });
});
rects.addEventListener('change', function () {
  chrome.storage.local.set({ rects: this.checked });
});
font.addEventListener('change', function () {
  chrome.storage.local.set({ font: this.checked });
});

canvasMode.addEventListener('change', function () {
  chrome.storage.local.set({ canvasMode: this.value });
});
webglMode.addEventListener('change', function () {
  chrome.storage.local.set({ webglMode: this.value });
});
audioMode.addEventListener('change', function () {
  chrome.storage.local.set({ audioMode: this.value });
});
rectsMode.addEventListener('change', function () {
  chrome.storage.local.set({ rectsMode: this.value });
});
fontMode.addEventListener('change', function () {
  chrome.storage.local.set({ fontMode: this.value });
});

canvasFresh.addEventListener('click', function () {
  chrome.runtime.sendMessage({ action: 'freshCanvas' });
  setTimeout(() => (this.className = ''), 500);
  this.className = 'spin';
});
webglFresh.addEventListener('click', function () {
  chrome.runtime.sendMessage({ action: 'freshWebgl' });
  setTimeout(() => (this.className = ''), 500);
  this.className = 'spin';
});
audioFresh.addEventListener('click', function () {
  chrome.runtime.sendMessage({ action: 'freshAudio' });
  setTimeout(() => (this.className = ''), 500);
  this.className = 'spin';
});
rectsFresh.addEventListener('click', function () {
  chrome.runtime.sendMessage({ action: 'freshRects' });
  setTimeout(() => (this.className = ''), 500);
  this.className = 'spin';
});
fontFresh.addEventListener('click', function () {
  chrome.runtime.sendMessage({ action: 'freshFont' });
  setTimeout(() => (this.className = ''), 500);
  this.className = 'spin';
});

theme.addEventListener('click', function () {
  const theme = !(document.body.parentElement.dataset.theme == 'true');
  document.body.parentElement.dataset.theme = theme;
  chrome.storage.local.set({ theme });
});
notifyon.addEventListener('click', function () {
  notifyon.className = 'hide';
  notifyoff.className = '';
  chrome.storage.local.set({ notify: true });
});
notifyoff.addEventListener('click', function () {
  notifyon.className = '';
  notifyoff.className = 'hide';
  chrome.storage.local.set({ notify: false });
});
