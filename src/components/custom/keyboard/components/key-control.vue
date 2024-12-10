<script setup lang="ts">
import { computed, reactive, toRefs, watchEffect } from 'vue';
import type { KeyInfo } from '@/api/modules/keyboard';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { useCommonStore } from '@/store/modules/common';

const keyboardStore = useKeyboardStore();
const commonStore = useCommonStore();
type KeyControlProps = {
  keyId?: string;
  keyLabel?: string;
};
const props = withDefaults(defineProps<KeyControlProps>(), {
  keyId: ''
});
const { kbCfg } = toRefs(keyboardStore);
const keyInfo = reactive({
  currentKey: {} as {
    type: string;
    label: string;
    icon: string;
  },
  triggerPoint: 0,
  rtTrigger: 0,
  rtReset: 0,
  params: []
});
const showIcon = computed(() => {
  return keyInfo.currentKey?.type !== 'str';
});
function updateKeyInfo(data: KeyInfo) {
  keyInfo.currentKey = kbCfg.value.keyMap[data!.type]?.code?.[data!.code] || {};
  const [triggerPoint, _1, rtTrigger, rtReset, _4] = data.tary;
  keyInfo.triggerPoint = triggerPoint;
  keyInfo.rtTrigger = rtTrigger;
  keyInfo.rtReset = rtReset;
  if (data.mt?.length) {
    // feat: add new function to get config by key type and code
    // keyInfo.params = ;
  }
}
// optimize: add a notification to show the result
watchEffect(async () => {
  if (props.keyId === '') return;
  const data = await commonStore.getTargetKeyInfo(props.keyId);
  updateKeyInfo(data);
});
async function handleResetKey() {
  const data = await commonStore.restoreTargetKeyInfoById(props.keyId);
  updateKeyInfo(data);
  // optimize: add a notification to show the result
}
async function handleDisableKey() {
  await commonStore.setTargetKeyInfoById(props.keyId, { enable: 0 });
  // optimize: add a notification to show the result
}

// const
</script>

<template>
  <div class="min-w-168px flex flex-col gap-y-4 low-layer-bg p-2">
    <h1 class="text-center text-base">{{ $t('macro.keyInfo') }}</h1>
    <div class="flex flex-col text-c-primary">
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>
          {{ $t('baseKey.keyboard.admin1', { total: keyLabel }) }}
        </span>
        <span>
          {{ $t('baseKey.keyboard.current') }}
          <i v-if="showIcon" class=""></i>
          <span>
            {{ keyInfo.currentKey?.label }}
          </span>
        </span>
      </div>
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>{{ $t('baseKey.keyboard.exeDot') }}</span>
        <span class="text-c-hl">{{ keyInfo.triggerPoint || '/' }}</span>
      </div>
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>{{ $t('baseKey.keyboard.exeRt') }}</span>
        <span class="text-c-hl">{{ keyInfo.rtTrigger || '/' }}</span>
      </div>
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>{{ $t('baseKey.keyboard.resetRt') }}</span>
        <span class="text-c-hl">{{ keyInfo.rtReset || '/' }}</span>
      </div>
      <!-- feat: finish the params -->
      <!--
      <div class="flex flex-row justify-between py-3">
            <span>属性:</span>

      <div class="flex flex-col"></div>
              <span class="text-c-hl">{{ detail.tary[2] }}</span>
      </div>
      -->
    </div>
    <div class="no-wrap flex gap-x-2">
      <NButton type="info" ghost size="small" @click="handleDisableKey">
        {{ $t('baseKey.keyboard.bandKey') }}
      </NButton>
      <NButton type="info" ghost size="small" @click="handleResetKey">{{ $t('baseKey.keyboard.recvoer') }}</NButton>
    </div>
  </div>
</template>
