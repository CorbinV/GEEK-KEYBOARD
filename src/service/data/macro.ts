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
        index: 0,
        code: [2, 3],
        time: 0
      },
      {
        index: 1,
        code: [2],
        time: 3
      },
      {
        index: 2,
        code: [],
        time: 5
      },
      {
        index: 3,
        code: [4],
        time: 7
      },
      {
        index: 4,
        code: [4, 5],
        time: 9
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
    index: 0,
    time: 0,
    code: [0, 0]
  }
};

export const macroStop = {
  name: 'macroStop',
  code: 0
};
