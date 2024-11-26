import { reactive } from 'vue';
import type { MacroAttr, MacroCfg, MacroKey, Macros } from '@/api/modules/macro';

// 定义接口和枚举
export interface MacroFrame {
  index: number;
  time: number;
  code: number[];
}

export interface UIKey {
  type: number;
  code: number;
  value: number;
}

// 变量
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

// 方法
const actions = {
  // 新增宏配置code
  newMacroCode(macros: Macros) {
    let index = 0;
    for (const item of macros.macro) {
      if (item.code === index) {
        index++;
      } else {
        break;
      }
    }
    return index;
  },
  // 初始化宏配置
  initMacroCfg(macroCfg: MacroCfg) {
    this.resetUIKey();
    this.setMacroAttr(macroCfg.attr);
    macroCfg.keys.forEach(item => {
      actions.addFrame(item);
    });
  },
  // 更新所有UIKey的时间值
  updateAllTime(time: number) {
    uiKey.forEach(item => {
      if (item.type === 3) item.value = time;
    });
  },

  // 添加一个UIKey到uiKey数组
  addKey(type: number, code: number, value: number) {
    uiKey.push({ type, code, value });
  },

  // 更新指定索引位置的UIKey类型
  updateKey(index: number, type: number) {
    if (uiKey[index]) {
      uiKey[index].type = type;
    }
  },

  // 计算UIKey的差异并添加一个MacroFrame
  addFrame(frame: MacroFrame) {
    const type = this.calculateFrameType(frame);
    const diff = this.calculateFrameDiff(lastFrame.code, frame.code);

    // 更新UIKey数组，记录时间差和差异
    if (frame.index !== 0) {
      this.addKey(3, 0, frame.time - lastFrame.time);
    }
    diff.forEach(code => this.addKey(type, code, 0));

    lastFrame = frame;
  },

  // 计算frame类型的逻辑
  calculateFrameType(frame: MacroFrame): number {
    if (frame.index === 0) return 1;
    if (lastFrame.code.length > frame.code.length) return 2;
    return 1;
  },

  // 计算两个frame代码差异
  calculateFrameDiff(lastCode: number[], currentCode: number[]): number[] {
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
  },

  // 在指定位置插入UIKey
  insertUIKey(index: number, key: UIKey) {
    uiKey.splice(index + 1, 0, key);
  },

  // 删除指定位置的UIKey
  deleteUIKey(index: number) {
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
  },

  // 重置uiKey数组并停止录制
  resetUIKey() {
    uiKey.length = 0;
    lastFrame = { index: -1, time: 0, code: [] };
  },

  // 开始录制
  recordUIKey() {},
  pauseRecord() {},

  // 保存当前UIKey数组
  saveUIKey(): MacroCfg | undefined {
    if (uiKey.length === 0) return undefined;

    const macroKey: MacroKey[] = [];
    const code: number[] = [];
    let index = 0;
    let time = 0;

    uiKey.forEach((item, idx) => {
      if (item.type !== 3) {
        this.handleUIKeyChange(item, code);
      } else {
        macroKey.push({ index, code: [...code], time });
        index++;
        time += item.value;
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
  },

  // 处理UIKey的类型变化
  handleUIKeyChange(item: UIKey, code: number[]) {
    if (item.type === 1) {
      code.push(item.code);
    } else if (item.type === 2) {
      const index = code.indexOf(item.code);
      if (index !== -1) code.splice(index, 1);
    }
  },
  // 获取macroAttr
  getMacroAttr() {
    return macroAttr;
  },
  // 设置macroAttr
  setMacroAttr(attr: MacroAttr) {
    macroAttr = attr;
  },

  // 获取当前的lastFrame
  getLastFrame() {
    return lastFrame;
  },

  // 获取uiKey数组
  getUIKey() {
    return uiKey;
  }
};

// 批量导出所有的函数和变量
export default actions;
