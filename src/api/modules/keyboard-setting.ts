export type KeyboardSetting = {
  allKey: 0 | 1;
  wakeUp: 0 | 1;
  wpDistance: number;
  wpDistances: number[];
  deepSleep: number;
  ds: number[]
};
export type SetKeyboardSetting = {
  allKey?: number;
  wakeUp?: number;
  wpDistance?: number;
  deepSleep?: number;
};

export type ResetKeyboard = {
  code: number;
};

export type SetKeyPerf = {
  code: number;
};
export type DeviceInfo = {
  zkm: number
  // model: string;
  // version: string;
  connect: number;
  firmwares: { version: number; id: number; type: number; model: string }[]
  battery: number;
  bleMtu: number;
  bleOtaMtu: number;
  usbMtu: number;
  usbOtaMtu: number;
};
