<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, toRef, toRefs, watch, watchEffect } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import BaseKey from '@/components/custom/keyboard/components/base-key.vue';
import { BaseKeyboard, StandardKeyboard } from '@/components/custom/keyboard';
import { useResttableReactiveFn } from '@/hooks/common/basicFnc';
import type { BaseKey as BaseKeyType } from '@/api/modules/combo';
const emit = defineEmits(['update:visible', 'update:title', 'create-group']);

const keyboardStore = useKeyboardStore();
const getKeyDetail = keyboardStore.getKeyDetail;
const { selectedKeys } = toRefs(keyboardStore);
const kbCfg = toRef(keyboardStore, 'kbCfg');

const props = withDefaults(
  defineProps<{
    visible: boolean;
    fncGenerateCode: () => number;
    codeType: KeyTypeEnum;
    title: string;
    desc: string;
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
    detail: any;
  }[];
}>(() => ({
  idx: props.needImportKey ? 1 : 0,
  list: []
}));

onMounted(() => {
  if (props.needImportKey) {
    // const { selectedKeys } = toRefs(keyboardStore);
    // watch(
    //   () => Object.keys(selectedKeys.value).length,
    //   (nLength, oLength) => {
    //     // perf: reduce the number of times of watchEffect
    //     // if (nLength === 1 && oLength === 0) {
    //     console.log('selectedKeys', nLength, oLength);
    //     const keys = Object.keys(selectedKeys.value);
    //     if (keys?.[0]) {
    //       selectedKeyInfo.list = [selectedKeys.value[keys[0]]];
    //     }
    //     // }
    //   }
    // );
    watch(
      () => selectedKeys.value,
      newSelectedKeys => {
        const keys = Object.keys(newSelectedKeys);
        if (keys?.[0]) {
          selectedKeyInfo.list = [selectedKeys.value[keys[0]]];
        }
      }
    );
  }
});
const [localTitle] = useTitle();

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
function showInfoMessage(message: string): void {
  window.$message!.info(message);
}
const checkKeyBinding = (keyId: string, isMT: boolean = false): boolean => {
  const key = kbCfg.value.superKeyMap[keyId];
  if (!key) return false;
  const isBound =
    (isMT && (key?.dks || key?.sp.length > 0 || key?.mt !== undefined)) || (!isMT && (key?.dks || key?.sp.length > 0));
  if (isBound) {
    showInfoMessage('按键已绑定其它功能');
  }
  return isBound;
};

function checkKeyInput(keyId: string): boolean {
  switch (props.codeType) {
    case KeyTypeEnum.OKS:
    case KeyTypeEnum.SOCD:
    case KeyTypeEnum.RS:
    case KeyTypeEnum.TGL:
      return checkKeyBinding(keyId);
    case KeyTypeEnum.MT:
      return checkKeyBinding(keyId, true);
    default:
      return true;
  }
}

function checkKeyComfirm() {
  if (selectedKeyInfo.list.length < 2) {
    window.$message!.info('请选择按键');
    return true;
  }
  if (selectedKeyInfo.list[0].base.key === selectedKeyInfo.list[1].base.key) {
    window.$message!.info('请选择不同的按键');
    return true;
  }
  return checkKeyInput(selectedKeyInfo.list[0].base.key ?? '') && checkKeyInput(selectedKeyInfo.list[1].base.key ?? '');
}

async function handleDialogComfirm() {
  if (checkKeyComfirm()) {
    return;
  }
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
function handleKeyClickedx(data: { type: KeyTypeEnum; code: number; keyId: string }) {
  console.log('handleKeyClickedx data', selectedKeyInfo.idx, data);
  if (checkKeyInput(data.keyId)) {
    return;
  }
  handleFncClicked(data);
}
function handleStanderKbClicked(data: { type: KeyTypeEnum; code: number; keyId: string }) {
  console.log('handleStanderKbClicked data', selectedKeyInfo.idx, data);
  if (checkKeyInput(data.keyId)) {
    return;
  }
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
            <div
              v-for="(_, idx) in new Array(2)"
              :key="`d-groups-${idx}`"
              class="flex flex-col gap-y-4"
              @click="handleBaseKeyClicked"
            >
              <BaseKey
                :base="selectedKeyInfo.list?.[idx]?.base"
                :detail="selectedKeyInfo.list?.[idx]?.detail"
                :selected="selectedKeyInfo.idx === idx"
                :data-idx="idx"
              ></BaseKey>
              <div class="text-center text-c-second">{{ idx + 1 }}</div>
            </div>
          </div>
          <slot name="extra"></slot>
        </div>
        <div class="flex flex-1 items-center justify-between">
          <div class="flex-1"></div>
          <BaseKeyboard v-if="keyboardType === 'base'" as="component" @update:key-id="handleKeyClickedx" />
          <StandardKeyboard v-else @key-clicked="handleStanderKbClicked"></StandardKeyboard>
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
