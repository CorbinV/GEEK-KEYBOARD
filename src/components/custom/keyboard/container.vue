<script setup lang="ts">
import { provide, readonly, ref, toRefs } from 'vue';
import { useResttableRefFn } from '@/hooks/common/basicFnc';
import { useCommonStore } from '@/store/modules/common';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { useDialog, useMessage } from 'naive-ui'
import { $t } from '@/locales';
import Dynamic from './dynamic.vue';
type SelectedInfo = {
  type: number;
  code: number;
  keyId: string;
};
const [selectedInfo, resetSelectedInfo] = useResttableRefFn<SelectedInfo>(() => ({
  type: -1,
  code: 0,
  keyId: ''
}));
const commonStore = useCommonStore();
const kbStore = useKeyboardStore()
const currentKeyFromKeyboard = ref({
  keyId: ''
});
const { activeKeyLayer } = toRefs(kbStore)
const dialog = useDialog()
function handleKeyEmit(data: { keyId: string; code: number; type: number }, { toDevice } = { toDevice: true }) {
  const keyId = currentKeyFromKeyboard.value.keyId;
  if (!keyId) {
    window.$message!.info($t('baseKey.keyboard.keyboardHint'));
    return;
  }
  selectedInfo.value = {
    type: data.type || 0,
    code: data.code,
    keyId: data.keyId
  };
  // check if key belong to some super key
  const keyOriginInfo = activeKeyLayer.value.keys[keyId]
  if (keyOriginInfo?.mt.length > 0 || keyOriginInfo?.super.length > 0) {
    // confirm: delete super key

    dialog.warning({
      title: $t('common.warning'),
      content: $t('baseKey.keyboard.removeSpkeyChange'),
      positiveText: $t('common.confirm'),
      negativeText: $t('common.cancel'),
      onPositiveClick: () => {
        commonStore.removeKeySpsById(data.keyId)
      }
    })

  }
  commonStore.setTargetKeyInfoById(
    keyId,
    {
      type: data.type,
      code: data.code
    },
    { toDevice, isxx: true }
  );
  // optimize: add some notify to show the key config has been changed
  // }
}
provide('selectedInfo', readonly(selectedInfo));
provide('resetSelectedInfo', resetSelectedInfo);
function handleKeyboardKeySelected(keyId: string) {
  currentKeyFromKeyboard.value.keyId = keyId;
}
</script>

<template>
  <div class="mx-auto my-0 h-full max-w-1600px flex items-center">
    <div class="h-full flex flex-col flex-1">
      <Dynamic @change:key-id="handleKeyboardKeySelected" />
      <div v-if="$slots.keyboardBottom" class="card-header">
        <slot name="keyboardBottom"></slot>
      </div>
      <div v-else class="mt-2 text-center text-c-second">{{ $t('baseKey.keyboard.keyboardHint') }}</div>
      <NDivider class="!my-2" />
      <div class="flex-1 overflow-clip">
        <slot :handle-key-emit="handleKeyEmit"></slot>
      </div>
    </div>
  </div>
</template>
