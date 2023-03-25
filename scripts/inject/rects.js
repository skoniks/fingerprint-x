(() => {
  console.log('rectsInject');
  const rand = (seed, index) => Math.abs(seed * index) % 1;
  const { getClientRects } = Element.prototype;
  const rectsApply = (target, self, args) => {
    const clientRects = getClientRects.apply(self, args);
    let seed = document.documentElement.dataset.fpxRects;
    if ((seed = parseFloat(seed) || 0) < 0) return clientRects;
    else if (!seed) seed = Math.random();
    document.documentElement.dataset.fpxRects = seed;
    console.log('rectsApply', seed);
    for (let i in clientRects) {
      clientRects[i].x += rand(seed, clientRects[i].x);
      clientRects[i].y += rand(seed, clientRects[i].y);
      clientRects[i].top += rand(seed, clientRects[i].top);
      clientRects[i].bottom += rand(seed, clientRects[i].bottom);
      clientRects[i].left += rand(seed, clientRects[i].left);
      clientRects[i].right += rand(seed, clientRects[i].right);
      clientRects[i].height += rand(seed, clientRects[i].height);
      clientRects[i].width += rand(seed, clientRects[i].width);
    }
    if (document.documentElement.dataset.fpxId) {
      chrome.runtime.sendMessage(document.documentElement.dataset.fpxId, {
        action: 'notification',
        id: 'rects-fingerprint',
        message: 'Rects fingerprinting detected!',
        contextMessage: document.location.href,
      });
    }
    return clientRects;
  };
  const definePropertyValue = (prototype, key, apply) => {
    const value = new Proxy(prototype[key], { apply });
    Object.defineProperty(prototype, key, { value });
  };
  const rectsIframes = () => {
    console.log('rectsIframes');
    for (const iframe of document.querySelectorAll('iframe')) {
      if (iframe.contentWindow) {
        if (iframe.contentWindow.Element) {
          definePropertyValue(
            iframe.contentWindow.Element.prototype,
            'getClientRects',
            rectsApply,
          );
        }
      }
    }
  };
  definePropertyValue(Element.prototype, 'getClientRects', rectsApply);
  if (document.readyState == 'interactive') rectsIframes();
  else document.addEventListener('DOMContentLoaded', rectsIframes);
})();
