console.log('Fingerprint X');

const config = {
  notify: true,
  notifies: {},
  canvas: {
    active: true,
    mode: 'random',
    seed: 0,
  },
  rects: {
    active: true,
    mode: 'random',
    seed: 0,
  },
  font: {
    active: true,
    mode: 'random',
    seed: 0,
  },
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

const configUpdate = async (key, active, mode, fresh = false) => {
  console.log(key, active, mode, fresh);
  if (fresh) {
    mode = mode ?? config[key].mode;
    await chrome.storage.local.remove(key + 'Seed');
    config[key].seed = 0;
  }
  if (mode) {
    switch ((config[key].mode = mode)) {
      case 'session':
        if (!config[key].seed) config[key].seed = Math.random();
        break;
      case 'fixed':
        const storage = await chrome.storage.local.get(key + 'Seed');
        let [seed] = Object.values(storage ?? {});
        if (seed === undefined) seed = Math.random();
        await chrome.storage.local.set({ [key + 'Seed']: seed });
        config[key].seed = seed;
        break;
      default:
        config[key].seed = 0;
        break;
    }
  }
  if (active !== undefined) {
    config[key].active = active;
  }
  console.log(config);
};

const onMessage = async ({ action, ...data }) => {
  switch (action) {
    case 'notification':
      notification(data);
      break;
    case 'freshCanvas':
      configUpdate('canvas', undefined, undefined, true);
      break;
    case 'freshRects':
      configUpdate('rects', undefined, undefined, true);
      break;
    case 'freshFont':
      configUpdate('font', undefined, undefined, true);
      break;
  }
};

chrome.storage.local.get().then(async (result) => {
  config.notify = result.notify ?? true;
  configUpdate('canvas', result.canvas, result.canvasMode);
  configUpdate('rects', result.rects, result.rectsMode);
  configUpdate('font', result.font, result.fontMode);
});

chrome.storage.onChanged.addListener(async (result) => {
  console.log(result);
  if (result.notify) config.notify = result.notify.newValue;
  configUpdate('canvas', result.canvas?.newValue, result.canvasMode?.newValue);
  configUpdate('rects', result.rects?.newValue, result.rectsMode?.newValue);
  configUpdate('font', result.font?.newValue, result.fontMode?.newValue);
});

chrome.runtime.onMessage.addListener(onMessage);
chrome.runtime.onMessageExternal.addListener(onMessage);

chrome.webNavigation.onCommitted.addListener(
  async ({ tabId, frameId, url }) => {
    try {
      console.log('webNavigation', tabId, frameId, url);
      await chrome.scripting.executeScript({
        target: { tabId, frameIds: [frameId] },
        injectImmediately: true,
        world: 'MAIN',
        func: (id, fpxCanvas, fpxRects, fpxFont) => {
          console.log('webNavigation onCommitted');
          document.documentElement.dataset.fpxId = id;
          document.documentElement.dataset.fpxCanvas = fpxCanvas;
          document.documentElement.dataset.fpxRects = fpxRects;
          document.documentElement.dataset.fpxFont = fpxFont;
        },
        args: [
          chrome.runtime.id,
          config.canvas.active ? config.canvas.seed : -1,
          config.rects.active ? config.rects.seed : -1,
          config.font.active ? config.font.seed : -1,
        ],
      });
    } catch (error) {}
  },
);

chrome.scripting.registerContentScripts([
  {
    id: crypto.randomUUID(),
    js: [
      'scripts/inject/canvas.js',
      'scripts/inject/rects.js',
      'scripts/inject/font.js',
    ],
    matches: ['<all_urls>'],
    runAt: 'document_start',
    allFrames: true,
    world: 'MAIN',
  },
]);
