const config = {
  active: true,
  mode: 'random',
  shift: null,
};

const newShift = () => ({
  r: Math.floor(Math.random() * 10) - 5,
  g: Math.floor(Math.random() * 10) - 5,
  b: Math.floor(Math.random() * 10) - 5,
  a: Math.floor(Math.random() * 10) - 5,
});

const sessionShift = async () => {
  if (!config.shift) return newShift();
  else return config.shift;
};

const fixedShift = async () => {
  let { canvasShift } = await chrome.storage.local.get('canvasShift');
  if (canvasShift === undefined) canvasShift = newShift();
  await chrome.storage.local.set({ canvasShift });
  return canvasShift;
};

const freshShift = async (mode = config.mode) => {
  switch (mode) {
    case 'session':
      config.shift = null;
      break;
    case 'fixed':
      await chrome.storage.local.remove('canvasShift');
      break;
  }
  return mode;
};

const getShift = (mode) => {
  switch (mode) {
    case 'session':
      return sessionShift();
    case 'fixed':
      return fixedShift();
    default:
      return null;
  }
};

export const canvasArgs = () => {
  return [chrome.runtime.id, config.active, config.shift];
};

export const canvasInject = (id, active, shift) => {
  console.log('canvasInject', id, active, shift);
  if (!active) return;
  if (!shift) {
    shift = {
      r: Math.floor(Math.random() * 10) - 5,
      g: Math.floor(Math.random() * 10) - 5,
      b: Math.floor(Math.random() * 10) - 5,
      a: Math.floor(Math.random() * 10) - 5,
    };
  }
  if (!Object.values(shift).reduce((i, j) => i + Math.abs(j), 0)) {
    shift.r = (shift.g = (shift.b = (shift.a = 1) + 1) + 1) + 1;
  }
  const { getImageData } = CanvasRenderingContext2D.prototype;
  const canvasNoisify = (canvas, context) => {
    console.log('canvasNoisify');
    if (context) {
      const width = canvas.width;
      const height = canvas.height;
      if (width && height) {
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
          message: 'Canvas fingerprinting detected!',
          contextMessage: document.location.href,
        });
      }
    }
  };
  const canvasIframes = () => {
    console.log('canvasIframes');
    for (const iframe of document.querySelectorAll('iframe')) {
      if (iframe.contentWindow) {
        if (iframe.contentWindow.CanvasRenderingContext2D) {
          iframe.contentWindow.CanvasRenderingContext2D.prototype.getImageData =
            CanvasRenderingContext2D.prototype.getImageData;
        }
        if (iframe.contentWindow.HTMLCanvasElement) {
          iframe.contentWindow.HTMLCanvasElement.prototype.toBlob =
            HTMLCanvasElement.prototype.toBlob;
          iframe.contentWindow.HTMLCanvasElement.prototype.toDataURL =
            HTMLCanvasElement.prototype.toDataURL;
        }
      }
    }
  };
  HTMLCanvasElement.prototype.toBlob = new Proxy(
    HTMLCanvasElement.prototype.toBlob,
    {
      apply(target, self, args) {
        canvasNoisify(self, self.getContext('2d'));
        return Reflect.apply(target, self, args);
      },
    },
  );
  HTMLCanvasElement.prototype.toDataURL = new Proxy(
    HTMLCanvasElement.prototype.toDataURL,
    {
      apply(target, self, args) {
        canvasNoisify(self, self.getContext('2d'));
        return Reflect.apply(target, self, args);
      },
    },
  );
  CanvasRenderingContext2D.prototype.getImageData = new Proxy(
    CanvasRenderingContext2D.prototype.getImageData,
    {
      apply(target, self, args) {
        canvasNoisify(self.canvas, self);
        return Reflect.apply(target, self, args);
      },
    },
  );
  if (document.readyState == 'interactive') canvasIframes();
  else document.addEventListener('DOMContentLoaded', canvasIframes);
};

export const canvasConfig = async (active, mode, fresh = false) => {
  if (fresh) mode = await freshShift(mode);
  if (mode) config.shift = await getShift((config.mode = mode));
  if (active !== undefined) config.active = active;
};
