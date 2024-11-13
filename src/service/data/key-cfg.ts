export const getBasicKey = {
  name: 'getBasicKey',
  code: 0,
  data: {
    config: 1,
    level: 1,
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
    smart: [
      {
        name: 'ESC',
        super: [5, 1],
        mt: [6, 1]
      },
      {
        name: 'A',
        super: [5, 1],
        mt: [6, 1]
      }
    ],
    disable: ['ESC', 'A']
  }
};
