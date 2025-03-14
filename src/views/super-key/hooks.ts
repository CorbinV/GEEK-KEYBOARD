import { BaseKey, BaseKeyView } from "@/api/modules/combo";
import { OksItem, ReName } from "@/api/modules/super-key";
import { KeyTypeEnum } from "@/enum/keyType";
import { $t } from "@/locales";
import { useCommonStore } from "@/store/modules/common";
import { useKeyboardStore } from "@/store/modules/keyboard";
import emitter, { EventNameEnum } from "@/utils/eventBus";
import { effectScope, onScopeDispose, reactive, Ref, ref, toRaw, toRef } from "vue";

const commonStore = useCommonStore()
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey, removeSuperKey } = keyboardStore;

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

export function formatGroupItem<T extends OksItem>(item: T) {
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
    base: { code, type },
    keyList,
    keyBaseList: item.keys.map(keyBase => {
      return keyBase;
    }),
    viewId
  };
}
export type GroupItem = {
  base: { code: number; type: KeyTypeEnum; name: string; key?: string };
  keyList: BaseKeyView[];
  keyBaseList: BaseKey[];
  viewId: string
};
export function useModuleLogic(groupList: Ref<any>, fncObj: {
  delFnc: (data: { code: number }) => Promise<never>,
  addFnc: <T>(data: T) => Promise<never>,
  getGroupFnc: <T = any>(data: BaseKey) => Promise<T>,
  renameFnc: (data: ReName) => Promise<never>
}, ops?: {
  CURRENT_MODULE_TYPE: KeyTypeEnum,
}) {
  const CURRENT_MODULE_TYPE = ops?.CURRENT_MODULE_TYPE || KeyTypeEnum.None;
  let editCtrl = reactive<{
    item: Omit<GroupItem, 'viewId'>;
    code: number;
    isEdit: boolean;
    show: boolean;
  }>({
    item: {
      base: { code: -1, type: KeyTypeEnum.None, name: '', key: '' },
      keyList: [],
      keyBaseList: [],
    },
    code: -1,
    isEdit: false,
    show: false
  });
  function generateGroupCode() {
    if (groupList.value.length === 0) return 0;
    return utilGenerateGroupCode(groupList.value)
  }
  async function groupItemDelete(item: any, idx: number) {
    let isPass = false
    try {
      const bak = JSON.parse(JSON.stringify(item))
      await fncObj.delFnc({ code: item.base.code });
      groupList.value.splice(idx, 1);
      bak.keyBaseList.forEach((listItem: any) => {
        removeSuperKey(listItem.key!, { moduleType: currentSuperKeyType.value });
        commonStore.getTargetKeyInfo(listItem.key!, true)
      });
      window.$message!.success($t('businessCommon.delSuccess'));
      isPass = true
    } catch (error) {
      window.$message!.error($t('businessCommon.delFailPlsUpdate'));
      console.error(error);
    }
  }
  async function groupCreated({ code, keys, name, listDetail }: any) {
    window?.$log!.debug('groupCreated', { code, keys, name, listDetail });
    let pass = false;
    let tmpCode = code;
    if (editCtrl.isEdit) {
      editCtrl.item.keyBaseList.forEach((listItem: any) => {
        removeSuperKey(listItem.key!, { moduleType: currentSuperKeyType.value });
      });
    }
    const sendData = { type: currentSuperKeyType.value, code: tmpCode, keys };
    try {
      await fncObj.addFnc(sendData);
      pass = true;
      window.$message!.success($t('businessCommon.executeSuccess'));
    } catch (e) {
      window.$message!.error($t('businessCommon.executeFail') + $t('businessCommon.plsUpdate'));
      window?.$log!.error(`catch error when oks group ${editCtrl.isEdit ? 'update' : 'create'}`, e);
    } finally {
      if (pass) {
        await updateTagetGroup(sendData, editCtrl.isEdit);
      }
    }
  }
  const renameCtrl = reactive({
    show: false,
    name: '',
    idx: -1,
  });
  async function groupRename(data: { name: string }) {
    if (data.name === '') return;
    try {
      await fncObj.renameFnc({ code: editCtrl.item.base.code, name: data.name });
      editCtrl.item.base.name = data.name;
      renameCtrl.show = false;
      groupList.value[renameCtrl.idx].base.name = data.name;
    } catch (error) {
      console.log('error', error);
    }
  }
  async function updateTagetGroup({ type, code }: any, isEdit: boolean) {
    const groupItem = await fncObj.getGroupFnc({ type, code });
    if (isEdit) {
      const idx = groupList.value.findIndex((item: { base: { code: number; }; }) => item.base.code === code)!;
      groupList.value[idx] = formatGroupItem(groupItem);
      return;
    }
    groupList.value.unshift(formatGroupItem(groupItem));
  }
  async function updateEditCache(items: any, idx: number) {
    editCtrl.item = items;
    renameCtrl.idx = idx;
    renameCtrl.show = true;
  }
  async function beforeEditModalOpen(items: any, idx: number) {
    editCtrl.item = JSON.parse(JSON.stringify(items));
    editCtrl.isEdit = true;
    editCtrl.show = true;
  }
  function resetKeyByEvent(key: string, groupList: GroupItem[], deleteCallback: (item: GroupItem, index: number) => void) {
    const itemIndex = groupList.findIndex(item =>
      item.keyBaseList.some(keyBase => keyBase.key === key)
    );

    if (itemIndex !== -1) {
      deleteCallback(groupList[itemIndex], itemIndex);
    }
  };
  function resetKeyCb(key: string) {
    if (!key || currentSuperKeyType.value !== CURRENT_MODULE_TYPE) {
      return;
    }
    resetKeyByEvent(key, groupList.value, groupItemDelete)
  }
  const scope = effectScope()
  scope.run(() => {
    emitter.on(EventNameEnum.resetKey, resetKeyCb);
  })
  onScopeDispose(() => {
    emitter.off(EventNameEnum.resetKey, resetKeyCb);
  })
  return {
    generateGroupCode,
    groupItemDelete,
    groupRename,
    updateTagetGroup,
    updateEditCache,
    groupCreated,
    beforeEditModalOpen,
    resetKeyByEvent,
    editCtrl,
    renameCtrl
  }
}
