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
  const [triggerPoint, _1, _2, rtTrigger, rtReset] = data.tary;
  keyInfo.triggerPoint = triggerPoint;
  keyInfo.rtTrigger = rtTrigger;
  keyInfo.rtReset = rtReset;
  if (data.mt.length) {
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
  <div class="flex flex-col gap-y-4 low-layer-bg p-2">
    <h1 class="text-center text-base">按键信息</h1>
    <div class="flex flex-col text-c-primary">
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>默认{{ keyLabel || '/' }}</span>
        <span>
          当前
          <i v-if="showIcon" class=""></i>
          <span>
            {{ keyInfo.currentKey?.label }}
          </span>
        </span>
      </div>
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>触发点</span>
        <span class="text-c-hl">{{ keyInfo.triggerPoint || '/' }}</span>
      </div>
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>RT触发</span>
        <span class="text-c-hl">{{ keyInfo.rtTrigger || '/' }}</span>
      </div>
      <div class="flex flex-row justify-between border-b-1px border-#232327 py-3">
        <span>RT重置</span>
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
    <div>
      <NButton type="info" ghost size="small" class="mr-2" @click="handleDisableKey">禁用按键</NButton>
      <NButton type="info" ghost size="small" @click="handleResetKey">恢复默认</NButton>
    </div>
  </div>
</template>
