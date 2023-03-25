(() => {
  console.log('canvasInject');
  const rand = (seed, index) => Math.abs(seed * index) % 1;
  const { getImageData } = CanvasRenderingContext2D.prototype;
  const canvasNoisify = (canvas, context) => {
    let seed = document.documentElement.dataset.fpxCanvas;
    if ((seed = parseFloat(seed) || 0) < 0) return;
    else if (seed == 0) seed = Math.random();
    document.documentElement.dataset.fpxCanvas = seed;
    const shift = {
      r: Math.floor(rand(seed, 1) * 10) - 5,
      g: Math.floor(rand(seed, 2) * 10) - 5,
      b: Math.floor(rand(seed, 3) * 10) - 5,
      a: Math.floor(rand(seed, 4) * 10) - 5,
    };
    if (!Object.values(shift).reduce((i, j) => i + Math.abs(j), 0)) {
      shift.r = (shift.g = (shift.b = (shift.a = 1) + 1) + 1) + 1;
    }
    console.log('canvasNoisify', seed);
    const { width, height } = canvas;
    if (context && width && height) {
      const imageData = getImageData.apply(context, [0, 0, width, height]);
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          const n = i * (width * 4) + j * 4;
          imageData.data[n + 0] += shift.r;
          imageData.data[n + 1] += shift.g;
          imageData.data[n + 2] += shift.b;
          imageData.data[n + 3] += shift.a;
        }
      }
      context.putImageData(imageData, 0, 0);
      if (document.documentElement.dataset.fpxId) {
        chrome.runtime.sendMessage(document.documentElement.dataset.fpxId, {
          action: 'notification',
          id: 'canvas-fingerprint',
          message: 'Canvas fingerprinting detected!',
          contextMessage: document.location.href,
        });
      }
    }
  };
  const definePropertyValue = (prototype, key, apply) => {
    const value = new Proxy(prototype[key], { apply });
    Object.defineProperty(prototype, key, { value });
  };
  const canvasElementApply = (target, self, args) => {
    canvasNoisify(self, self.getContext('2d'));
    return Reflect.apply(target, self, args);
  };
  const canvasContextApply = (target, self, args) => {
    canvasNoisify(self.canvas, self);
    return Reflect.apply(target, self, args);
  };
  const canvasIframes = () => {
    console.log('canvasIframes');
    for (const iframe of document.querySelectorAll('iframe')) {
      if (iframe.contentWindow) {
        if (iframe.contentWindow.CanvasRenderingContext2D) {
          definePropertyValue(
            iframe.contentWindow.CanvasRenderingContext2D.prototype,
            'getImageData',
            canvasContextApply,
          );
        }
        if (iframe.contentWindow.HTMLCanvasElement) {
          definePropertyValue(
            iframe.contentWindow.HTMLCanvasElement.prototype,
            'toBlob',
            canvasElementApply,
          );
          definePropertyValue(
            iframe.contentWindow.HTMLCanvasElement.prototype,
            'toDataURL',
            canvasElementApply,
          );
        }
      }
    }
  };
  definePropertyValue(
    HTMLCanvasElement.prototype,
    'toBlob',
    canvasElementApply,
  );
  definePropertyValue(
    HTMLCanvasElement.prototype,
    'toDataURL',
    canvasElementApply,
  );
  definePropertyValue(
    CanvasRenderingContext2D.prototype,
    'getImageData',
    canvasContextApply,
  );
  if (document.readyState == 'interactive') canvasIframes();
  else document.addEventListener('DOMContentLoaded', canvasIframes);
})();
