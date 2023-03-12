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
      let { fontSeed } = await chrome.storage.local.get('fontSeed');
      if (fontSeed === undefined) fontSeed = Math.random();
      await chrome.storage.local.set({ fontSeed });
      return fontSeed;
    default:
      return 0;
  }
};

const freshSeed = async (mode = config.mode) => {
  await chrome.storage.local.remove('fontSeed');
  config.seed = 0;
  return mode;
};

const fontArgs = () => {
  return [chrome.runtime.id, config.active, config.seed];
};

const fontInject = (id, active, seed, num = 0) => {
  console.log('fontInject', id, active, seed);
  if (!active) return;
  if (!seed) seed = Math.random();
  const rand = (index) => Math.abs(seed * (index || rand(1))) % 1;
  const noise = (payload) => (rand(++num % 10 ? payload : num) > 0.5 ? 1 : -1);
  const fontDefine = (prototype, key, apply) => {
    Object.defineProperty(prototype, key, {
      get: new Proxy(Object.getOwnPropertyDescriptor(prototype, key).get, {
        apply,
      }),
    });
  };
  const fontHeightApply = (target, self, args) => {
    const height = Math.floor(self.getBoundingClientRect().height);
    const result = height ? height + noise(height) : height;
    if (result !== height) {
      chrome.runtime.sendMessage(id, {
        action: 'notification',
        id: 'font-fingerprint',
        message: 'Font fingerprinting detected!',
        contextMessage: document.location.href,
      });
    }
    return result;
  };
  const fontWidthApply = (target, self, args) => {
    const width = Math.floor(self.getBoundingClientRect().width);
    const result = width ? width + noise(width) : width;
    if (result !== width) {
      chrome.runtime.sendMessage(id, {
        action: 'notification',
        id: 'font-fingerprint',
        message: 'Font fingerprinting detected!',
        contextMessage: document.location.href,
      });
    }
    return result;
  };
  const fontIframes = () => {
    console.log('fontIframes');
    for (const iframe of document.querySelectorAll('iframe')) {
      if (iframe.contentWindow) {
        if (iframe.contentWindow.HTMLElement) {
          fontDefine(
            iframe.contentWindow.HTMLElement.prototype,
            'offsetHeight',
            fontHeightApply,
          );
          fontDefine(
            iframe.contentWindow.HTMLElement.prototype,
            'offsetWidth',
            fontWidthApply,
          );
        }
      }
    }
  };
  fontDefine(HTMLElement.prototype, 'offsetHeight', fontHeightApply);
  fontDefine(HTMLElement.prototype, 'offsetWidth', fontWidthApply);
  if (document.readyState == 'interactive') fontIframes();
  else document.addEventListener('DOMContentLoaded', fontIframes);
};

export const fontScript = () => {
  return { func: fontInject, args: fontArgs() };
};

export const fontConfig = async (active, mode, fresh = false) => {
  if (fresh) mode = await freshSeed(mode);
  if (mode) config.seed = await getSeed((config.mode = mode));
  if (active !== undefined) config.active = active;
};
