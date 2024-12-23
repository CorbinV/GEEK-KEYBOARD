export const getShortcuts = {
  name: 'getShortcuts',
  code: 0,
  data: {
    shortcuts: [
      {
        type: 3,
        code: 0
      },
      {
        type: 3,
        code: 1
      }
    ]
  }
};
export const getShortcut = {
  name: 'getShortcut',
  code: 0,
  data: {
    type: 3,
    code: 0,
    keys: [
      {
        type: 0,
        code: 4
      },
      {
        type: 0,
        code: 5
      },
      {
        type: 0,
        code: 6
      },
      {
        type: 0,
        code: 7
      }
    ]
  }
};
export const addShortcut = {
  name: 'addShortcut',
  code: 0
};
export const delShortcut = {
  name: 'delShortcut',
  code: 0
};
export const getLockShortcuts = {
  name: 'getLockShortcuts',
  code: 0,
  data: {
    defaultLock: [
      {
        enable: 1,
        keys: [4, 65]
      },
      {
        enable: 1,
        keys: [5, 65]
      },
      {
        enable: 1,
        keys: [5, 65]
      },
      {
        enable: 1,
        keys: [5, 65]
      }
    ],
    customLock: [
      {
        enable: 0,
        keys: [4, 65, 7]
      },
      {
        enable: 0,
        keys: [4, 65, 7]
      },
      {
        enable: 0,
        keys: [4, 65, 7]
      },
      {
        enable: 0,
        keys: [4, 65, 7]
      }
    ]
  }
};
export const setLockShortcuts = {
  name: 'setLockShortcuts',
  code: 0
};
