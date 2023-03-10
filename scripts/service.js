import { canvasArgs, canvasConfig, canvasInject } from './inject/canvas.js';

chrome.storage.local.get().then((result) => {
  const { canvas, canvasMode } = result;
  canvasConfig(canvas, canvasMode);
});

chrome.storage.onChanged.addListener((result) => {
  const { canvas, canvasMode } = result;
  if (canvas !== undefined || canvasMode !== undefined) {
    canvasConfig(canvas?.newValue, canvasMode?.newValue);
  }
});

chrome.runtime.onMessage.addListener(({ action }) => {
  switch (action) {
    case 'freshCanvas':
      canvasConfig(undefined, undefined, true);
      break;
  }
});

chrome.webNavigation.onCommitted //
  .addListener(({ tabId, frameId, url }) => {
    try {
      if (!url.startsWith('http')) return;
      chrome.scripting.executeScript({
        args: canvasArgs(),
        func: canvasInject,
        injectImmediately: true,
        target: { tabId, frameIds: [frameId] },
        world: 'MAIN',
      });
    } catch {}
  });
