export const getMacros = {
  name: 'getMacros',
  code: 0,
  data: {
    macro: [
      {
        name: '一键换装',
        type: 6,
        code: 0
      },
      {
        name: '李白流云回旋',
        type: 6,
        code: 1
      },
      {
        name: '上官婉儿一键飞天',
        type: 6,
        code: 2
      },
      {
        name: '王昭君冰封天下',
        type: 6,
        code: 3
      },
      {
        name: '赵云龙腾虎跃',
        type: 6,
        code: 4
      },
      {
        name: '后羿千里射杀',
        type: 6,
        code: 5
      },
      {
        name: '关羽一骑当千',
        type: 6,
        code: 6
      },
      {
        name: '貂蝉魅惑狂舞',
        type: 6,
        code: 7
      }
    ]
  }
};

export const getMacro = {
  name: 'getMacro',
  code: 0,
  data: {
    attr: {
      type: 6,
      code: 1,
      name: '一键换装',
      trigger: 0,
      triggerDelay: 1,
      loop: 1,
      delay: [1, 5],
      stopType: 0
    },
    keys: [
      {
        inx: 0,
        kt: 1,
        iT: 0,
        dT: 0,
        ks: [2, 3]
      },
      {
        inx: 1,
        kt: 1,
        iT: 3,
        dT: 3,
        ks: [2]
      },
      {
        inx: 2,
        kt: 1,
        iT: 2,
        dT: 5,
        ks: []
      },
      {
        inx: 3,
        kt: 1,
        iT: 2,
        dT: 7,
        ks: [4]
      },
      {
        inx: 4,
        kt: 1,
        iT: 2,
        dT: 9,
        ks: [4, 5]
      }
    ]
  }
};

export const setMacroName = {
  name: 'setMacroName',
  code: 0
};

export const delMacro = {
  name: 'delMacro',
  code: 0
};

export const setMacro = {
  name: 'setMacro',
  code: 0
};

export const macroStart = {
  name: 'macroStart',
  code: 0
};

export const macroFrame = {
  name: 'macroFrame',
  code: 0,
  data: {
    inx: 0,
    kt: 1,
    iT: 0,
    dT: 0,
    ks: [0, 0]
  }
};

export const macroStop = {
  name: 'macroStop',
  code: 0
};
