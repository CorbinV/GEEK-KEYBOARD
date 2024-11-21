<script setup lang="ts">
import type { TabsProps } from 'naive-ui';
import { nextTick, reactive, toRefs, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import BaseKey from '@/components/custom/keyboard/components/base-key.vue';
import { createComboGroup } from '@/api/combo';
import { StandardKeyboard } from '@/components/custom/keyboard';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import ModuleTemplate from './module-template.vue';
const emit = defineEmits(['update:visible', 'create-group']);

const keyboardStore = useKeyboardStore();
const { kbCfg } = toRefs(keyboardStore);
const props = defineProps<{
  groupLength: number;
  visible: boolean;
}>();

type TabsPropsThemeOverrides = NonNullable<TabsProps['themeOverrides']>;
const tabsThemeOverrides: TabsPropsThemeOverrides = {};

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

// event handler
const [selectedKeyInfo, resetSelectedKeyInfo] = useResttableRefFn<any>(() => ({
  idx: 0,
  list: [{}]
}));
function handleKeyClicked(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-idx]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const idx = targetElement.dataset.idx;
    selectedKeyInfo.value.idx = Number(idx);
    if (!selectedKeyInfo.value.list[selectedKeyInfo.value.idx]) {
      selectedKeyInfo.value.list[selectedKeyInfo.value.idx] = {
        base: {},
        detail: []
      };
    }
  }
}
function handleFncClicked({ code, type }: { code: number; type: KeyTypeEnum }) {
  const codeMap = kbCfg.value.keyMap[type].code;
  const data = codeMap[`${code}`];
  selectedKeyInfo.value.list[selectedKeyInfo.value.idx].base = { code, type };
  selectedKeyInfo.value.list[selectedKeyInfo.value.idx].detail = data;
}
async function handleDialogComfirm() {
  const sendData = {
    type: KeyTypeEnum.Combo,
    code: props.groupLength + 1,
    keys: selectedKeyInfo.value.list.map((item: any) => item.base)
  };
  try {
    await createComboGroup(sendData);
    emit('create-group', {
      ...sendData,
      detail: JSON.parse(JSON.stringify(selectedKeyInfo.value))
    });
    window.$message!.success('创建成功');
    nextTick(() => {
      resetSelectedKeyInfo();
      closeDialog();
    });
  } catch (error) {
    window.$message!.error('创建失败');
    console.error(error);
  }
}
</script>

<template>
  <NModal
    v-model:show="dialogControl.visible"
    preset="card"
    :closable="false"
    :title="undefined"
    class="w-90% !h-80vh !bg-#191b1d"
    content-class="bg-#191b1d"
    size="large"
  >
    <template #header>
      <div class="text-center text-xl">组合按键 {{ groupLength }}</div>
    </template>
    <template #default>
      <div class="flex flex-col">
        <NDivider class="!mt-0" />

        <div class="flex flex-col gap-y-5">
          <p class="text-center text-base text-c-second">请选择多个按键进行组合</p>
          <div class="flex flex-row justify-center gap-x-12" @click="handleKeyClicked">
            <div
              v-for="(_, idx) in new Array(4)"
              :key="`d-groups-${idx}`"
              class="flex flex-col gap-y-2"
              :data-idx="idx"
            >
              <BaseKey
                :base="selectedKeyInfo.list?.[idx]?.base"
                :detail="selectedKeyInfo.list?.[idx]?.detail"
                :selected="selectedKeyInfo.idx === idx"
              ></BaseKey>
              <div class="text-center text-c-second">{{ idx }}</div>
            </div>
          </div>
        </div>
        <!-- tabs -->
        <div>
          <NTabs :theme-overrides="tabsThemeOverrides" tab-class="asdasf !text-xl">
            <NTabPane name="Keyboard" tab="基础">
              <StandardKeyboard @key-clicked="handleFncClicked" />
            </NTabPane>
            <NTabPane name="System" tab="系统">
              <ModuleTemplate :type="KeyTypeEnum.System" @key-clicked="handleFncClicked" />
            </NTabPane>
            <NTabPane name="Media" tab="媒体">
              <ModuleTemplate :type="KeyTypeEnum.Media" @key-clicked="handleFncClicked" />
            </NTabPane>
          </NTabs>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex items-center justify-center gap-x-8">
        <NButton class="h-4rem w-12rem text-base" type="primary" ghost @click="closeDialog">取消</NButton>
        <NButton class="h-4rem w-12rem text-lg text-white" type="primary" @click="handleDialogComfirm">确定</NButton>
      </div>
    </template>
  </NModal>
</template>
