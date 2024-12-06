export const getShortcuts = {
  name: 'getShortcuts',
  code: 0,
  data: {
    shortcuts: [
      {
        type: 3,
        key: 'A',
        code: 4
      },
      {
        type: 3,
        key: 'C',
        code: 5
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
    key: 'A',
    keys: [
      {
        type: 0,
        key: 'G',
        code: 4
      },
      {
        type: 0,
        key: 'L',
        code: 5
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
