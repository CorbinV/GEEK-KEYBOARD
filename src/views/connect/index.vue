<script setup lang="ts">
import { onMounted, shallowRef, toRefs, watchEffect } from 'vue';
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
  const redirctPath = route.query.redirect as string;
  // ||   localStorage.getItem('redirectFrom') ;
  if (redirctPath) {
    router.push(redirctPath.substring(1));
  } else {
    router.push(import.meta.env.VITE_ROUTE_HOME || 'base-key');
  }
});
let isClicked = false;
const device = shallowRef();
const filter = {
  vendorId: 0x4353,
  productId: 0x800c,
  usagePage: 0xff80,
  reportId: 0x00
};
async function handleConnectBtnClicked(e) {
  try {
    if (isClicked) {
      return;
    }
    isClicked = true;
    const devices = [];
    if (device.value) {
      devices.push(device.value);
    } else {
      const list = await deviceStore.scanDevices(filter);
      if (!list.length) {
        window.$message!.info('No device selected');
        return;
      }
      devices.push(...list);
    }
    await deviceStore.connect(devices, filter);
    console.log('Connected');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    isClicked = false;
  }
}
onMounted(async () => {
  device.value = await deviceStore.scanPairedDevices(filter);
});
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <div class="h-full w-full flex items-center justify-center">
      <NSpin :show="kbInfo.isLoad" class="h-100% w-100%">
        <div class="mx-auto my-0 min-w-480px w-1/2 flex flex-col items-center justify-center gap-y-12 text-center">
          <span class="mt-125px text-[36px] text-[#fff] font-500">{{ $t('businessCommon.connectDev') }}</span>
          <p class="mt-6px w-105 text-lg text-#999999">{{ $t('businessCommon.connectHint') }}</p>
          <NButton
            type="primary"
            class="h-60px w-168px text-lg text-[#fff] !hover:text-#eee"
            @click="handleConnectBtnClicked"
          >
            {{ $t('businessCommon.connectDev') }}
          </NButton>
          <div class="mt-8 w-1/2 flex justify-center">
            <img src="@/assets/img/prod-static.png" />
          </div>
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped></style>
