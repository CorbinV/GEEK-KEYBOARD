import type { Ref } from 'vue';
import { effectScope, onScopeDispose, reactive, toRef, computed } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { useCommonStore } from '@/store/modules/common';
import { KeyTypeEnum } from '@/enum/keyType';
import { $t } from '@/locales';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import { formatGroupItem, utilGenerateGroupCode } from '../hooks';
import { STRATEGY_REGISTRY, ALL_STRATEGIES } from '../config';
import type { AddContext, GroupItem, ModuleState, CacheSuperKey } from '../types';

export function useSuperKeyDispatcher() {
  const keyboardStore = useKeyboardStore();
  const commonStore = useCommonStore();
  const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;

  // ---- 策略查找 ----
  const currentStrategy = computed(() =>
    STRATEGY_REGISTRY.get(currentSuperKeyType.value)
  );
  const allStrategies = computed(() => ALL_STRATEGIES);

  // ---- 统一状态 ----
  const moduleStateMap = reactive<Map<KeyTypeEnum, ModuleState>>(new Map());
  const currentModuleState = computed(() =>
    moduleStateMap.get(currentSuperKeyType.value)
  );

  // ---- 统一弹窗控制 ----
  const editCtrl = reactive({
    item: {
      base: { code: -1, type: KeyTypeEnum.None, name: '', key: '' },
      keyList: [],
      keyBaseList: [],
    } as Omit<GroupItem, 'viewId'>,
    code: -1,
    isEdit: false,
    show: false,
  });
  const renameCtrl = reactive({ show: false, idx: -1 });

  // ---- 统一 CRUD ----

  async function fetchGroupList(keyType: KeyTypeEnum) {
    const strategy = STRATEGY_REGISTRY.get(keyType);
    const state = moduleStateMap.get(keyType);
    if (!strategy || !state) return;

    state.loading = true;
    const res = await strategy.api.getList();
    const rawList = strategy.extractList(res) ?? [];

    state.groupList = rawList.map(item => {
      const formatted = formatGroupItem(
        Object.assign({}, item, {
          name: $t(strategy.defaultItemNameKey) || item.name,
        })
      );

      // SOCD/MT 保存原始列表供编辑时读取 trigger/time
      if (keyType === KeyTypeEnum.SOCD) {
        state.extra.socdRawList = res.socd;
      }
      if (keyType === KeyTypeEnum.MT) {
        state.extra.mtRawList = res.mt;
      }

      return formatted;
    });
    state.loading = false;
  }

  async function handleAddClicked() {
    const strategy = currentStrategy.value;
    const state = currentModuleState.value;
    if (!strategy || !state) return;

    // 默认校验：数量上限
    if (state.groupList.length >= strategy.maxGroupCount) {
      window.$message!.warning($t('supperKey.maxAddCombinKey', { total: strategy.maxGroupCount }));
      return;
    }

    // 默认校验：是否需要选中按键
    let targetSuperKey: CacheSuperKey | null = null;
    if (strategy.needSelectKey) {
      const selectedKeyIds = Object.keys(keyboardStore.selectedKeys);
      if (selectedKeyIds.length === 0) {
        window.$message!.info($t('supperKey.plsSelectKey'));
        return;
      }
      const keyId = selectedKeyIds[0];
      targetSuperKey = keyboardStore.activeKeyLayer.superKeyMap[keyId] ?? null;
    }

    // 策略钩子：beforeAdd
    if (strategy.beforeAdd) {
      const allowed = await strategy.beforeAdd({
        currentGroupCount: state.groupList.length,
        maxGroupCount: strategy.maxGroupCount,
        selectedKeyIds: Object.keys(keyboardStore.selectedKeys),
        superKeyMap: keyboardStore.activeKeyLayer.superKeyMap,
        targetSuperKey,
      });
      if (!allowed) return;
    }

    // 初始化编辑项
    editCtrl.item = {
      base: { code: -1, type: KeyTypeEnum.None, name: '', key: '' },
      keyList: strategy.needSelectKey
        ? [Object.values(keyboardStore.selectedKeys)[0]?.detail].filter(Boolean)
        : [],
      keyBaseList: strategy.needSelectKey
        ? [Object.values(keyboardStore.selectedKeys)[0]?.base].filter(Boolean)
        : [],
    };
    editCtrl.isEdit = false;
    editCtrl.show = true;

    // 重置模式特有状态
    if (currentSuperKeyType.value === KeyTypeEnum.MT) {
      state.extra.inputTime = 200;
    }
  }

  async function handleGroupCreated(formData: any) {
    const strategy = currentStrategy.value;
    const state = currentModuleState.value;
    if (!strategy || !state) return;

    // 编辑模式下，先清除旧按键的 superKey 绑定
    if (editCtrl.isEdit) {
      editCtrl.item.keyBaseList.forEach((listItem: any) => {
        keyboardStore.removeSuperKey(listItem.key!, {
          moduleType: currentSuperKeyType.value,
        });
      });
    }

    // 数据增强
    let payload = {
      type: currentSuperKeyType.value,
      code: editCtrl.isEdit ? editCtrl.item.base.code : formData.code,
      name: formData.name,
      keys: formData.keys,
    };
    if (strategy.enhanceCreateData) {
      payload = strategy.enhanceCreateData(payload, state.extra);
    }

    // SOCD: 附加 trigger 字段
    if (currentSuperKeyType.value === KeyTypeEnum.SOCD) {
      (payload as any).trigger = state.extra.trigger;
    }

    let pass = false;
    try {
      await strategy.api.addTarget(payload);
      pass = true;
      window.$message!.success($t('businessCommon.executeSuccess'));
    } catch (e) {
      window.$message!.error($t('businessCommon.executeFail') + $t('businessCommon.plsUpdate'));
    } finally {
      if (pass) {
        await updateTargetGroup(payload, editCtrl.isEdit);
      }
    }

    editCtrl.show = false;
  }

  async function handleGroupItemDelete(item: GroupItem, idx: number) {
    const strategy = currentStrategy.value;
    const state = currentModuleState.value;
    if (!strategy || !state) return;

    try {
      const bak = JSON.parse(JSON.stringify(item));
      await strategy.api.deleteByCode({ code: item.base.code });
      state.groupList.splice(idx, 1);

      bak.keyBaseList.forEach((listItem: any) => {
        keyboardStore.removeSuperKey(listItem.key!, {
          moduleType: currentSuperKeyType.value,
        });
        commonStore.getTargetKeyInfo(listItem.key!, true);
      });

      window.$message!.success($t('businessCommon.delSuccess'));
    } catch (error) {
      window.$message!.error($t('businessCommon.delFailPlsUpdate'));
    }
  }

  function handleGroupItemEdit(item: GroupItem, idx: number) {
    if (!currentStrategy.value?.enableEdit) return;

    editCtrl.item = JSON.parse(JSON.stringify(item));
    editCtrl.isEdit = true;
    editCtrl.show = true;

    // 模式特有状态回填
    const state = currentModuleState.value!;
    if (currentSuperKeyType.value === KeyTypeEnum.SOCD) {
      state.extra.trigger = state.extra.socdRawList[idx]?.trigger ?? 0;
    }
    if (currentSuperKeyType.value === KeyTypeEnum.MT) {
      state.extra.inputTime = state.extra.mtRawList[idx]?.time ?? 200;
    }
  }

  function handleGroupItemRename(item: GroupItem, idx: number) {
    editCtrl.item = item;
    renameCtrl.idx = idx;
    renameCtrl.show = true;
  }

  async function handleGroupRename(name: string) {
    const strategy = currentStrategy.value;
    const state = currentModuleState.value;
    if (!strategy || !state || name === '') return;

    try {
      await strategy.api.rename({ code: editCtrl.item.base.code, name });
      editCtrl.item.base.name = name;
      renameCtrl.show = false;
      state.groupList[renameCtrl.idx].base.name = name;
    } catch (error) {
      console.error(error);
    }
  }

  // ---- 内部方法 ----

  async function updateTargetGroup({ type, code }: any, isEdit: boolean) {
    const strategy = currentStrategy.value;
    const state = currentModuleState.value;
    if (!strategy || !state) return;

    const groupItem = await strategy.api.getTarget({ type, code });
    const formatted = formatGroupItem(groupItem);

    if (isEdit) {
      const idx = state.groupList.findIndex(item => item.base.code === code);
      if (idx !== -1) state.groupList[idx] = formatted;
    } else {
      state.groupList.unshift(formatted);
    }
  }

  function generateGroupCode() {
    const state = currentModuleState.value;
    if (!state || state.groupList.length === 0) return 0;
    return utilGenerateGroupCode(state.groupList);
  }

  // ---- EventBus：按键重置 ----

  function resetKeyCb(key: string) {
    if (!key) return;
    const state = moduleStateMap.get(currentSuperKeyType.value);
    if (!state) return;

    const itemIndex = state.groupList.findIndex(item =>
      item.keyBaseList.some(keyBase => keyBase.key === key)
    );
    if (itemIndex !== -1) {
      handleGroupItemDelete(state.groupList[itemIndex], itemIndex);
    }
  }

  const scope = effectScope();
  scope.run(() => {
    emitter.on(EventNameEnum.resetKey, resetKeyCb);
  });
  onScopeDispose(() => {
    emitter.off(EventNameEnum.resetKey, resetKeyCb);
  });

  // ---- 初始化 ----

  async function initAll() {
    for (const [keyType, strategy] of STRATEGY_REGISTRY) {
      const extra = strategy.createExtraState?.() ?? {};
      moduleStateMap.set(keyType, { groupList: [], loading: false, extra });
    }
    await Promise.all(
      Array.from(STRATEGY_REGISTRY.keys()).map(keyType => fetchGroupList(keyType))
    );
  }

  return {
    allStrategies,
    currentStrategy,
    currentModuleState,
    editCtrl,
    renameCtrl,
    handleAddClicked,
    handleGroupCreated,
    handleGroupItemDelete,
    handleGroupItemEdit,
    handleGroupItemRename,
    handleGroupRename,
    generateGroupCode,
    initAll,
  };
}