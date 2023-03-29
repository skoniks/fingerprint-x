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
  const fontSizeApply = (target, self, args) => {
    const size = Reflect.apply(target, self, args);
    const result = size ? size + fontNoisify(size) : size;
    if (result !== size && document.documentElement.dataset.fpxId) {
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
            fontSizeApply,
          );
          definePropertyGet(
            iframe.contentWindow.HTMLElement.prototype,
            'offsetWidth',
            fontSizeApply,
          );
        }
        if (iframe.contentWindow.TextMetrics) {
          definePropertyGet(
            iframe.contentWindow.TextMetrics.prototype,
            'width',
            fontSizeApply,
          );
        }
      }
    }
  };
  definePropertyGet(HTMLElement.prototype, 'offsetHeight', fontSizeApply);
  definePropertyGet(HTMLElement.prototype, 'offsetWidth', fontSizeApply);
  definePropertyGet(TextMetrics.prototype, 'width', fontSizeApply);
  if (document.readyState == 'interactive') fontIframes();
  else document.addEventListener('DOMContentLoaded', fontIframes);
})();
