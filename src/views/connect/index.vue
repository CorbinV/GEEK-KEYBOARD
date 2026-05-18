<script setup lang="ts">
import { toRefs, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useDeviceStore } from '@/store/modules/device';
import { router } from '@/router';
import { useKeyboardStore } from '@/store/modules/keyboard';
const deviceStore = useDeviceStore();

const keyboardStore = useKeyboardStore();
const { kbInfo } = toRefs(keyboardStore);
const route = useRoute();

watchEffect(() => {
  if (!kbInfo.value.mounted) {
    return;
  }
  const redirctPath = localStorage.getItem('redirectFrom') || route.query.redirect as string;
  if (redirctPath) {
    router.push(redirctPath.substring(1));
  } else {
    router.push('base-key');
  }
});
let isClicked = false;
async function handleConnectBtnClicked() {
  const HID_AUTH_USAGE_PAGE = 0x0001;
  const HID_AUTH_USAGE = 0x0000;

  try {
    if (isClicked) {
      return;
    }
    isClicked = true;
    const devices = await navigator.hid.requestDevice({
      filters: [
        { usagePage: HID_AUTH_USAGE_PAGE, usage: HID_AUTH_USAGE }
      ]
    })
    if(!devices.length){
      return
    }
    await deviceStore.connect(devices[0]);
    window.$log?.debug('Device Connected');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    isClicked = false;
  }
}
console.log('ssss')
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <div class="background-image h-full w-full flex">
      <NSpin :show="kbInfo.isLoad" class="h-100% w-100%">
        <div class="flex flex-col items-center text-center">
          <span class="mt-125px text-[36px] text-[#fff] font-500">{{ $t('businessCommon.connectDev') }}</span>
          <span class="mt-6px w-173 text-#999999">{{ $t('businessCommon.connectHint') }}</span>

          <button class="mt-62px h-60px w-168px rounded bg-[#3c8df4] text-[#fff]" @click="handleConnectBtnClicked">
            {{ $t('businessCommon.connectDev') }}
          </button>
        </div>

        <!-- <img src="@/assets/img/connect_bg.png" class="block h-full w-full object-scale-down" draggable="false" /> -->
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.background-image {
  background-image: url('@/assets/img/connect_bg.png');
  /* 设置背景图片 */
  background-size: cover;
  background-position: center;
}
</style>
