<script setup lang="ts">
import type { TabsProps } from 'naive-ui';
import { computed, nextTick, reactive, ref, toRefs, watch, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import BaseKeyWrapper from '@/components/custom/keyboard/components/base-key-wrapper.vue';
import { StandardKeyboard } from '@/components/custom/keyboard';
import { useResttableReactiveFn } from '@/hooks/common/basicFnc';
import type { BaseKey as BaseKeyType } from '@/api/modules/combo';
import useLoading from '@/utils/loading';
import ModuleTemplate from './module-template.vue';
const emit = defineEmits(['update:visible', 'create-group']);
const { isLoading, lazyLoading } = useLoading();
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
  lazyLoading();
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
const MAX_KEY_COUNT = 4;
function handleFncClicked({ code, type, keyId }: { code: number; type: KeyTypeEnum; keyId: string }) {
  const selectedData = {
    base: { code, type, key: keyId },
    detail: keyboardStore.getKeyDetail({ code, type })
  };
  if (type === KeyTypeEnum.Media) {
    const mediaFncList = selectedKeyInfo.list.filter(({ base }) => base.type === KeyTypeEnum.Media)
    if (mediaFncList.length > 1) {
      window?.$message!.info(`媒体功能最大支持2个键位`, {
        duration: 5000
      })  // expact i18n
      return
    }
  }
  selectedKeyInfo.list[selectedKeyInfo.idx] = selectedData;
  if (selectedKeyInfo.idx < MAX_KEY_COUNT - 1) {
    selectedKeyInfo.idx += 1;
  } else {
    selectedKeyInfo.idx = 0
  }
}
async function handleDialogComfirm() {
  if (selectedKeyInfo.list.length < 1) {
    window.$message!.info('请选择1-4个按键');
    return;
  }
  const cpy = JSON.parse(JSON.stringify(selectedKeyInfo));
  const sendData = {
    type: KeyTypeEnum.Combo,
    code: props.fncGenerateCode(),
    key: bindKeyId.value,
    keys: cpy.list.filter((item: any) => item !== null).map((item: any) => item.base)
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
function handleSelecteKeyRemove(idx: number) {
  selectedKeyInfo.list[idx] = {
    base: {} as any,
    detail: {}
  };
  if (idx < 0) {
    return
  }
  let index = -1;
  for (let i = selectedKeyInfo.list.length - 1; i >= 0; i--) {
    const hasValue = selectedKeyInfo.list[i]?.base?.key;
    if (hasValue && i < idx) {
      index = i;
      break;
    }
  }
  if (index === -1) {
    selectedKeyInfo.idx = 0;
    return
  }
  selectedKeyInfo.idx = index;
}
const paneList = [
  {
    component: StandardKeyboard,
    name: 'Keyboard',
    type: undefined,
    title: 'baseKey.tab.basic',
    fnc: handleFncClicked
  }, {
    component: ModuleTemplate,
    name: 'System',
    type: KeyTypeEnum.System,
    title: 'baseKey.tab.system',
    fnc: handleFncClicked
  },
  {
    component: ModuleTemplate,
    name: 'Media',
    type: KeyTypeEnum.Media,
    title: 'baseKey.tab.media',
    fnc: handleFncClicked
  }
]

const tabName = ref(paneList[0].name);
const currentContent = computed(() => {
  const res = paneList.find(item => item.name === tabName.value)!;
  return res;
});
const handleKeyEventTabs = (value: string | number) => {
  tabName.value = value as string;
};
</script>

<template>
  <NModal v-model:show="dialogControl.visible" preset="card" :closable="false" :title="undefined"
    class="w-90% !bg-#191b1d" content-class="bg-#191b1d" size="large">
    <template #header>
      <div class="text-center text-xl">组合按键 {{ groupLength }}</div>
    </template>
    <template #default>
      <div class="flex flex-col">
        <NSpin :show="isLoading">
          <NDivider class="!mt-0" />
          <div class="flex flex-col gap-y-5">
            <p class="text-center text-base text-c-second">{{ $t('baseKey.combination.plsSelctKeyComb') }}</p>
            <div class="flex flex-row justify-center gap-x-12" @click="handleKeyClicked">
              <div v-for="(_, idx) in new Array(MAX_KEY_COUNT)" :key="`d-groups-${idx}`" class="flex flex-col gap-y-2"
                :data-idx="idx">
                <BaseKeyWrapper :base="selectedKeyInfo.list?.[idx]?.base" :detail="selectedKeyInfo.list?.[idx]?.detail"
                  :selected="selectedKeyInfo.idx === idx" :allow-clear="true" :idx="idx"
                  @remove="handleSelecteKeyRemove"></BaseKeyWrapper>
                <div class="text-center text-c-second">{{ idx + 1 }}</div>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-y-2 mt-2">
            <NTabs :theme-overrides="tabsThemeOverrides" type="segment" class="custom-segment-tabs-1" @active-name-change="handleKeyEventTabs"
              style="width: 50%; margin: 0 auto">
              <NTab v-for="item in paneList" :key="item.name" :name="item.name">
                <span :class="`${tabName == item.name ? 'text-#3C8DF4' : 'text-#999999'} text-lg`">
                  {{ $t(item.title) }}
                </span>
              </NTab>
            </NTabs>
            <KeepAlive>
              <div class="flex-1">
                <component :is="currentContent.component" :type="currentContent.type" @key-clicked="handleFncClicked">
                </component>
              </div>
            </KeepAlive>
          </div>
        </NSpin>
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
<style scoped>
.custom-segment-tabs-1 {
  &.n-tabs {
    --n-color-segment: #222226 !important;
  }
  :deep(.n-tabs-tab) {
    margin: 3px 12px
  }
}
</style>
