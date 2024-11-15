export const getBasicKey = {
  name: 'getBasicKey',
  code: 0,
  data: {
    config: 1,
    layer: 1,
    name: '默认（0）',
    def: {
      tary: [10, 10, 10, 1, 1]
    },
    keys: {
      ESC: {
        type: 1,
        code: 5,
        tary: [10, 10, 10, 1, 1]
      },
      A: {
        type: 2,
        code: 5,
        tary: [10, 10, 10, 1, 1]
      }
    },
    smart: {
      ESC: {
        super: [5, 1],
        mt: [6, 1]
      },
      A: {
        super: [5, 1],
        mt: [6, 1]
      }
    },
    disable: ['ESC', 'A']
  }
};
export const getKeyInfo = {
  name: 'getKeyInfo',
  code: 0,
  data: {
    id: 'A',
    type: 0,
    code: 4,
    enable: 1,
    tary: [10, 10, 10, 1, 1],
    super: [5, 1],
    mt: [6, 1]
  }
};
export const resetKeyInfo = {
  name: 'resetKeyInfo',
  code: 0,
  data: {
    id: 'A',
    type: 0,
    code: 4,
    tary: [10, 10, 10, 1, 1],
    super: null,
    mt: null
  }
};
export const setKeyInfo = {
  name: 'setKeyInfo',
  code: 0
};
