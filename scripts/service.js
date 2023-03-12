import { canvasConfig, canvasScript } from './inject/canvas.js';

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

/**
 *
 * @param {Object} params
 * @param {string} params.message
 * @param {string} params.contextMessage
 * @returns
 */
const notification = (params) => {
  if (!config.notify) return;
  return chrome.notifications.create({
    iconUrl: chrome.runtime.getURL('images/icon_128.png'),
    title: chrome.runtime.getManifest().name,
    type: 'basic',
    ...params,
  });
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
    const { origin } = new URL(url);
    if (origin == 'null') return;
    await Promise.allSettled([
      executeScript(tabId, frameId, canvasScript),
      // executeScript(tabId, frameId, canvasScript),
    ]);
  } catch (error) {
    console.log(error);
  }
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
chrome.webNavigation.onCommitted.addListener(executeScripts);
