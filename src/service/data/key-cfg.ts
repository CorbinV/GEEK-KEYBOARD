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
      A: {
        type: 0,
        code: 4,
        tary: [10, 10, 10, 1, 1]
      },
      B: {
        type: 0,
        code: 5,
        tary: [10, 10, 10, 1, 1]
      },
      C: {
        type: 0,
        code: 6,
        tary: [10, 10, 10, 1, 1]
      },
      D: {
        type: 0,
        code: 7,
        tary: [10, 10, 10, 1, 1]
      },
      E: {
        type: 0,
        code: 8,
        tary: [10, 10, 10, 1, 1]
      },
      F: {
        type: 0,
        code: 9,
        tary: [10, 10, 10, 1, 1]
      },
      S: {
        type: 0,
        code: 22,
        tary: [10, 10, 10, 1, 1]
      },
      W: {
        type: 0,
        code: 26,
        tary: [10, 10, 10, 1, 1]
      },
      M: {
        type: 0,
        code: 16,
        tary: [10, 10, 10, 1, 1]
      },
      N: {
        type: 0,
        code: 17,
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
    disable: []
  }
};
export const getKeyInfo = {
  name: 'getKeyInfo',
  code: 0,
  data: {
    key: 'A',
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
    key: 'A',
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
