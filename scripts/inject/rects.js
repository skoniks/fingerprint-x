(() => {
  console.log('rectsInject');
  const rand = (seed, index) => Math.abs(seed * index) % 1;
  const rectsApply = (target, self, args) => {
    const result = Reflect.apply(target, self, args);
    let seed = document.documentElement.dataset.fpxRects;
    if ((seed = parseFloat(seed) || 0) < 0) return result;
    else if (!seed) seed = Math.random();
    document.documentElement.dataset.fpxRects = seed;
    console.log('rectsApply', seed);
    for (let i in result) {
      result[i].x += rand(seed, result[i].x);
      result[i].y += rand(seed, result[i].y);
      result[i].top += rand(seed, result[i].top);
      result[i].bottom += rand(seed, result[i].bottom);
      result[i].left += rand(seed, result[i].left);
      result[i].right += rand(seed, result[i].right);
      result[i].height += rand(seed, result[i].height);
      result[i].width += rand(seed, result[i].width);
    }
    if (document.documentElement.dataset.fpxId) {
      chrome.runtime.sendMessage(document.documentElement.dataset.fpxId, {
        action: 'notification',
        id: 'rects-fingerprint',
        message: 'Rects fingerprinting detected!',
        contextMessage: document.location.href,
      });
    }
    return result;
  };
  const definePropertyValue = (prototype, key, apply) => {
    const value = new Proxy(prototype[key], { apply });
    Object.defineProperty(prototype, key, { value });
  };
  const rectsIframes = () => {
    console.log('rectsIframes');
    for (const iframe of document.querySelectorAll('iframe')) {
      if (iframe.contentWindow) {
        if (iframe.contentWindow.HTMLElement) {
          definePropertyValue(
            iframe.contentWindow.HTMLElement.prototype,
            'getClientRects',
            rectsApply,
          );
          definePropertyValue(
            iframe.contentWindow.HTMLElement.prototype,
            'getBoundingClientRect',
            rectsApply,
          );
        }
      }
    }
  };
  definePropertyValue(HTMLElement.prototype, 'getClientRects', rectsApply);
  definePropertyValue(
    HTMLElement.prototype,
    'getBoundingClientRect',
    rectsApply,
  );
  if (document.readyState == 'interactive') rectsIframes();
  else document.addEventListener('DOMContentLoaded', rectsIframes);
})();
