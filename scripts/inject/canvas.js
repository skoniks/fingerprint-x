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
      let { canvasSeed } = await chrome.storage.local.get('canvasSeed');
      if (canvasSeed === undefined) canvasSeed = Math.random();
      await chrome.storage.local.set({ canvasSeed });
      return canvasSeed;
    default:
      return 0;
  }
};

const freshSeed = async (mode = config.mode) => {
  await chrome.storage.local.remove('canvasSeed');
  config.seed = 0;
  return mode;
};

const canvasArgs = () => {
  return [chrome.runtime.id, config.active, config.seed];
};

const canvasInject = (id, active, seed) => {
  console.log('canvasInject', id, active, seed);
  if (!active) return;
  if (!seed) seed = Math.random();
  const rand = (index) => Math.abs(seed * (index || rand(1))) % 1;
  const shift = {
    r: Math.floor(rand(1) * 10) - 5,
    g: Math.floor(rand(2) * 10) - 5,
    b: Math.floor(rand(3) * 10) - 5,
    a: Math.floor(rand(4) * 10) - 5,
  };
  if (!Object.values(shift).reduce((i, j) => i + Math.abs(j), 0)) {
    shift.r = (shift.g = (shift.b = (shift.a = 1) + 1) + 1) + 1;
  }
  const { getImageData } = CanvasRenderingContext2D.prototype;
  const canvasNoisify = (canvas, context) => {
    console.log('canvasNoisify');
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
      chrome.runtime.sendMessage(id, {
        action: 'notification',
        id: 'canvas-fingerprint',
        message: 'Canvas fingerprinting detected!',
        contextMessage: document.location.href,
      });
    }
  };
  const canvasDefine = (prototype, key, apply) => {
    Object.defineProperty(prototype, key, {
      value: new Proxy(prototype[key], { apply }),
    });
  };
  const canvasHtmlApply = (target, self, args) => {
    canvasNoisify(self, self.getContext('2d'));
    return Reflect.apply(target, self, args);
  };
  const canvasApply = (target, self, args) => {
    canvasNoisify(self.canvas, self);
    return Reflect.apply(target, self, args);
  };
  const canvasIframes = () => {
    console.log('canvasIframes');
    for (const iframe of document.querySelectorAll('iframe')) {
      if (iframe.contentWindow) {
        if (iframe.contentWindow.CanvasRenderingContext2D) {
          canvasDefine(
            iframe.contentWindow.CanvasRenderingContext2D.prototype,
            'getImageData',
            canvasApply,
          );
        }
        if (iframe.contentWindow.HTMLCanvasElement) {
          canvasDefine(
            iframe.contentWindow.HTMLCanvasElement.prototype,
            'toBlob',
            canvasHtmlApply,
          );
          canvasDefine(
            iframe.contentWindow.HTMLCanvasElement.prototype,
            'toDataURL',
            canvasHtmlApply,
          );
        }
      }
    }
  };
  canvasDefine(HTMLCanvasElement.prototype, 'toBlob', canvasHtmlApply);
  canvasDefine(HTMLCanvasElement.prototype, 'toDataURL', canvasHtmlApply);
  canvasDefine(CanvasRenderingContext2D.prototype, 'getImageData', canvasApply);
  if (document.readyState == 'interactive') canvasIframes();
  else document.addEventListener('DOMContentLoaded', canvasIframes);
};

export const canvasScript = () => {
  return { func: canvasInject, args: canvasArgs() };
};

export const canvasConfig = async (active, mode, fresh = false) => {
  if (fresh) mode = await freshSeed(mode);
  if (mode) config.seed = await getSeed((config.mode = mode));
  if (active !== undefined) config.active = active;
};
