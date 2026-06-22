export type GetShortcuts = {
  shortcuts: Shortcut[];
};

export type Shortcut = {
  type: number;
  code: number;
}

export type GetShortcut = {
  type: number;
  code: number;
  keys: Shortcut[];
}

export type AddShortcut = {
  type: number;
  code: number;
  keys: Shortcut[];
}

export type DelShortcut = {
  code: number;
}

export type LockShortcut = {
  enable: number;
  keys: number[];
}

export type GetLockShortcuts = {
  defaultLock: LockShortcut[];
  customLock: LockShortcut[];
}

export type SetLockShortcuts = {
  defaultLock: LockShortcut[];
  customLock: LockShortcut[];
}
