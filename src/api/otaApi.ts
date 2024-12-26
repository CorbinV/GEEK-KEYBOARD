import requestClient from './config';

export function OTAStart(data: { ver: number; len: number; crc: number }) {
  return requestClient.send({
    name: 'OTAStart',
    data
  });
}

export function OTAPacket(data: { index: number; data: Uint8Array }) {
  return requestClient.send({
    name: 'OTAPacket',
    data
  });
}

export function OTAEnd() {
  return requestClient.send({
    name: 'OTAEnd'
  });
}
