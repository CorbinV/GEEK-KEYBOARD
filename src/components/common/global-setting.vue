<script setup lang="ts">
import { ref, toRef, watch } from 'vue';
import { DeviceInputTypeEnum } from '@/enum/keyType';
import { useOTA, useVersionInfo } from '@/utils/ota/wch-x';

import { router } from '@/router';
import { $t } from '@/locales';
import OtaVersion from '../custom/ota-version.vue';
import OtaProgress from '../custom/ota-progress.vue';
import { version } from '@/../package.json';
defineOptions({
  name: 'GlobalSetting'
});
const showModal = ref(false);

const websiteInfo = JSON.parse(import.meta.env.VITE_WEBSITE);
const productionInfo = JSON.parse(import.meta.env.VITE_PRODUCTION);
const deviceInfo = ref<{
  rate: number;
  inputType: DeviceInputTypeEnum;
  modal: string;
  version: string;
}>({
  inputType: DeviceInputTypeEnum.PC,
  rate: 1000,
  modal: '',
  version: ''
});
const needUpgrade = ref(false);
const showVersion = ref(false);
const versionCtrl = ref<ReturnType<typeof useVersionInfo>>({} as any);
const asyncFnc = ref<any>({});
const filter = {
  vendorId: 0x4353,
  productId: 0x8008
};
setTimeout(async () => {
  const { useKeyboardStore } = await import('@/store/modules/keyboard');
  const { useDeviceStore } = await import('@/store/modules/device');
  const keyboardStore = useKeyboardStore();
  const deviceStore = useDeviceStore();
  const kbInfo = toRef(keyboardStore, 'kbInfo');
  watch(
    () => kbInfo.value.mounted,
    v => {
      if (!v) {
        return;
      }
      deviceInfo.value = {
        rate: kbInfo.value.hd.rate,
        inputType: kbInfo.value.hd.inputType,
        modal: kbInfo.value.hd.model || 'HITBOX',
        version: kbInfo.value.hd.version
      };
      const xx = useVersionInfo(deviceInfo.value);
      versionCtrl.value = Object.assign(versionCtrl.value, xx);
      import('@/api/ota').then(r => {
        asyncFnc.value.setEntryBoot = r.setEntryBoot;
        asyncFnc.value.setOutBoot = r.setOutBoot;
      });
      import('@/api/setting').then(r => {
        asyncFnc.value.setResetDevice = r.setResetDevice;
      });
      asyncFnc.value.updateOtaMode = deviceStore.updateOtaMode;
      asyncFnc.value.connect = deviceStore.connect;
      asyncFnc.value.disconnect = deviceStore.disconnect;
      asyncFnc.value.scanDevices = deviceStore.scanDevices;
    },
    {
      immediate: true
    }
  );
}, 100);

async function handleCheckVersion() {
  if (!versionCtrl.value?.versionCheck) {
    return;
  }
  const [hasNewVer, errMsg] = await versionCtrl.value.versionCheck();
  if (!hasNewVer) {
    window?.$message?.info($t(errMsg));
    return;
  }
  needUpgrade.value = true;
  showVersion.value = true;
}
async function handleFirstConfirm(resolve: (value: boolean) => void) {
  try {
    asyncFnc.value.updateOtaMode(true);
    resolve(true);
    await asyncFnc.value.setEntryBoot();
  } catch (error) {
    window?.$log?.error(error);
    resolve(false);
  }
}

type rt = Awaited<ReturnType<typeof useOTA>>;
const otaRelectInfo = ref<{ value: rt['otaCtrl']['value'] }>({
  value: {
    status: 0,
    progress: 0
  }
});
const showProgress = ref(false);
async function handleSecondConfirm(list: HIDDevice[]) {
  if (!list.length) {
    window.$message!.info('请按提示选取设备');
    asyncFnc.value.updateOtaMode(false);

    return;
  }

  await asyncFnc.value.connect(list, filter, true);

  const [url] = versionCtrl.value?.remoteVersionInfo.urls || [];
  if (!url) {
    return;
  }
  try {
    const { onlineOta, otaCtrl } = await useOTA(url);
    otaRelectInfo.value = otaCtrl;
    showVersion.value = false;
    showProgress.value = true;
    await onlineOta();
    window?.$message?.success('升级成功，即将转跳连接页', { duration: 10000 });
    asyncFnc.value.disconnect();
  } catch (error) {
    window?.$log?.error(error);
    window?.$message?.error('升级失败，请检查设备连接状态', { duration: 10000 });
  }
}

async function handleReupgrade() {
  showVersion.value = false;
  showProgress.value = true;
}
async function handleShowVersion(ops: { res: boolean; firstConfirm: boolean }) {
  const { res, firstConfirm } = ops;
  if (firstConfirm && !res) {
    await asyncFnc.value.setOutBoot();
    asyncFnc.value.disconnect();
    router.push({
      name: 'root'
    });
  } else {
    showVersion.value = false;
  }
}
async function handleDeviceReset() {
  try {
    await asyncFnc.value.setResetDevice();
    window?.$message?.success('恢复出厂设置成功，设备已退出', { duration: 5000 });
  } catch (error) {
    window?.$message?.error('恢复出厂设置失败，请检查设备连接或升级到最新版本', { duration: 5000 });
    window?.$log?.error(error);
  }
}

const extraBtnClass = `h-30px w-122px flex items-center justify-center rounded-lg  p-3 text-base color-white`;
</script>

<template>
  <ButtonIcon tooltip-placement="left" @click="showModal = !showModal">
    <SvgIcon local-icon="setting" />
  </ButtonIcon>

  <NModal v-model:show="showModal" class="min-h-650px min-w-28% rounded-[10px] bg-[#171619]">
    <div class="model-bg flex flex-col select-none p-30px text-[22px]">
      <p class="w-100% text-center text-22px text-[#fff]">{{ $t('businessCommon.set') }}</p>
      <div class="flex flex-col gap-y-4">
        <GroupTitle :title="$t('global_Setting.resetToFactory')">
          <template #end>
            <span class="cursor-pointer bg-[#e64324]" :class="extraBtnClass" @click="handleDeviceReset">
              {{ $t('common.confirm') }}
            </span>
          </template>
        </GroupTitle>
        <GroupTitle :title="$t('global_Setting.rate')">
          <template #content>
            <div class="flex justify-between py-2 text-base">
              <p class="text-#999999">
                <span class="mr-2">{{ $t('global_Setting.currentRate') }}:</span>
                <span>{{ deviceInfo.rate }}Hz</span>
              </p>
              <span class="bg-[#2a2a31]" :class="extraBtnClass">{{ deviceInfo.rate }}Hz</span>
            </div>
          </template>
        </GroupTitle>

        <GroupTitle :title="$t('global_Setting.inputMode')">
          <template #content>
            <div class="flex justify-between py-2 text-base">
              <p class="text-#999999">
                <span class="mr-2">{{ $t('global_Setting.currentInputMode') }}:</span>
                <span>{{ deviceInfo.inputType }}</span>
              </p>
              <span class="bg-[#2a2a31]" :class="extraBtnClass">{{ deviceInfo.inputType }}</span>
            </div>
          </template>
        </GroupTitle>
        <GroupTitle :title="$t('global_Setting.qdVersion')">
          <template #content>
            <div class="flex justify-between py-2 text-base">
              <!--
 <p class="text-#999999">
                <span class="mr-2">{{ $t('global_Setting.versionInfo') }}:</span>
                <span>2024/11/6</span>
              </p>
-->
              <p class="text-#999999">
                <span class="mr-2">{{ $t('global_Setting.version') }}:</span>
                <span>{{ version }}</span>
              </p>
            </div>
          </template>
        </GroupTitle>
        <GroupTitle :title="$t('global_Setting.firmwareVersion')">
          <template #content>
            <div class="flex justify-between py-2 text-base">
              <!--
 <p class="text-#999999">
                <span class="mr-2">{{ $t('global_Setting.versionInfo') }}:</span>
                <span>2024/11/6</span>
              </p>
-->
              <p class="text-#999999">
                <span class="mr-2">{{ $t('global_Setting.version') }}:</span>
                <span>{{ deviceInfo?.version || '-' }}</span>
              </p>
            </div>
          </template>
          <template #end>
            <div
              v-if="!versionCtrl?.remoteVersionInfo?.isLastVersion"
              class="cursor-pointer bg-[#e64324]"
              :class="extraBtnClass"
              @click="handleCheckVersion"
            >
              {{ $t('setting.checkUpdate') }}
            </div>
            <div v-else class="bg-[#2a2a31]" :class="extraBtnClass">
              {{ $t('businessCommon.latestVersion') }}
            </div>
          </template>
        </GroupTitle>

        <GroupTitle :title="$t('global_Setting.officialInfo')" :show-bottom-line="false">
          <template #content>
            <div class="flex justify-between py-2 text-base">
              <p class="text-#999999">
                <span class="mr-2">{{ $t('global_Setting.officialWeb') }}:</span>
                <a :href="websiteInfo.url">{{ websiteInfo.name }}</a>
              </p>
              <p class="text-#999999">
                <span class="mr-2">{{ $t('global_Setting.wechart') }}:</span>
                <a :href="productionInfo.url">{{ productionInfo.name }}</a>
              </p>
            </div>
          </template>
        </GroupTitle>
      </div>

      <div class="mt-30px flex flex-row justify-center gap-70px">
        <button class="hollow-btn h-60px w-170px font-[18px]" @click="showModal = false">
          {{ $t('common.close') }}
        </button>
      </div>
    </div>
  </NModal>
  <!-- extra ota  -->
  <OtaVersion
    :versioninfo="versionCtrl.remoteVersionInfo"
    :show="showVersion"
    :second-confirm="true"
    :second-confirm-fnc="
      async () => {
        return asyncFnc.scanDevices([filter]);
      }
    "
    @upgrade="handleFirstConfirm"
    @upgrade:confirm="handleSecondConfirm"
    @update:show="handleShowVersion"
  />
  <OtaProgress
    :show="showProgress"
    :status="otaRelectInfo.value?.status"
    :progress="otaRelectInfo.value?.progress"
    @redo="handleReupgrade"
    @update:show="showProgress = $event"
  />
</template>

<style scoped>
.hollow-btn {
  background-color: transparent;
  color: #e64324;
  /* 按钮文字颜色 */
  border: 1px solid #e64324;
  /* 边框颜色 */
  border-radius: 8px;
  /* 圆角边框 */
  padding: 10px 20px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hollow-btn:hover {
  background-color: #e64324;
  /* 悬停时的背景颜色 */
  color: white;
  /* 悬停时文字颜色 */
}
</style>
