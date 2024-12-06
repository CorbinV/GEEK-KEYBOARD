<script setup lang="ts">
import type { Ref } from 'vue';
import { nextTick, onMounted, reactive, ref, toRef, toRefs, watch, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { StandardKeyboard } from '@/components/custom/keyboard';
import { useResttableReactiveFn } from '@/hooks/common/basicFnc';
import type { BaseKey as BaseKeyType } from '@/api/modules/combo';
import type { CapsuleItem } from '@/store/modules/dks';
import { useDksStore } from '@/store/modules/dks';
import DksKeyControl from './dks-key-control.vue';
import KeyDistanceControl from './key-distance-control.vue';
const emit = defineEmits(['update:visible', 'update:title', 'create-group']);
const dksStore = useDksStore();
const keyboardStore = useKeyboardStore();
const getKeyDetail = keyboardStore.getKeyDetail;
const props = withDefaults(
  defineProps<{
    visible: boolean;
    fncGenerateCode: () => number;
    codeType: KeyTypeEnum;
    title: string;
    desc?: string;
    secondTitle?: string;
    keyboardType?: 'base' | 'standard';
    needImportKey?: boolean;
  }>(),
  {
    keyboardType: 'base',
    secondTitle: ''
  }
);
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
    detail: typeof getKeyDetail;
  }[];
}>(() => ({
  idx: props.needImportKey ? 1 : 0,
  list: []
}));
const keyDistanceControlRef = ref<typeof KeyDistanceControl>();
onMounted(() => {
  if (props.needImportKey) {
    const { selectedKeys } = toRefs(keyboardStore);

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
  }
});
const [localTitle] = useTitle();
function useDragControlData() {
  const dksGroupList: Ref<CapsuleItem[][]> = toRef(dksStore, 'dksGroupList');
  const formatKeyRange = (idx: number) => {
    const res: number[] = [];
    dksGroupList.value[idx].forEach((info, iIdx) => {
      if (info.isAboveMask) {
        res.push(iIdx, info.to);
      }
    });
    return res;
  };
  return {
    dksGroupList,
    formatKeyRange
  };
}
const { dksGroupList, formatKeyRange } = useDragControlData();
function handleFncClicked({ code, type, keyId }: { code: number; type: KeyTypeEnum; keyId: string }) {
  if (code === undefined || type === undefined) {
    window.$message!.info('设备未返回，此按键无效');
    return;
  }
  if (type !== KeyTypeEnum.Normal) {
    window.$message!.info('当前按键类型不支持');
    return;
  }
  const selectedData = {
    base: { code, type, key: keyId },
    detail: getKeyDetail({ code, type })
  };
  if (props.needImportKey) {
    selectedKeyInfo.list[1] = selectedData;
  } else {
    selectedKeyInfo.list[selectedKeyInfo.idx] = selectedData;
  }
}
async function handleDialogComfirm() {
  const sendData = {
    type: props.codeType,
    code: props.fncGenerateCode(),
    name: localTitle.value,
    keys: selectedKeyInfo.list.map((item: any, idx) => {
      const { key, code } = item.base;
      const range = formatKeyRange(idx);
      return {
        key,
        code,
        range
      };
    }),
    range: keyDistanceControlRef.value!.controlList.map((item: { value: number }) => item.value * 10)
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
function handleStanderKbClicked(data: { type: KeyTypeEnum; code: number; keyId: string }) {
  handleFncClicked(data);
}
function handleBaseKeyClicked(e: MouseEvent) {
  if (props.needImportKey) {
    return;
  }
  const targetElement = (e.target as Element).closest('[data-idx]');
  if (targetElement && targetElement instanceof HTMLElement) {
    const idx = targetElement.dataset.idx;
    selectedKeyInfo.idx = Number(idx);
  }
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
    class="h-90vh w-80% !bg-#191b1d"
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
          <p v-if="desc" class="text-center text-base text-c-second">{{ desc }}</p>
          <div class="flex flex-row justify-center gap-x-12">
            <div
              v-for="(_, idx) in dksGroupList"
              :key="`d-groups-${idx}`"
              class="flex flex-col gap-y-4"
              @click="handleBaseKeyClicked"
            >
              <DksKeyControl
                :seleted-idx="selectedKeyInfo.idx"
                :key-idx="idx"
                :selected-key="selectedKeyInfo.list?.[idx]"
              />
            </div>
            <KeyDistanceControl ref="keyDistanceControlRef" />
          </div>
          <slot name="extra"></slot>
        </div>
        <StandardKeyboard @key-clicked="handleStanderKbClicked"></StandardKeyboard>
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
