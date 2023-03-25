(() => {
  var num = 0;
  console.log('fontInject');
  const rand = (seed, index) => Math.abs(seed * index) % 1;
  const fontNoisify = (payload) => {
    let seed = document.documentElement.dataset.fpxFont;
    if ((seed = parseFloat(seed) || 0) < 0) return 0;
    else if (!seed) seed = Math.random();
    document.documentElement.dataset.fpxFont = seed;
    console.log('fontNoisify', seed);
    const index = ++num % 10 ? payload : num;
    return rand(seed, index) > 0.5 ? 1 : -1;
  };
  const fontHeightApply = (target, self, args) => {
    const height = Math.floor(self.getBoundingClientRect().height);
    const result = height ? height + fontNoisify(height) : height;
    if (result !== height && document.documentElement.dataset.fpxId) {
      chrome.runtime.sendMessage(document.documentElement.dataset.fpxId, {
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
    const result = width ? width + fontNoisify(width) : width;
    if (result !== width && document.documentElement.dataset.fpxId) {
      chrome.runtime.sendMessage(document.documentElement.dataset.fpxId, {
        action: 'notification',
        id: 'font-fingerprint',
        message: 'Font fingerprinting detected!',
        contextMessage: document.location.href,
      });
    }
    return result;
  };
  const definePropertyGet = (prototype, key, apply) => {
    const { get } = Object.getOwnPropertyDescriptor(prototype, key);
    Object.defineProperty(prototype, key, { get: new Proxy(get, { apply }) });
  };
  const fontIframes = () => {
    console.log('fontIframes');
    for (const iframe of document.querySelectorAll('iframe')) {
      if (iframe.contentWindow) {
        if (iframe.contentWindow.HTMLElement) {
          definePropertyGet(
            iframe.contentWindow.HTMLElement.prototype,
            'offsetHeight',
            fontHeightApply,
          );
          definePropertyGet(
            iframe.contentWindow.HTMLElement.prototype,
            'offsetWidth',
            fontWidthApply,
          );
        }
      }
    }
  };
  definePropertyGet(HTMLElement.prototype, 'offsetHeight', fontHeightApply);
  definePropertyGet(HTMLElement.prototype, 'offsetWidth', fontWidthApply);
  if (document.readyState == 'interactive') fontIframes();
  else document.addEventListener('DOMContentLoaded', fontIframes);
})();
