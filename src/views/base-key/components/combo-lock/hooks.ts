import { ref, watch } from 'vue';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import { getLockShortcuts, setLockShortcuts } from '@/api/shortcuts-setting';
import { KeyTypeEnum } from '@/enum/keyType';
import { useKeyboardStore } from '@/store/modules/keyboard';

export type SelectedKeyIndex = {
  groupIndex: number;
  keyIndex: number;
};
export enum ModuleNameEnum {
  default = 'default',
  custom = 'custom'
}
export type KeyItem = {
  base: { code: number; type: KeyTypeEnum; key?: string };
  detail: any;
};
export function useComboLock() {
  const keyboardStore = useKeyboardStore();
  const { getKeyDetail } = keyboardStore;
  const moduleName = ref(ModuleNameEnum.default);
  const [selectedKeyIndex, resetSelectedKeyIndex] = useResttableRefFn<SelectedKeyIndex>(() => ({
    groupIndex: -1,
    keyIndex: -1
  }));
  const [defaultGroups, resetDefaultGroups] = useResttableRefFn<
    {
      keys: KeyItem[];
      enable: 0 | 1;
    }[]
  >(() => []);
  const [customGroups, resetCustomGroups] = useResttableRefFn<
    {
      keys: KeyItem[];
      enable: 0 | 1;
    }[]
  >(() => []);
  const updateKeySelect = (data: SelectedKeyIndex) => {
    selectedKeyIndex.value = data;
  };

  // 获取锁组合键数据
  const fetchLockShortcuts = async () => {
    const { defaultLock, customLock } = await getLockShortcuts();
    console.log('获取锁组合键数据：', defaultLock, customLock);
    const keyType = KeyTypeEnum.Normal;

    // 处理默认锁定组合键
    defaultGroups.value = defaultLock.map(item => ({
      keys: item.keys.map(code => {
        const base = { code, type: keyType };
        const detail = getKeyDetail(base);
        return { base, detail };
      }),
      enable: item.enable as 0 | 1
    }));

    // 处理自定义锁定组合键
    customGroups.value = customLock.map(item => ({
      keys: item.keys.map(code => {
        const base = { code, type: keyType };
        const detail = getKeyDetail(base);
        return { base, detail };
      }),
      enable: item.enable as 0 | 1
    }));
  };

  // 保存锁组合键数据到设备
  const saveLockShortcuts = async (data: { defaultLock: any[]; customLock: any[] }) => {
    await setLockShortcuts(data);
  };

  watch(
    () => moduleName.value,
    () => {
      resetSelectedKeyIndex();
    }
  );
  return {
    selectedKeyIndex,
    defaultGroups,
    customGroups,
    updateKeySelect,
    moduleName,
    fetchLockShortcuts,
    saveLockShortcuts,
    resetDefaultGroups,
    resetCustomGroups
  };
}
