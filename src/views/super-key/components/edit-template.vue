<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, toRefs, watch, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import BaseKey from '@/components/custom/keyboard/components/base-key.vue';
import { BaseKeyboard } from '@/components/custom/keyboard';
import { useResttableReactiveFn } from '@/hooks/common/basicFnc';
import type { BaseKey as BaseKeyType } from '@/api/modules/combo';
const emit = defineEmits(['update:visible', 'update:title', 'create-group']);

const keyboardStore = useKeyboardStore();
const { selectedKeys } = toRefs(keyboardStore);
const getKeyDetail = keyboardStore.getKeyDetail;
const props = defineProps<{
  visible: boolean;
  fncGenerateCode: () => number;
  codeType: KeyTypeEnum;
  desc?: string;
  title?: string;
  secondTitle?: string;
}>();

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
const [selectedKeyInfo, resetSelectedKeyInfo] = useResttableReactiveFn<{
  idx: number;
  list: {
    base: BaseKeyType;
    detail: any;
  }[];
}>(() => ({
  idx: 1,
  list: []
}));

onMounted(() => {
  watch(
    () => Object.keys(selectedKeys.value).length,
    (nLength, oLength) => {
      // perf: reduce the number of times of watchEffect
      if (nLength === 1 && oLength === 0) {
        const keys = Object.keys(selectedKeys.value);
        if (keys?.[0]) {
          selectedKeyInfo.list = [selectedKeys.value[keys[0]]];
        }
      }
    }
  );
});
const [localTitle] = useTitle();

function handleFncClicked({ code, type }: { code: number; type: KeyTypeEnum }) {
  if (code === undefined || type === undefined) {
    window.$message!.info('设备未返回，此按键无效');
    return;
  }
  if (type !== KeyTypeEnum.Normal) {
    window.$message!.info('当前按键类型不支持');
    return;
  }
  selectedKeyInfo.list[1] = {
    base: { code, type },
    detail: getKeyDetail({ code, type })
  };
}
async function handleDialogComfirm() {
  const sendData = {
    type: props.codeType,
    code: props.fncGenerateCode(),
    name: localTitle.value,
    keys: selectedKeyInfo.list.map((item: any) => item.base)
  };
  try {
    emit('create-group', {
      ...sendData,
      listDetail: JSON.parse(JSON.stringify(selectedKeyInfo.list))
    });
    nextTick(() => {
      resetSelectedKeyInfo();
      closeDialog();
      keyboardStore.resetSelectedKeys();
    });
  } catch (error) {
    window.$message!.error('创建失败');
    console.error(error);
  }
}
function handleKeyClickedx(data: { type: KeyTypeEnum; code: number }) {
  handleFncClicked(data);
}
function useTitle() {
  const title = ref<string>('');
  watchEffect(() => {
    title.value = props.title || '';
  });
  return [title];
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
    class="h-80vh w-60% !bg-#191b1d"
    content-class="bg-#191b1d"
    size="large"
  >
    <template #header>
      <div class="flex flex-row justify-between text-xl">
        <div></div>
        <span>{{ localTitle }}</span>
        <div>
          <slot name="header-extra"></slot>
        </div>
      </div>
    </template>
    <template #default>
      <div class="h-full w-full flex flex-col">
        <NDivider class="!mt-0" />

        <div class="flex flex-col gap-y-6">
          <h2 v-if="secondTitle" class="text-wihte text-center text-lg">{{ secondTitle }}</h2>
          <p class="text-center text-base text-c-second">{{ desc }}</p>
          <div class="flex flex-row justify-center gap-x-12">
            <div v-for="(_, idx) in new Array(2)" :key="`d-groups-${idx}`" class="flex flex-col gap-y-4">
              <BaseKey
                :base="selectedKeyInfo.list?.[idx]?.base"
                :detail="selectedKeyInfo.list?.[idx]?.detail"
                :selected="1 === idx"
              ></BaseKey>
              <div class="text-center text-c-second">{{ idx }}</div>
            </div>
          </div>
          <slot name="extra"></slot>
        </div>
        <div class="flex flex-1 items-center justify-between">
          <div class="flex-1"></div>
          <BaseKeyboard as="component" @update:key-id="handleKeyClickedx" />
          <div class="flex-1"></div>
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
