import { nextTick, ref, watch } from 'vue';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import { getComboLock, setComboLock } from '@/api/combo';
import { KeyTypeEnum } from '@/enum/keyType';
import { useKeyboardStore } from '@/store/modules/keyboard';
import type { BaseKey, ComboLockData } from '@/api/modules/combo';

export type SelectedKeyIndex = {
  groupIndex: number;
  keyIndex: number;
};
export enum ModuleNameEnum {
  default = 'default',
  custom = 'custom'
}
export type KeyItem = {
  base: BaseKey;
  detail: any;
};
export function useComboLock() {
  const keyboardStore = useKeyboardStore();
  const { getKeyDetail } = keyboardStore;
  const moduleName = ref(ModuleNameEnum.default);
  const comboLockUsefly = ref<boolean>(false)
  const [selectedKeyIndex, resetSelectedKeyIndex] = useResttableRefFn<SelectedKeyIndex>(() => ({
    groupIndex: -1,
    keyIndex: -1
  }));
  const [defaultGroups, _resetDefault] = useResttableRefFn<
    {
      keys: KeyItem[];
      enable: 0 | 1;
    }[]
  >(() => []);
  const [customGroups, _defaultCustomGroups] = useResttableRefFn<
    {
      keys: {
        base: any;
        detail: any;
      }[];
      enable: 0 | 1;
    }[]
  >(() => []);
  const updateKeySelect = (data: SelectedKeyIndex) => {
    selectedKeyIndex.value = data;
  };
  const setComboLockToDevice = async (data: ComboLockData) => {
    await setComboLock(data);
  };
  const initxx = async () => {
    const { defaultLock, customLock } = await getComboLock();
    const keyType = KeyTypeEnum.Normal;
    const x1 = new Promise((res, rej) => {
      try {
        defaultLock.forEach((item, index) => {

            defaultGroups.value[index] = {
              keys: [],
              enable: item.enable
            };
            item.keys.forEach(code => {
              const base = { code, type: keyType };
              const detail = getKeyDetail(base);
              defaultGroups.value[index].keys.push({
                base,
                detail
              });
            });
            if (index === defaultLock.length - 1) {
              res('');
            }
        });
      } catch (error) {
        rej(error);
      }

    });
    const x2 = new Promise((res, rej) => {
      try {
        customLock.forEach((item, index) => {
          try {
            customGroups.value[index] = {
              keys: [],
              enable: item.enable
            };
            item.keys.forEach(code => {
              const base = { code, type: keyType };
              const detail = getKeyDetail(base);
              customGroups.value[index].keys.push({
                base,
                detail
              });
            });
            if (index === customLock.length - 1) {
              res('');
            }
          } catch (error) {
            rej(error);
          }
        });
      } catch (error) {
        rej(error);
      }
    });
    return Promise.all([x1, x2]);
  };
  nextTick(async () => {
    try {
      await initxx();
      comboLockUsefly.value = true;
    } catch (error: any) {
      comboLockUsefly.value = false;
      window?.$log!.error('ComboLock init error', error);
    }
  });
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
    setComboLockToDevice,
    comboLockUsefly
  };
}
