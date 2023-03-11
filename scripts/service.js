import { canvasArgs, canvasConfig, canvasInject } from './inject/canvas.js';

const config = { notify: true };

const messageHandler = async ({ action, ...data }) => {
  switch (action) {
    case 'notification':
      notification(data);
      break;
    case 'freshCanvas':
      canvasConfig(undefined, undefined, true);
      break;
  }
};

const notification = (params) => {
  if (!config.notify) return null;
  return chrome.notifications.create({
    iconUrl: chrome.runtime.getURL('images/icon_128.png'),
    title: chrome.runtime.getManifest().name,
    type: 'basic',
    ...params,
  });
};

chrome.storage.local.get().then((result) => {
  config.notify = result.notify ?? true;
  const { canvas, canvasMode } = result;
  canvasConfig(canvas, canvasMode);
});

chrome.storage.onChanged.addListener((result) => {
  if (result.notify) config.notify = result.notify.newValue;
  const { canvas, canvasMode } = result;
  if (canvas !== undefined || canvasMode !== undefined) {
    canvasConfig(canvas?.newValue, canvasMode?.newValue);
  }
});

chrome.runtime.onMessage.addListener(messageHandler);
chrome.runtime.onMessageExternal.addListener(messageHandler);

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
