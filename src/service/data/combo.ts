export const getShortcuts = {
  name: 'getShortcuts',
  code: 0,
  data: {
    shortcuts: [
      {
        type: 3,
        code: 4
      },
      {
        type: 3,
        code: 5
      },
      {
        type: 3,
        code: 6
      },
      {
        type: 3,
        code: 7
      }
    ]
  }
};
export const getShortcut = {
  name: 'getShortcut',
  code: 0,
  data: {
    type: 3,
    code: 1,
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
export const deleteShortcut = {
  name: 'delShortcut',
  code: 0
};
