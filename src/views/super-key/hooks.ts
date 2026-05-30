import { BaseKey, BaseKeyView } from "@/api/modules/combo";
import { KeyTypeEnum } from "@/enum/keyType";
import { useCommonStore } from "@/store/modules/common";
import { useKeyboardStore } from "@/store/modules/keyboard";
import { toRaw, toRef, Ref } from "vue";
import type { GroupItem } from "./types";

export type { GroupItem } from "./types";

const commonStore = useCommonStore()
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey } = keyboardStore;

const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;

export function utilGenerateGroupCode(list: { base: { code: number } }[]) {
  if (list.length === 0) return 0;
  const usedCodes = new Set(list.map((group: { base: { code: number } }) => group.base.code));
  let newCode = 0;
  while (usedCodes.has(newCode)) {
    newCode++;
  }
  return newCode;
}

export function updateGroupEffect(key: string, moduleType: KeyTypeEnum) {
  updateSuperKey(key!, { moduleType });
}

type FormatItem = BaseKey & {
  keys: BaseKey[];
  name?: string;
};

export function formatGroupItem(item: FormatItem): GroupItem {
  const { code, type } = item;
  let viewId = ''
  const keyList = item.keys.map(keyBase => {
    const res = getKeyDetail({ code: keyBase.code, type: keyBase.type });
    updateGroupEffect(keyBase.key!, toRaw(currentSuperKeyType.value));
    viewId += res.label + res.type
    commonStore.forceUpdateSpOriginById(keyBase.key!, {
      superx: [type, code]
    });
    return res;
  });
  return {
    base: { code, type, name: item.name ?? '' },
    keyList,
    keyBaseList: item.keys.map(keyBase => {
      return keyBase;
    }),
    viewId
  };
}