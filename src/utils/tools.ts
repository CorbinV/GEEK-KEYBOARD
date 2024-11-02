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
