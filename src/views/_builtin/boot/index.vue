<script setup lang="ts">
import { onMounted, ref, toRefs } from 'vue';
import { useOTA, useVersionInfo } from '@/utils/ota/wch-x';
import { setInBoot } from '@/store/modules/keyboard';
import { useDeviceStore } from '@/store/modules/device';

import { OtaStatusEnum } from '@/enum';
const { fetchLastVersion, getLastVersionUrl } = useVersionInfo({
  modal: 'HITBOX'
});
let versionUrl: URL[];
const fncReflect: any = {};
const deviceStore = useDeviceStore();
const { isConnected } = toRefs(deviceStore);
type rt = Awaited<ReturnType<typeof useOTA>>;
const otaRelectInfo = ref<{ value: rt['otaCtrl']['value'] }>({
  value: {
    status: 0,
    progress: 0
  }
});

onMounted(async () => {
  try {
    await fetchLastVersion(data => {
      versionUrl = getLastVersionUrl(data);
    });
    const { onlineOta, otaCtrl, resetOtaCtrl } = await useOTA(versionUrl[0]);
    otaRelectInfo.value = otaCtrl;
    fncReflect.onlineOta = onlineOta;
    fncReflect.resetOtaCtrl = resetOtaCtrl;
  } catch (error) {
    window.$log?.error('获取在线升级信息失败', error);
  }
});
const showProgress = ref(false);
async function handleUpgrade() {
  try {
    showProgress.value = true;
    if (!fncReflect.onlineOta) {
      window.$message?.error('在线升级功能失败，请检查网络后重新进入界面');
      return;
    }
    await fncReflect.onlineOta(otaRelectInfo.value.value);
    if (otaRelectInfo.value.value.status === OtaStatusEnum.UPGRADE_SUCCESS) {
      window.$message?.success('在线升级成功，即将转跳连接页', { duration: 2000 });
      setInBoot(false);
      window.location.reload();
    } else {
      window.$message?.error('在线升级失败，请重试或联系技术支持');
    }
  } catch (error) {
    window.$log?.error('在线升级失败', error);
  }
}

async function handleReupgrade() {
  fncReflect.resetOtaCtrl();
  if (!isConnected.value) {
    await deviceStore.reconnect();
  }
  try {
    // 3. emit onlineota
    await fncReflect.onlineOta(otaRelectInfo.value.value);
    window.$message?.success('在线升级成功，即将转跳连接页', { duration: 2000 });
    setInBoot(false);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    window.$message?.error('在线升级失败，请刷新重试或联系技术支持');
    window.$log?.error('在线升级失败', error);
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <div class="mx-auto mt-1/6 min-w-480px w-1/2 flex flex-col items-center justify-center gap-y-12 text-center">
      <span class="text-[36px] text-[#fff] font-500 -mt-12">设备异常</span>
      <p class="mt-6px w-105 text-lg text-#999999">检测到当前设备处于异常状态，请点击按钮更新固件</p>
      <NButton type="primary" class="h-60px w-168px text-lg text-[#fff] !hover:text-#eee" @click="handleUpgrade">
        更新固件
      </NButton>
    </div>
    <OtaProgress
      :show="showProgress"
      :status="otaRelectInfo.value?.status"
      :progress="otaRelectInfo.value?.progress"
      @redo="handleReupgrade"
      @update:show="showProgress = $event"
    />
  </div>
</template>

<style scoped></style>
