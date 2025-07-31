export enum DeviceType {
  GAMEPAD,
  TRANSPORT,
  KEYBOARD
}
export type DeviceVersion = {
  id: number;
  ver: number;
  tp: number;
  mode: string;
};
export type DeviceInfo = {
  aVer: number;
  rate: number;
  devTp: DeviceType;
  devVer: DeviceVersion[];
};
export enum DeviceIptEnum {
  PC,
  PS,
  SWITCH,
  OTA
}
export type DeviceIpt = {
  iptTp: DeviceIptEnum;
};
export type Rate = {
  rate: number;
};
