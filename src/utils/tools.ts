export function ab2hex(buffer: ArrayBuffer) {
  if (!(buffer instanceof ArrayBuffer)) {
    throw new TypeError(`Expect argument type as ArrayBuffer`);
  }
  const hexArr = Array.prototype.map.call(new Uint8Array(buffer), bit => {
    return `00${bit.toString(16)}`.slice(-2);
  });
  return hexArr.join(',');
}
export async function delay(delayMs: number) {
  return new Promise(res => {
    setTimeout(() => res(''), delayMs);
  });
}
export function hslToRgb(h = 0, s = 0, l = 0) {
  // eslint-disable-next-line no-param-reassign
  s /= 100;
  // eslint-disable-next-line no-param-reassign
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s; // Chroma
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); // Secondary color
  const m = l - c / 2;

  let b = 0;
  let g = 0;
  let r = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  // 将 r, g, b 转换到 [0, 255] 的范围
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}
