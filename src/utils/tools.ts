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
  const H = h / 360; // 将 H 转换为 [0, 1] 范围
  const S = s / 100; // 将 S 转换为 [0, 1] 范围
  const L = l / 100; // 将 L 转换为 [0, 1] 范围

  const C = (1 - Math.abs(2 * L - 1)) * S; // 色差
  const X = C * (1 - Math.abs(((H * 6) % 2) - 1)); // 计算辅助值
  const m = L - C / 2; // 偏移量

  let b;
  let g;
  let r;

  if (H >= 0 && H < 1 / 6) {
    r = C;
    g = X;
    b = 0;
  } else if (H >= 1 / 6 && H < 2 / 6) {
    r = X;
    g = C;
    b = 0;
  } else if (H >= 2 / 6 && H < 3 / 6) {
    r = 0;
    g = C;
    b = X;
  } else if (H >= 3 / 6 && H < 4 / 6) {
    r = 0;
    g = X;
    b = C;
  } else if (H >= 4 / 6 && H < 5 / 6) {
    r = X;
    g = 0;
    b = C;
  } else {
    r = C;
    g = 0;
    b = X;
  }

  // 加上偏移量 m，确保值在 [0, 1] 范围内
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  // return { r, g, b };
  return [r, g, b];
}

export function rgbToHsl(r = 0, g = 0, b = 0) {
  // 将 RGB 值映射到 [0, 1] 范围
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let H;
  let S;
  const L = (max + min) / 2; // 计算亮度

  if (delta === 0) {
    H = 0; // 如果没有差异，色调为 0
    S = 0; // 如果没有色差，饱和度为 0
  } else {
    S = delta / (1 - Math.abs(2 * L - 1)); // 计算饱和度
    if (max === red) {
      H = (green - blue) / delta;
    } else if (max === green) {
      H = 2 + (blue - red) / delta;
    } else {
      H = 4 + (red - green) / delta;
    }
    H *= 60; // 转换为度数

    if (H < 0) {
      H += 360; // 如果 H 变为负数，则加上 360
    }
  }

  // 将 H, S, L 转换回百分比格式
  return { H, S: S * 100, L: L * 100 };
}
export function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}
export function number2Version(n: number, p: number = 3) {
  const s: string[] = [];

  for (let index = p - 1; index >= 0; index--) {
    const v = Math.floor((n / 10 ** index) % 10);
    s.push(`${v}`);
  }
  return s;
}
