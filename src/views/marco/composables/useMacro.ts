import { computed, reactive, toRefs } from 'vue';
import type { MacroAttr, MacroCfg, MacroKey, Macros } from '@/api/modules/macro';
import { useKeyboardStore } from '@/store/modules/keyboard';

export interface MacroFrame {
  index: number;
  time: number;
  code: number[];
}

export interface UIKey {
  type: number;
  code: number;
  value: number | string;
}

export function useMacro() {
  let lastFrame: MacroFrame = { index: -1, time: 0, code: [] };
  const uiKey: UIKey[] = reactive([]);
  let macroAttr: MacroAttr = {
    type: 6,
    code: -1,
    name: '',
    trigger: 0,
    triggerDelay: 0,
    loop: 1,
    delay: [0, 0],
    stopType: 0
  };
  const keyboardStore = useKeyboardStore();
  const { kbCfg } = toRefs(keyboardStore);
  const codeMap = computed(() => kbCfg.value.keyMap[0].code);

  const resetUIKey = () => {
    uiKey.length = 0;
    lastFrame = { index: -1, time: 0, code: [] };
  };

  const setMacroAttr = (attr: MacroAttr) => {
    macroAttr = attr;
  };
  const getMacroAttr = () => {
    return macroAttr;
  };

  const getLastFrame = () => {
    return lastFrame;
  };

  const getUIKey = () => {
    return uiKey;
  };
  const newMacroCode = (macros: Macros): number => {
    let index = 0;
    for (const item of macros.macro) {
      if (item.code === index) {
        index += 1;
      } else {
        break;
      }
    }
    return index;
  };

  const addKey = (type: number, code: number, value: number) => {
    if (type === 3) {
      uiKey.push({ type, code, value });
    } else {
      const data = codeMap.value[code]?.label;
      if (data) {
        uiKey.push({ type, code, value: data });
      }
    }
  };

  const calculateFrameType = (frame: MacroFrame): number => {
    if (frame.index === 0) return 1;
    if (lastFrame.code.length > frame.code.length) return 2;
    return 1;
  };

  const calculateFrameDiff = (lastCode: number[], currentCode: number[]): number[] => {
    const lastSet = new Set(lastCode);
    const currentSet = new Set(currentCode);
    const diff: number[] = [];

    lastCode.forEach(item => {
      if (!currentSet.has(item)) diff.push(item);
    });
    currentCode.forEach(item => {
      if (!lastSet.has(item)) diff.push(item);
    });

    return diff;
  };

  const addFrame = (frame: MacroFrame) => {
    const type = calculateFrameType(frame);
    const diff = calculateFrameDiff(lastFrame.code, frame.code);

    // 更新UIKey数组，记录时间差和差异
    if (frame.index !== 0) {
      addKey(3, 0, frame.time - lastFrame.time);
    }
    diff.forEach(code => addKey(type, code, 0));

    lastFrame = frame;
  };

  const initMacroCfg = (macroCfg: MacroCfg) => {
    resetUIKey();
    setMacroAttr(macroCfg.attr);
    macroCfg.keys.forEach(item => {
      addFrame(item);
    });
  };

  const updateAllTime = (time: number) => {
    uiKey.forEach(item => {
      if (item.type === 3) item.value = time;
    });
  };

  const updateKey = (index: number, type: number) => {
    if (uiKey[index]) {
      uiKey[index].type = type;
    }
  };

  const insertUIKey = (index: number, key: UIKey) => {
    uiKey.splice(index + 1, 0, key);
  };

  const deleteUIKey = (index: number) => {
    if (index < 0 || index >= uiKey.length) return;

    const isLast = index === uiKey.length - 1;
    const isFirst = index === 0;

    if (isLast) {
      const prevKey = uiKey[index - 1];
      if (prevKey?.type === 3) {
        uiKey.splice(index - 1, 2);
      } else {
        uiKey.splice(index, 1);
      }
    } else if (isFirst) {
      const nextKey = uiKey[1];
      if (nextKey?.type === 3) {
        uiKey.splice(index, 2);
      } else {
        uiKey.splice(index, 1);
      }
    } else {
      uiKey.splice(index, 1);
    }
  };

  const recordUIKey = () => {};

  const pauseRecordMacro = () => {};

  const handleUIKeyChange = (item: UIKey, code: number[]) => {
    if (item.type === 1) {
      code.push(item.code);
    } else if (item.type === 2) {
      const index = code.indexOf(item.code);
      if (index !== -1) code.splice(index, 1);
    }
  };

  const saveUIKey = (): MacroCfg | undefined => {
    if (uiKey.length === 0) return undefined;

    const macroKey: MacroKey[] = [];
    const code: number[] = [];
    let index = 0;
    let time = 0;

    uiKey.forEach((item, idx) => {
      if (item.type !== 3) {
        handleUIKeyChange(item, code);
      } else {
        macroKey.push({ index, code: [...code], time });
        index++;
        time += Number(item.value);
      }

      // 处理最后一个元素
      if (idx === uiKey.length - 1) {
        macroKey.push({ index, code: [...code], time });
      }
    });

    const macroCfg: MacroCfg = {
      attr: macroAttr,
      keys: macroKey
    };

    console.log('保存配置', JSON.stringify(macroCfg));
    return macroCfg;
  };

  return {
    resetUIKey,
    setMacroAttr,
    getMacroAttr,
    getLastFrame,
    getUIKey,
    newMacroCode,
    addKey,
    addFrame,
    initMacroCfg,
    updateAllTime,
    updateKey,
    insertUIKey,
    deleteUIKey,
    recordUIKey,
    pauseRecordMacro,
    saveUIKey
  };
}
