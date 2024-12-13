<script setup lang="ts">
import { toRefs, watchEffect } from 'vue';
import { useDeviceStore } from '@/store/modules/device';
import { router } from '@/router';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { $t } from '@/locales';
const deviceStore = useDeviceStore();
const { isConnected } = toRefs(deviceStore);

const keyboardStore = useKeyboardStore();
const { kbInfo } = toRefs(keyboardStore);
let timer: any = null;

watchEffect(() => {
  if (kbInfo.value.mounted) {
    clearTimeout(timer);
    router.push('base-key');
  }
});
async function handleConnectBtnClicked() {
  console.log('handleConnectBtnClicked');
  try {
    timer = setTimeout(() => {
      isConnected.value = false;
      window.$message!.error($t('businessCommon.connectTimeout'));
    }, 10000);
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
