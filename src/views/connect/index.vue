<script setup lang="ts">
import { onMounted, shallowRef, toRef, toRefs, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useDeviceStore } from '@/store/modules/device';
import { router } from '@/router';
import { isInBoot, useKeyboardStore } from '@/store/modules/keyboard';
import type { DeviceIptEnum } from '@/api/modules/setting';
const deviceStore = useDeviceStore();
const keyboardStore = useKeyboardStore();
const { kbInfo } = toRefs(keyboardStore);
const iptDevType = toRef(deviceStore, 'iptDevType');

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
const baseDeviceConfig = [
  // pc
  {
    usagePage: 0xff80,
    vendorId: 0x4353,
    productId: 0x800c
  },
  // ps
  {
    usagePage: 0xff80,
    vendorId: 0x054c,
    productId: 0x05c5
  },
  // ns
  {
    usagePage: 0xff80,
    vendorId: 0x057e,
    productId: 0x2009
  }
];
const boorDeviceConfig = [
  {
    vendorId: 0x4353,
    productId: 0x8008
  }
];
const getFilter = (useBoot?: boolean) => {
  const inboot = isInBoot();
  if (useBoot || inboot) {
    return boorDeviceConfig;
  }
  return baseDeviceConfig;
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
      const list = await deviceStore.scanDevices(getFilter());
      if (!list.length) {
        window.$message!.info('请选择设备，若无设备请检查设备连接');
        return;
      }
      devices.push(...list);
    }
    const d = devices[0];
    const type = baseDeviceConfig.findIndex(info => {
      return d.productId === info.productId && d.vendorId === info.vendorId;
    }) as unknown as DeviceIptEnum;
    if (type > -1) {
      iptDevType.value = type;
    }
    await deviceStore.connect(devices, baseDeviceConfig[iptDevType.value]);

    console.log('Connected');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    isClicked = false;
  }
}
onMounted(async () => {
  device.value = await deviceStore.scanPairedDevices(getFilter());
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
