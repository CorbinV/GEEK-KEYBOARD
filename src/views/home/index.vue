<script setup lang="ts">
import { toRefs, watchEffect } from 'vue';
import { useDeviceStore } from '@/store/modules/device';
import { router } from '@/router';
import { useKeyboardStore } from '@/store/modules/keyboard';
const deviceStore = useDeviceStore();
const { isConnected } = toRefs(deviceStore);

const keyboardStore = useKeyboardStore();
const { kbInfo } = toRefs(keyboardStore);

watchEffect(() => {
  if (kbInfo.value.mounted) {
    router.push('base-key');
  }
});
async function handleConnectBtnClicked() {
  console.log('handleConnectBtnClicked');
  try {
    await deviceStore.connect({
      vendorId: 0x4353,
      productId: 0x9108,
      usagePage: 65408
    });
    console.log('Connected');
  } catch (error) {
    console.error('Error:', error);
  }
}
</script>

<template>
  <div>
    <div>
      {{ isConnected }}
      <NButton @click="handleConnectBtnClicked">connect</NButton>
    </div>
    <!-- <Dynamic class="h-2/5"/> -->
    <!-- <KeyboardContainer /> -->
    <!-- <StaticKeyboard /> -->
    <!-- <Keyboard class="h-1/2 w-full" /> -->
    <!--
 <div>
      <LayerControl :layer="cL" :layer-list="x"></LayerControl>
    </div>
-->
  </div>
  <!--
 <NSpace vertical :size="16" class="relative">
    <Keyboard />
  </NSpace>
--></template>

<style scoped></style>
