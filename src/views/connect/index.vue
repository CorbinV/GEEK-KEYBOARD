<script setup lang="ts">
import { toRefs, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useDeviceStore } from '@/store/modules/device';
import { router } from '@/router';
import { useKeyboardStore } from '@/store/modules/keyboard';
const deviceStore = useDeviceStore();
const { isConnected } = toRefs(deviceStore);

const keyboardStore = useKeyboardStore();
const { kbInfo } = toRefs(keyboardStore);
const route = useRoute();
watchEffect(() => {
  if (!kbInfo.value.mounted) {
    return;
  }
  const redirctPath = route.query.redirect as string;
  if (redirctPath) {
    router.push(redirctPath);
  } else {
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
  <div class="h-full w-full flex flex-col">
    <div class="background-image h-full w-full flex">
      <NSpin :show="isConnected" class="h-100% w-100%">
        <div class="flex flex-col items-center text-center">
          <span class="mt-125px text-[36px] text-[#fff] font-500">{{ $t('businessCommon.connectDev') }}</span>
          <span class="mt-6px w-173 text-#999999">{{ $t('businessCommon.connectHint') }}</span>

          <button class="mt-62px h-60px w-168px rounded bg-[#3c8df4] text-[#fff]" @click="handleConnectBtnClicked">
            连接设备
          </button>
        </div>

        <!-- <img src="@/assets/img/connect_bg.png" class="block h-full w-full object-scale-down" draggable="false" /> -->
      </NSpin>
    </div>
  </div>
</template>

<!--
 <div class="mt-125px w-173 flex flex-col items-center text-center text-4">
  <span class="text-[36px] text-[#fff] font-500">Connecting</span>
  <span class="mt-6px text-#999999">
    Explore unique Settings and personalize your device to your preferences. relaxed Access, configure easily,
    save easily - win easily!
  </span>

  <button class="mt-62px h-60px w-168px rounded bg-[#3c8df4] text-[#fff]" @click="handleConnectBtnClicked">
    连接设备
  </button>
</div>

<img src="@/assets/img/connect_bg.png" class="block h-full w-full object-scale-down" draggable="false" />

</div>
-->
<style scoped>
.background-image {
  background-image: url('@/assets/img/connect_bg.png'); /* 设置背景图片 */
  background-size: cover;
  background-position: center;
}
</style>
