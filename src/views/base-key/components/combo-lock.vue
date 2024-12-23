<script setup lang="ts">
import { reactive, toRaw, watchEffect } from 'vue';
import type { KeyTypeEnum } from '@/enum/keyType';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { StandardKeyboard } from '@/components/custom/keyboard';
import { ModuleNameEnum, useComboLock } from './combo-lock/hooks';
import KeyGroupList from './combo-lock/key-group-list.vue';
const props = defineProps<{
  visible: boolean;
}>();
const emit = defineEmits(['update:visible']);

const keyboardStore = useKeyboardStore();
function useDialogController() {
  const control = reactive({
    visible: true
  });

  watchEffect(() => {
    control.visible = props.visible;
  });
  return {
    dialogControl: control,
    openDialog: () => {
      control.visible = true;
    },
    closeDialog: () => {
      control.visible = false;
      emit('update:visible', false);
    }
  };
}
const { dialogControl, closeDialog } = useDialogController();
const { defaultGroups, customGroups, selectedKeyIndex, updateKeySelect, moduleName, setComboLockToDevice } =
  useComboLock();
function handleFncClicked({ code, type, keyId }: { code: number; type: KeyTypeEnum; keyId: string }) {
  const { groupIndex, keyIndex } = toRaw(selectedKeyIndex.value);
  if ([groupIndex, keyIndex].includes(-1)) {
    return;
  }
  const selectedData = {
    base: { code, type, key: keyId },
    detail: keyboardStore.getKeyDetail({ code, type })
  };
  if (moduleName.value === ModuleNameEnum.default) {
    defaultGroups.value[groupIndex].keys[keyIndex] = selectedData;
    return;
  }
  customGroups.value[groupIndex].keys[keyIndex] = selectedData;
}
function handleGroupEnableChange(enable: CommonType.NumberBoolean, groupIdx: number) {
  if (moduleName.value === ModuleNameEnum.default) {
    defaultGroups.value[groupIdx].enable = enable;
    return;
  }
  customGroups.value[groupIdx].enable = enable;
}

async function handleDialogComfirm() {
  const x1 = toRaw(defaultGroups.value).map(item => {
    return {
      keys: item.keys.map(keyItem => {
        return keyItem.base.code;
      }),
      enable: item.enable
    };
  });
  const x2 = toRaw(customGroups.value).map(item => {
    return {
      keys: item.keys.map(keyItem => {
        return keyItem.base.code;
      }),
      enable: item.enable
    };
  });
  try {
    await setComboLockToDevice({
      defaultLock: x1,
      customLock: x2
    });
    closeDialog();
  } catch (error) {
    console.log(error);
    window.$message?.error(`Update lock shortcuts fail`);
  }
}
</script>

<template>
  <NModal
    v-model:show="dialogControl.visible"
    preset="card"
    :closable="false"
    :title="undefined"
    :close-on-esc="false"
    :mask-closable="false"
    class="w-90% !h-86vh !bg-#191b1d"
    content-class="bg-#191b1d"
    size="large"
  >
    <template #header>
      <div class="text-center text-xl">锁组合按键设置</div>
    </template>
    <template #default>
      <div class="h-full flex flex-col">
        <NDivider class="!mt-0" />
        <NTabs
          v-model:value="moduleName"
          type="line"
          animated
          justify-content="space-evenly"
          class="max-content-tab flex-1 -mt-4"
        >
          <NTabPane :name="ModuleNameEnum.default">
            <template #tab>
              <span class="text-xl">默认锁定组合键</span>
              <span class="text-base">（固定不可修改）</span>
            </template>
            <div class="h-full w-full flex items-center justify-center py-4">
              <KeyGroupList
                class="h-full w-full"
                :groups="defaultGroups"
                :selected-key-index="selectedKeyIndex"
                :disable-change-key="true"
                @select-key-change="updateKeySelect"
                @enable-change="handleGroupEnableChange"
              />
            </div>
          </NTabPane>
          <NTabPane :name="ModuleNameEnum.custom">
            <template #tab>
              <span class="text-xl">自定义锁定组合按键</span>
              <span class="text-base">（可设置单个或多个）</span>
            </template>
            <div class="h-full w-full flex items-center justify-center py-4">
              <KeyGroupList
                class="h-full w-full"
                :groups="customGroups"
                :selected-key-index="selectedKeyIndex"
                @select-key-change="updateKeySelect"
                @enable-change="handleGroupEnableChange"
              />
            </div>
          </NTabPane>
        </NTabs>
        <div>
          <StandardKeyboard @key-clicked="handleFncClicked" />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex items-center justify-center gap-x-8 xl:gap-x-14">
        <NButton class="h-3rem w-8rem text-base" type="primary" ghost @click="closeDialog">
          {{ $t('businessCommon.cancel') }}
        </NButton>
        <NButton class="h-3rem w-8rem text-lg text-white" type="primary" @click="handleDialogComfirm">
          {{ $t('businessCommon.confirm1') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style lang="scss" scoped>
.max-content-tab {
  :deep(.n-tabs-pane-wrapper) {
    flex: 1;

    .n-tab-pane {
      height: 100%;
    }
  }
}
</style>
