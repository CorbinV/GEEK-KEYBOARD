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
    <div class="h-full flex items-center justify-center">
      <NSpin :show="isConnected">
        <div
          class="h-30 w-90 flex flex-col items-center justify-center gap-2.5 border border border-[#ffffff] rounded-lg border-dashed text-base text-[#3C8DF4] font-normal"
          @click="handleConnectBtnClicked"
        >
          <i class="iconfont icon-add" style="color: #ffffff"></i>
          <span class="text-[#ffffff]">请连接设备</span>
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped></style>
