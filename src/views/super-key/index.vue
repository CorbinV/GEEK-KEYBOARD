<script setup lang="ts">
import type { Ref } from 'vue';
import { onUnmounted, toRef } from 'vue';
import { KeyboardContainer } from '@/components/custom/keyboard/index';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import Dks from './modules/dks.vue';
import Oks from './modules/oks.vue';
import Socd from './modules/socd.vue';
import MT from './modules/mt.vue';
import TGL from './modules/tgl.vue';
import Rs from './modules/rs.vue';
const keyboardStore = useKeyboardStore();
const allowMutipleSelect = toRef(keyboardStore, 'allowMutipleSelect');
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;

allowMutipleSelect.value = false;
currentSuperKeyType.value = KeyTypeEnum.DKS;

const {
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
} = useSuperKeyDispatcher();

const editTitle = computed(() => currentStrategy.value?.label ?? '');
const editDesc = computed(() => currentStrategy.value?.defaultItemName ?? '');

function handleItemClick(item: any, handleKeyEmit: (item: any) => void) {
  handleKeyEmit(item);
}

function handleRename(payload: { name: string }) {
  handleGroupRename(payload.name);
}

onMounted(() => initAll());
onUnmounted(() => keyboardStore.resetCurrentSuperKeyType());

const paneList = [
  {
    name: KeyTypeEnum.DKS,
    label: 'supperKey.c1',
    component: Dks
  },
  {
    name: KeyTypeEnum.OKS,
    label: 'supperKey.c2',
    component: Oks
  },
  {
    name: KeyTypeEnum.SOCD,
    label: 'supperKey.c9',
    component: Socd
  },
  {
    name: KeyTypeEnum.MT,
    label: 'supperKey.c3',
    component: MT
  },
  {
    name: KeyTypeEnum.TGL,
    label: 'supperKey.c4',
    component: TGL
  },
  {
    name: KeyTypeEnum.RS,
    label: 'supperKey.c5',
    component: Rs
  }
];
</script>

<template>
  <div>
    <KeyboardContainer>
    <template #keyboardBottom></template>
    <template #default="{ handleKeyEmit }">
      <div class="h-full flex flex-col">
        <div class="flex-1 bg-#171619 rounded-md mb-2">
          <ModuleContent
            :strategy="currentStrategy"
            :group-list="currentModuleState?.groupList ?? []"
            @add-clicked="handleAddClicked"
            @item-clicked="(item) => handleItemClick(item, handleKeyEmit)"
            @item-delete="handleGroupItemDelete"
            @item-edit="handleGroupItemEdit"
            @item-rename="handleGroupItemRename"
          />
        </div>

        <NTabs v-model:value="currentSuperKeyType" class="custom-segment-tabs" type="segment" animated>
          <NTab v-for="s in allStrategies" :key="s.keyType" :name="s.keyType" class="text-xl text-#3C8DF4">
            <span :class="currentSuperKeyType === s.keyType ? 'text-#3C8DF4' : 'text-#999999'" class="text-lg">
              {{ $t(s.labelKey) }}
            </span>
          </NTab>
        </NTabs>
      </div>
    </template>
  </KeyboardContainer>

  <!-- 单例编辑弹窗：策略指定编辑器（如 DksEdit） -->
  <component
    v-if="currentStrategy?.editComponent && editCtrl.show"
    :is="currentStrategy.editComponent"
    v-bind="currentStrategy.getEditProps?.(currentModuleState!) ?? {}"
    :visible="editCtrl.show"
    :title="editTitle"
    :code-type="currentStrategy.keyType"
    :fnc-generate-code="generateGroupCode"
    :is-edit="editCtrl.isEdit"
    :edit-item="editCtrl.item"
    @update:visible="editCtrl.show = $event"
    @create-group="handleGroupCreated"
  />

  <!-- 单例编辑弹窗：通用 EditTemplate -->
  <EditTemplate
    v-else-if="editCtrl.show && currentStrategy"
    v-model:visible="editCtrl.show"
    v-model:title="editTitle"
    :code-type="currentStrategy.keyType"
    :fnc-generate-code="generateGroupCode"
    :need-import-key="currentStrategy.needSelectKey"
    :keyboard-type="currentStrategy.keyboardType"
    :wide="currentStrategy.wide"
    :max-len="currentStrategy.maxKeyCount"
    :is-edit="editCtrl.isEdit"
    :edit-item="editCtrl.item"
    :desc="editDesc"
    @create-group="handleGroupCreated"
  >
    <template #header-extra>
      <component v-if="currentStrategy?.headerExtraComponent" :is="currentStrategy.headerExtraComponent" v-model="currentModuleState!.extra[currentStrategy.headerExtraModelKey]" />
    </template>
    <template #extra>
      <component v-if="currentStrategy?.extraComponent" :is="currentStrategy.extraComponent" v-model="currentModuleState!.extra[currentStrategy.extraComponentModelKey]" />
    </template>
  </EditTemplate>

  <!-- 单例重命名弹窗 -->
  <RenameModal
    :show="renameCtrl.show"
    :list-edit-index="renameCtrl.idx"
    :name="editCtrl.item.base.name"
    @update:show="renameCtrl.show = $event"
    @rename="handleRename"
  />
  </div>
</template>

<style scoped>
.custom-segment-tabs {
  :deep(.n-tabs-tab) {
    margin: 3px 12px
  }
}
</style>
