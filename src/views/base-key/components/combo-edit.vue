<script setup lang="ts">
import type { TabsProps } from 'naive-ui';
import { nextTick, reactive, ref, toRefs, watch, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import BaseKey from '@/components/custom/keyboard/components/base-key.vue';
import { StandardKeyboard } from '@/components/custom/keyboard';
import { useResttableReactiveFn } from '@/hooks/common/basicFnc';
import type { BaseKey as BaseKeyType } from '@/api/modules/combo';
import ModuleTemplate from './module-template.vue';
const emit = defineEmits(['update:visible', 'create-group']);

const keyboardStore = useKeyboardStore();
const props = defineProps<{
  groupLength: number;
  visible: boolean;
  editItem?: {
    idx: number;
    list: {
      base: BaseKeyType;
      detail: any;
    }[];
  };
  fncGenerateCode: () => number;
}>();
const bindKeyId = ref('');
const [selectedKeyInfo, resetSelectedKeyInfo] = useResttableReactiveFn<{
  idx: number;
  list: {
    base: BaseKeyType;
    detail: any;
  }[];
}>(() => ({
  idx: 0,
  list: []
}));
type TabsPropsThemeOverrides = NonNullable<TabsProps['themeOverrides']>;
const tabsThemeOverrides: TabsPropsThemeOverrides = {};

function useDialogController() {
  const control = reactive({
    visible: true
  });

  watchEffect(() => {
    control.visible = props.visible;
    if (props.visible) {
      if (props.editItem) {
        const { idx, list } = props.editItem;
        selectedKeyInfo.idx = idx;
        selectedKeyInfo.list = list;
      }
    }
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

function handleKeyClicked(e: MouseEvent) {
  const targetElement = (e.target as Element).closest('[data-idx]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const idx = targetElement.dataset.idx;
    selectedKeyInfo.idx = Number(idx);
    if (!selectedKeyInfo.list[selectedKeyInfo.idx]) {
      selectedKeyInfo.list[selectedKeyInfo.idx] = {
        base: {} as any,
        detail: []
      };
    }
  }
}
function handleFncClicked({ code, type, keyId }: { code: number; type: KeyTypeEnum; keyId: string }) {
  const selectedData = {
    base: { code, type, key: keyId },
    detail: keyboardStore.getKeyDetail({ code, type })
  };
  selectedKeyInfo.list[selectedKeyInfo.idx] = selectedData;
}
async function handleDialogComfirm() {
  if (selectedKeyInfo.list.length < 2) {
    window.$message!.info('请选择2-4个按键');
    return;
  }
  const cpy = JSON.parse(JSON.stringify(selectedKeyInfo));
  const sendData = {
    type: KeyTypeEnum.Combo,
    code: props.fncGenerateCode(),
    key: bindKeyId.value,
    keys: cpy.list.map((item: any) => item.base)
  };
  emit('create-group', {
    ...sendData,
    listDetail: cpy
  });
  nextTick(() => {
    resetSelectedKeyInfo();
    closeDialog();
  });
}
const { selectedKeys } = toRefs(keyboardStore);

watch(
  () => Object.keys(selectedKeys.value).length,
  (nLength, oLength) => {
    // perf: reduce the number of times of watchEffect
    if (nLength === 1 && oLength === 0) {
      const keys = Object.keys(selectedKeys.value);
      if (keys?.[0]) {
        bindKeyId.value = keys[0];
      }
    }
  }
);
</script>

<template>
  <NModal
    v-model:show="dialogControl.visible"
    preset="card"
    :closable="false"
    :title="undefined"
    class="w-90% !h-86vh !bg-#191b1d"
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
          <p class="text-center text-base text-c-second">{{ $t('baseKey.combination.plsSelctKeyComb') }}</p>
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
            <NTabPane name="Keyboard" :tab="$t('baseKey.tab.basic')">
              <StandardKeyboard @key-clicked="handleFncClicked" />
            </NTabPane>
            <NTabPane name="System" :tab="$t('baseKey.tab.system')">
              <ModuleTemplate :type="KeyTypeEnum.System" @key-clicked="handleFncClicked" />
            </NTabPane>
            <NTabPane name="Media" :tab="$t('baseKey.tab.media')">
              <ModuleTemplate :type="KeyTypeEnum.Media" @key-clicked="handleFncClicked" />
            </NTabPane>
          </NTabs>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex items-center justify-center gap-x-8">
        <NButton class="h-4rem w-12rem text-base" type="primary" ghost @click="closeDialog">
          {{ $t('businessCommon.cancel') }}
        </NButton>
        <NButton class="h-4rem w-12rem text-lg text-white" type="primary" @click="handleDialogComfirm">
          {{ $t('businessCommon.confirm1') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>
