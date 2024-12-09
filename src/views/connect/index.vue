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
let isClicked = false;
async function handleConnectBtnClicked() {
  try {
    if (isClicked) {
      return;
    }
    isClicked = true;
    await deviceStore.connect({
      vendorId: 0x4353,
      productId: 0x9108,
      usagePage: 65408
    });
    console.log('Connected');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    isClicked = false;
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col justify-center">
    <div class="mx-8 h-25 flex items-center justify-between bg-[##222226]">
      <SystemLogo class="h-10 text-30 text-primary" />
      <!-- <icon-ant-design-setting-outlined class="text-icon" /> -->
    </div>
    <div class="h-full flex justify-center bg-[#000000] pt-45">
      <NSpin :show="isConnected">
        <div class="w-173 flex flex-col items-center text-center text-4 text-#999999">
          <span>
            Explore unique Settings and personalize your device to your preferences. relaxed Access, configure easily,
            save easily - win easily!
          </span>

          <button class="mt-14 h-15 w-42 rounded bg-[#3c8df4] text-[#fff]" @click="handleConnectBtnClicked">
            连接设备
          </button>
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped></style>
