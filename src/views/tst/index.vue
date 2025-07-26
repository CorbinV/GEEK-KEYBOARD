<script setup lang="ts">
import { ref } from 'vue';
import { getKeyInfo, setKeyInfo } from '@/api/key';
import { useOTA } from '@/utils/ota/wch-x';
import { useDeviceStore } from '@/store/modules/device';
import { setEntryBoot, setOutBoot } from '@/api/ota';
const deviceStore = useDeviceStore();
const base = {
  cfg: 0,
  layer: 1
};
const reqLog = ref<any[]>([]);
const resLog = ref<any[]>([]);
async function getKeyReflect(key: string) {
  try {
    const send = {
      cfg: base.cfg,
      layer: base.layer,
      k: key
    };
    reqLog.value.unshift([`${new Date()}\t Send params:\t\t`, JSON.stringify(send)]);
    const data = await getKeyInfo(send);
    resLog.value.unshift([`${new Date()}\t Receiver message:\t\t`, JSON.stringify(data)]);
  } catch (error) {
    window?.$message!.error('Catch: get data failed');
    console.error(error);
    resLog.value.unshift([`${new Date()} Catch: update failed`, '']);
  }
}
async function updateKeyRelect(key: string, val: string) {
  try {
    const send = {
      cfg: base.cfg,
      layer: base.layer,
      k: key,
      v: val
    };
    reqLog.value.unshift([`${new Date()} Send params:`, JSON.stringify(send)]);
    const data = await setKeyInfo(send);
    reqLog.value.unshift([`${new Date()} Receiver message`, JSON.stringify(data)]);
  } catch (error) {
    window?.$message!.error('Catch: update failed');
    console.error(error);
    reqLog.value.unshift([`${new Date()} Catch: update failed`, '']);
  }
}

const isBoot = ref(false);

async function upgrande1() {
  // 1. abort device dettach listen
  deviceStore.updateOtaMode(true);

  // 2. send entry boot cmd
  await setEntryBoot();
  // wait cmd
  window.$message!.info('AWAIT FINISH');
  isBoot.value = true;
}
async function upgrande() {
  // 3. connect boot device
  // const filter = {
  //   // vendorId: 0x4353,
  //   // productId: 0x800c,
  //   vendorId: 0x1a86,
  //   productId: 0xfe07
  //   // usagePage: 0xff80,
  //   // reportId: 0x00
  // };
  // const devices: HIDDevice[] = [];
  // const list = await deviceStore.scanDevices(filter);
  // if (!list.length) {
  //   // throw new Error('No device selected');
  //   window.$message!.info('No device selected');
  //   return;
  // }
  // devices.push(...list);

  // await deviceStore.connect(devices, filter);
  // connect target device

  // start ota
  const url = new URL(
    'https://ota-public.oss-cn-shenzhen.aliyuncs.com/test-ota/HITBOX/400/HJK_HITPAD_V400_20250702.bin'
  );
  const { onlineOta } = await useOTA(url);
  await onlineOta();
}
async function outBoot() {
  await setOutBoot();
}
</script>

<template>
  <div class="flex flex-col p-6">
    <!--
 <div class="flex flex-1 flex-row justify-between">
      <SOCD></SOCD>
      <Control :update-btn="btnName"></Control>
      <div class="w-60">control</div>
    </div>
    <BtnList @list-item-click="injBtnItemClick" class="w-90% mx-auto my-0"></BtnList>
-->
    <div class="flex gap-x-10">
      <NButton @click="getKeyReflect('A')">get A</NButton>
      <NButton @click="updateKeyRelect('A', 'B')">A val-> B</NButton>
      <NButton @click="updateKeyRelect('A', 'C')">A val-> C</NButton>
      <NButton @click="upgrande1">entry boot</NButton>
      <NButton @click="outBoot">out boot</NButton>
      <NButton v-show="isBoot" @click="upgrande">online ota</NButton>
    </div>
    <div class="h-full flex flex-row justify-between">
      <div class="flex-1">
        <p class="mb-4">Request</p>
        <div v-for="[dateStr, data] in reqLog" :key="dateStr">
          <span>{{ dateStr }}</span>
          <span>{{ data }}</span>
          <NDivider></NDivider>
        </div>
      </div>
      <div class="mx-12 h-full w-4 rounded-xl bg-#292929"></div>

      <div class="flex-1">
        <p class="mb-4">Response</p>
        <div v-for="[date1Str, data1] in resLog" :key="date1Str">
          <span>{{ date1Str }}</span>
          <span>{{ data1 }}</span>
          <NDivider></NDivider>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-segment-tabs {
  :deep(.n-tabs-tab) {
    margin: 3px 12px;
  }
}
</style>
