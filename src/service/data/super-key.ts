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

// mt
export const getMTList = {
  name: 'getMTList',
  code: 0,
  data: {
    mt: [
      {
        type: 9,
        code: 1,
        trigger: 1,
        name: 'MT1',
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
      },
      {
        type: 9,
        code: 2,
        trigger: 2,
        name: 'MT2',
        keys: [
          {
            key: 'L',
            code: 15,
            type: 0
          },
          {
            key: 'O',
            code: 18,
            type: 0
          }
        ]
      }
    ]
  }
};

export const setMTName = {
  name: 'setMTName',
  data: {
    code: 1,
    name: 'MT1'
  }
};
export const delMT = {
  name: 'delMT',
  code: 0
};
export const getMT = {
  name: 'getMT',
  code: 0,
  data: {
    code: 1,
    name: 'MT1',
    trigger: 1,
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
};

export const setMT = {
  name: 'setMT',
  code: 0
};

// tgl
export const getTGLList = {
  name: 'getTGLList',
  code: 0,
  data: {
    tgl: [
      {
        type: 10,
        code: 1,
        trigger: 1,
        name: 'TGL1',
        keys: [
          {
            key: 'P',
            code: 19,
            type: 0
          },
          {
            key: 'T',
            code: 20,
            type: 0
          }
        ]
      },
      {
        type: 10,
        code: 2,
        trigger: 2,
        name: 'TGL2',
        keys: [
          {
            key: 'U',
            code: 24,
            type: 0
          },
          {
            key: 'V',
            code: 25,
            type: 0
          }
        ]
      }
    ]
  }
};
export const setTGLName = {
  name: 'setTGLName',
  data: {
    code: 1,
    name: 'TGL1'
  }
};
export const delTGL = {
  name: 'delTGL',
  code: 0
};
export const getTGL = {
  name: 'getTGL',
  code: 0,
  data: {
    code: 1,
    name: 'TGL1',
    trigger: 1,
    keys: [
      {
        key: 'P',
        code: 19,
        type: 0
      },
      {
        key: 'T',
        code: 20,
        type: 0
      }
    ]
  }
};
export const setTGL = {
  name: 'setTGL',
  code: 0
};
// dks
export const getDKSList = {
  name: 'getDKSList',
  code: 0,
  data: {
    shortcuts: [
      {
        type: 5,
        code: 4,
        key: 'F',
        name: 'DKS一',
        simulation: 1,
        range: [10, 20, 30, 10],
        keys: [
          {
            code: 4,
            key: 'A',
            range: [0, 0, 1, 1, 2, 2, 3, 3]
          },
          {
            code: 5,
            key: 'B',
            range: []
          },
          {
            code: 6,
            key: 'C',
            range: []
          },
          {
            code: 7,
            key: 'D',
            range: []
          }
        ]
      }
    ]
  }
};
export const setDKSName = {
  name: 'setDKSName',
  code: 0
};
export const delDKS = {
  name: 'delDKS',
  code: 0
};
export const getDKS = {
  name: 'getDKS',
  code: 0,
  data: {
    type: 5,
    code: 4,
    key: 'F',
    name: 'DKS一',
    simulation: 1,
    range: [10, 20, 30, 10],
    keys: [
      {
        code: 4,
        key: 'A',
        range: [0, 0, 1, 1, 2, 2, 3, 3]
      },
      {
        code: 5,
        key: 'B',
        range: []
      },
      {
        code: 6,
        key: 'C',
        range: []
      },
      {
        code: 7,
        key: 'D',
        range: []
      }
    ]
  }
};
