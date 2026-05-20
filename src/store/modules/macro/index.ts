import { defineStore } from 'pinia';
import { computed, reactive, toRefs } from 'vue';
import type { MacroAttr, MacroCfg, MacroKey, Macros } from '@/api/modules/macro';
import { useKeyboardStore } from '@/store/modules/keyboard';

export interface MacroFrame {
  inx: number;
  kt: number;
  iT: number;
  dT: number;
  ks: number[];
}

export interface UIKey {
  type: number;
  code: number;
  value: number | string;
  kt?: number;
}

export const useMacroStore = defineStore('macro', () => {
  let lastFrame: MacroFrame = { inx: -1, kt: 1, iT: 0, dT: 0, ks: [] };
  const uiKey: UIKey[] = reactive([] as UIKey[]);
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

  // 重置uiKey数组并停止录制
  const resetUIKey = () => {
    uiKey.length = 0;
    lastFrame = { inx: -1, kt: 1, iT: 0, dT: 0, ks: [] };
  };

  // 设置macroAttr
  const setMacroAttr = (attr: MacroAttr) => {
    macroAttr = attr;
  };
  // 获取macroAttr
  const getMacroAttr = () => macroAttr;

  // 获取当前的lastFrame
  const getLastFrame = () => lastFrame;

  // 获取uiKey数组
  const getUIKey = () => uiKey;

  // 新增宏配置
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

  // 添加一个UIKey到uiKey数组
  const addKey = (type: number, code: number, value: number, kt?: number) => {
    if (type === 3) {
      uiKey.push({ type, code, value, kt });
    } else {
      const data = codeMap.value[code]?.label;
      if (data) {
        uiKey.push({ type, code, value: data, kt });
      }
    }
  };

  // 计算frame类型的逻辑
  const calculateFrameType = (frame: MacroFrame): number => {
    return frame.inx === 0 || lastFrame.ks.length <= frame.ks.length ? 1 : 2;
  };

  // 计算两个frame代码差异
  const calculateFrameDiff = (lastCode: number[], currentCode: number[]): number[] => {
    const diff: number[] = [];
    const lastSet = new Set(lastCode);
    const currentSet = new Set(currentCode);

    lastCode.forEach(item => {
      if (!currentSet.has(item)) diff.push(item);
    });
    currentCode.forEach(item => {
      if (!lastSet.has(item)) diff.push(item);
    });

    return diff;
  };

  // 计算UIKey的差异并添加一个MacroFrame
  const addFrame = (frame: MacroFrame) => {
    const type = calculateFrameType(frame);
    const diff = calculateFrameDiff(lastFrame.ks, frame.ks);

    // 更新UIKey数组，记录时间差和差异
    if (frame.inx !== 0) {
      addKey(3, 0, frame.iT, frame.kt);
    }
    diff.forEach(code => addKey(type, code, 0, frame.kt));

    lastFrame = frame;
  };

  // 初始化宏配置
  const initMacroCfg = (macroCfg: MacroCfg) => {
    resetUIKey();
    setMacroAttr(macroCfg.attr);
    macroCfg.keys.forEach(addFrame);
  };

  // 更新所有UIKey的时间值
  const updateAllTime = (time: number) => {
    uiKey.forEach(item => {
      if (item.type === 3) item.value = time;
    });
  };

  // 更新指定索引位置的UIKey类型
  const updateKey = (index: number, type: number) => {
    if (uiKey[index]) {
      uiKey[index].type = type;
    }
  };

  // 在指定位置插入UIKey
  const insertUIKey = (index: number, key: UIKey) => {
    uiKey.splice(index + 1, 0, key);
  };

  // 删除指定位置的UIKey
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

  // 开始录制
  const recordUIKey = () => {};

  const pauseRecordMacro = () => {};

  // 处理UIKey的类型变化
  const handleUIKeyChange = (item: UIKey, code: number[]) => {
    if (item.type === 1) {
      code.push(item.code);
    } else if (item.type === 2) {
      const index = code.indexOf(item.code);
      if (index !== -1) code.splice(index, 1);
    }
  };

  // 保存当前UIKey数组
  const saveUIKey = (): MacroCfg | undefined => {
    if (uiKey.length === 0) return undefined;

    const macroKey: MacroKey[] = [];
    const ks: number[] = [];
    let inx = 0;
    let accumulatedTime = 0;

    uiKey.forEach((item, idx) => {
      if (item.type !== 3) {
        handleUIKeyChange(item, ks);
      } else {
        macroKey.push({
          inx,
          kt: item.kt ?? 1,
          iT: Number(item.value),
          dT: accumulatedTime,
          ks: [...ks]
        });
        inx += 1;
        accumulatedTime += Number(item.value);
      }

      // 处理最后一个元素作为结束帧
      if (idx === uiKey.length - 1) {
        macroKey.push({
          inx,
          kt: item.kt ?? 1,
          iT: 0,
          dT: accumulatedTime,
          ks: [...ks]
        });
      }
    });

    const macroCfg: MacroCfg = {
      attr: macroAttr,
      keys: macroKey
    };

    console.log('保存配置', JSON.stringify(macroCfg));
    return macroCfg;
  };

  const getKeyNameByCode = (code: number) => {
    return codeMap.value[code]?.label?.replace(/\s+/g, '');
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
    saveUIKey,
    uiKey,
    getKeyNameByCode
  };
});
