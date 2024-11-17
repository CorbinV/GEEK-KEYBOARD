// 将字符串转为 Uint8Array
export function jsonToArray(data: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(data);
}

// 将 Uint8Array 转为字符串
export function arrayToJson(data: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(data);
}

// 将对象转为 Uint8Array
export function objToArray(obj: any): Uint8Array {
  return jsonToArray(JSON.stringify(obj));
}

let arr: number[] = [];
function appendData(data: Uint8Array): void {
  arr.push(...data);
}

// 解析数据包
export function depacketize(data: Uint8Array): Uint8Array | undefined {
  if (data.length < 4) return undefined;
  switch (data[0]) {
    case 0xa5:
      return data.slice(2, data[1] - 1);
    case 0xa4:
      if (data[2] > 0x80) {
        arr = [];
      }
      appendData(data.slice(3, data[1] - 1));
      return data[2] === 0 ? new Uint8Array(arr) : undefined;
    default:
      return undefined;
  }
}

// 将数据包拆分成多个小包
export function packetize(data: Uint8Array, mtu: number = 48): Uint8Array[] {
  const packages: Uint8Array[] = [];
  if (data.length <= mtu) {
    const header = 0xa5;
    const packageLength = data.length + 3;
    const packageBuffer = new Uint8Array(packageLength);
    packageBuffer[0] = header;
    packageBuffer[1] = packageLength;
    packageBuffer.set(data, 2);
    const checksum = packageBuffer.reduce((a, b) => a + b, 0) & 0xff;
    packageBuffer[packageLength - 1] = checksum;
    packages.push(packageBuffer);
  } else {
    const header = 0xa4;
    const maxDataSize = mtu - 4;
    const count = Math.ceil(data.length / maxDataSize);
    for (let i = 0; i < count; i++) {
      const start = i * maxDataSize;
      const end = Math.min(start + maxDataSize, data.length);
      const packageData = data.slice(start, end);
      const packageLength = packageData.length + 4;
      const packageBuffer = new Uint8Array(packageLength);
      packageBuffer[0] = header;
      packageBuffer[1] = packageLength;
      packageBuffer[2] = count - i - 1;
      if (i === 0) {
        packageBuffer[2] += 0x80;
      }
      packageBuffer.set(packageData, 3);
      const checksum = packageBuffer.reduce((a, b) => a + b, 0) & 0xff;
      packageBuffer[packageLength - 1] = checksum;
      packages.push(packageBuffer);
    }
  }
  return packages;
}
