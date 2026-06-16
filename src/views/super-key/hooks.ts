import { BaseKey } from "@/api/modules/combo";
import { KeyTypeEnum } from "@/enum/keyType";
import { formatLableSub3 } from "@/hooks/common/format";
import { useCommonStore } from "@/store/modules/common";
import { useKeyboardStore } from "@/store/modules/keyboard";
import type { GroupItem } from "./types";

export type { GroupItem } from "./types";

const commonStore = useCommonStore()
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey } = keyboardStore;

export function utilGenerateGroupCode(list: { base: { code: number } }[]) {
  if (list.length === 0) return 0;
  const usedCodes = new Set(list.map((group: { base: { code: number } }) => group.base.code));
  let newCode = 0;
  while (usedCodes.has(newCode)) {
    newCode++;
  }
  return newCode;
}

export function updateGroupEffect(key: string, moduleType: KeyTypeEnum, mtCfg?: any) {
  updateSuperKey(key!, { moduleType, mtCfg });
}

type FormatItem = BaseKey & {
  keys: BaseKey[];
  name?: string;
};

export function formatGroupItem(item: FormatItem): GroupItem {
  const { code, type } = item;
  let viewId = ''
  const keyList = item.keys.map((keyBase, keyIdx) => {
    // DKS 等协议的子 key 不携带 type 字段，默认使用 Normal(0)
    const keyType = keyBase.type ?? KeyTypeEnum.Normal;
    // code=0 为空槽位，跳过视图生成
    if (!keyBase.code) {
      return { icon: '', type: 'str' as const, label: '' };
    }
    const res = getKeyDetail({ code: keyBase.code, type: keyType });
    // MT: 仅在物理按键(keys[0])上设置标识，标识内容为逻辑按键(keys[1])的信息
    let mtCfg: any;
    if (type === KeyTypeEnum.MT) {
      mtCfg = keyIdx === 0 && item.keys[1]?.code
        ? formatLableSub3(getKeyDetail({ code: item.keys[1].code, type: item.keys[1].type ?? KeyTypeEnum.Normal }))
        : undefined;
    }
    updateGroupEffect(keyBase.key!, type, mtCfg);
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
