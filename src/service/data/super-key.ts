// oks
export const getOKSList = {
  name: 'getOKSList',
  code: 0,
  data: {
    oks: [
      {
        type: 7,
        code: 1,
        name: '快速急停AD',
        keys: [
          {
            key: 'W',
            code: 26,
            type: 0
          },
          {
            key: 'S',
            code: 22,
            type: 0
          }
        ]
      },
      {
        type: 7,
        code: 2,
        name: '快速急停WS',
        keys: [
          {
            key: 'Q',
            code: 20,
            type: 0
          },
          {
            key: 'A',
            code: 4,
            type: 0
          }
        ]
      }
    ]
  }
};
export const setOKSName = {
  name: 'setOKSName',
  data: {
    code: 1,
    name: '快速急停AD'
  }
};
export const delOKS = {
  name: 'delOKS',
  code: 0
};
export const getOKS = {
  name: 'getOKS',
  code: 0,
  data: {
    code: 1,
    name: '快速急停AD',
    keys: [
      {
        key: 'W',
        code: 26,
        type: 0
      },
      {
        key: 'S',
        code: 22,
        type: 0
      }
    ]
  }
};
export const setOKS = {
  name: 'setOKS',
  code: 0
};

// socd
export const getSOCDList = {
  name: 'getSOCDList',
  code: 0,
  data: {
    socd: [
      {
        type: 8,
        code: 1,
        trigger: 1,
        name: 'SOCD1',
        keys: [
          {
            key: 'B',
            code: 5,
            type: 0
          },
          {
            key: 'C',
            code: 6,
            type: 0
          }
        ]
      },
      {
        type: 8,
        code: 2,
        trigger: 2,
        name: 'SOCD2',
        keys: [
          {
            key: 'D',
            code: 7,
            type: 0
          },
          {
            key: 'E',
            code: 8,
            type: 0
          }
        ]
      }
    ]
  }
};
export const setSOCDName = {
  name: 'setSOCDName',
  data: {
    code: 1,
    name: 'SOCD1'
  }
};
export const delSOCD = {
  name: 'delSOCD',
  code: 0
};
export const getSOCD = {
  name: 'getSOCD',
  code: 0,
  data: {
    code: 1,
    name: 'SOCD1',
    trigger: 1,
    keys: [
      {
        key: 'B',
        code: 5,
        type: 0
      },
      {
        key: 'C',
        code: 6,
        type: 0
      }
    ]
  }
};
export const setSOCD = {
  name: 'setSOCD',
  code: 0
};

// rs
export const getRSList = {
  name: 'getRSList',
  code: 0,
  data: {
    rs: [
      {
        type: 11,
        code: 1,
        trigger: 1,
        name: 'RS1',
        keys: [
          {
            key: 'H',
            code: 11,
            type: 0
          },
          {
            key: 'I',
            code: 12,
            type: 0
          }
        ]
      },
      {
        type: 11,
        code: 2,
        trigger: 2,
        name: 'RS2',
        keys: [
          {
            key: 'J',
            code: 13,
            type: 0
          },
          {
            key: 'K',
            code: 14,
            type: 0
          }
        ]
      }
    ]
  }
};
export const setRSName = {
  name: 'setRSName',
  data: {
    code: 1,
    name: 'RS1'
  }
};
export const delRS = {
  name: 'delRS',
  code: 0
};
export const getRS = {
  name: 'getRS',
  code: 0,
  data: {
    code: 1,
    name: 'RS1',
    trigger: 1,
    keys: [
      {
        key: 'H',
        code: 11,
        type: 0
      },
      {
        key: 'I',
        code: 12,
        type: 0
      }
    ]
  }
};
export const setRS = {
  name: 'setRS',
  code: 0
};
