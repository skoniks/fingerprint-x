const config = {
  active: true,
  mode: 'random',
  seed: 0,
};

const getSeed = async (mode) => {
  switch (mode) {
    case 'session':
      if (!config.seed) return Math.random();
      else return config.seed;
    case 'fixed':
      let { rectsSeed } = await chrome.storage.local.get('rectsSeed');
      if (rectsSeed === undefined) rectsSeed = Math.random();
      await chrome.storage.local.set({ rectsSeed });
      return rectsSeed;
    default:
      return 0;
  }
};

const freshSeed = async (mode = config.mode) => {
  await chrome.storage.local.remove('rectsSeed');
  config.seed = 0;
  return mode;
};

const rectsArgs = () => {
  return [chrome.runtime.id, config.active, config.seed];
};

const rectsInject = (id, active, seed) => {
  console.log('rectsInject', id, active, seed);
  if (!active) return;
  if (!seed) seed = Math.random();
  const rand = (index) => Math.abs(seed * index) % 1;
  const { getClientRects } = Element.prototype;
  const rectsDefine = (prototype, key, apply) => {
    Object.defineProperty(prototype, key, {
      value: new Proxy(prototype[key], { apply }),
    });
  };
  const rectsApply = (target, self, args) => {
    const clientRects = getClientRects.apply(self, args);
    for (let i in clientRects) {
      clientRects[i].x += rand(clientRects[i].x);
      clientRects[i].y += rand(clientRects[i].y);
      clientRects[i].top += rand(clientRects[i].top);
      clientRects[i].bottom += rand(clientRects[i].bottom);
      clientRects[i].left += rand(clientRects[i].left);
      clientRects[i].right += rand(clientRects[i].right);
      clientRects[i].height += rand(clientRects[i].height);
      clientRects[i].width += rand(clientRects[i].width);
    }
    chrome.runtime.sendMessage(id, {
      action: 'notification',
      id: 'rects-fingerprint',
      message: 'Rects fingerprinting detected!',
      contextMessage: document.location.href,
    });
    return clientRects;
  };
  const rectsIframes = () => {
    console.log('rectsIframes');
    for (const iframe of document.querySelectorAll('iframe')) {
      if (iframe.contentWindow) {
        if (iframe.contentWindow.Element) {
          rectsDefine(
            iframe.contentWindow.Element.prototype,
            'getClientRects',
            rectsApply,
          );
        }
      }
    }
  };
  rectsDefine(Element.prototype, 'getClientRects', rectsApply);
  if (document.readyState == 'interactive') rectsIframes();
  else document.addEventListener('DOMContentLoaded', rectsIframes);
};

export const rectsScript = () => {
  return { func: rectsInject, args: rectsArgs() };
};

export const rectsConfig = async (active, mode, fresh = false) => {
  if (fresh) mode = await freshSeed(mode);
  if (mode) config.seed = await getSeed((config.mode = mode));
  if (active !== undefined) config.active = active;
};
