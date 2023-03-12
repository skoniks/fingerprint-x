import { canvasConfig, canvasScript } from './inject/canvas.js';
import { fontConfig, fontScript } from './inject/font.js';
import { rectsConfig, rectsScript } from './inject/rects.js';

const config = { notify: true, notifies: {} };

const messageHandler = async ({ action, ...data }) => {
  switch (action) {
    case 'notification':
      notification(data);
      break;
    case 'freshCanvas':
      canvasConfig(undefined, undefined, true);
      break;
    case 'freshRects':
      rectsConfig(undefined, undefined, true);
      break;
    case 'freshFont':
      fontConfig(undefined, undefined, true);
      break;
  }
};

/**
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.message
 * @param {string} params.contextMessage
 * @returns
 */
const notification = ({ id = '', ...params }) => {
  if (!config.notify) return;
  if (config.notifies[id]) clearTimeout(config.notifies[id]);
  config.notifies[id] = setTimeout(() => {
    chrome.notifications.create({
      iconUrl: chrome.runtime.getURL('images/icon_128.png'),
      title: chrome.runtime.getManifest().name,
      type: 'basic',
      silent: true,
      ...params,
    });
  }, 1000);
};

/**
 *
 * @param {number} tabId
 * @param {number} frameId
 * @param {void} script
 * @returns
 */
const executeScript = (tabId, frameId, script) => {
  return chrome.scripting.executeScript({
    target: { tabId, frameIds: [frameId] },
    injectImmediately: true,
    world: 'MAIN',
    ...script(),
  });
};

/**
 *
 * @param {chrome.webNavigation.WebNavigationTransitionCallbackDetails} params
 * @returns
 */
const executeScripts = async ({ tabId, frameId, url }) => {
  try {
    console.log(tabId, frameId, url);
    const { origin } = new URL(url);
    if (origin == 'null') return;
    await Promise.allSettled([
      executeScript(tabId, frameId, canvasScript),
      executeScript(tabId, frameId, rectsScript),
      executeScript(tabId, frameId, fontScript),
    ]);
  } catch (error) {
    console.log(error);
  }
};

chrome.storage.local.get().then((result) => {
  config.notify = result.notify ?? true;
  canvasConfig(result.canvas, result.canvasMode);
  rectsConfig(result.rects, result.rectsMode);
  fontConfig(result.font, result.fontMode);
});

chrome.storage.onChanged.addListener((result) => {
  if (result.notify) config.notify = result.notify.newValue;
  canvasConfig(result.canvas?.newValue, result.canvasMode?.newValue);
  rectsConfig(result.rects?.newValue, result.rectsMode?.newValue);
  fontConfig(result.font?.newValue, result.fontMode?.newValue);
});

chrome.runtime.onMessage.addListener(messageHandler);
chrome.runtime.onMessageExternal.addListener(messageHandler);
chrome.webNavigation.onCommitted.addListener(executeScripts);
