export type KeyboardSetting = {
  code: number;
  allKey: boolean;
  wakeUp: boolean;
};
export type SetKeyboardSetting = {
  allKey: boolean;
  wakeUp: boolean;
};

export type ResetKeyboard = {
  code: number;
};

export type SetKeyPerf = {
  code: number;
};
