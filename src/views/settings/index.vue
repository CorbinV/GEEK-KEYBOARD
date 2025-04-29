<script setup lang="ts">
import { ref, toRef, onMounted, toRaw, nextTick } from 'vue';
import { SelectOption, useLoadingBar, useMessage } from 'naive-ui';
import { KeyboardSetting } from '@/api/modules/keyboard-setting';
import GroupTitle from '@/components/custom/group-title.vue';
import List from './components/list.vue';

import { getKeyboardSetting, setKeyboardSetting, resetKeyboard } from '@/api/keyConfig-setting';
import keyboardImg from '@/assets/img/keyboard_img.png';
import { $t } from '@/locales';
import { useDialog } from 'naive-ui'
const loadingBar = useLoadingBar()
import OtaProgress from './components/ota-progress.vue';
import OtaVersion from './components/ota-version.vue';
import { useOTA } from './composables/useOTA';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { useDeviceStore } from '@/store/modules/device';
const keyboardStore = useKeyboardStore();
const deviceStore = useDeviceStore();
const kbInfo = toRef(keyboardStore, 'kbInfo');

const fileInputRef = ref<HTMLInputElement | null>(null);
const { loading, remoteVersionInfo, onlineOta, versionCheck, doUpgrade, fileImport, fileExport, otaCtrl } =
  useOTA(kbInfo.value.hd);

const dialog = useDialog();
const showVersion = ref(false)
const showProgress = ref(false);

function useKbSettingCtrl() {
  const kbSettingInfo = ref<KeyboardSetting>({
    "allKey": 1,
    "wakeUp": 1,
    "wpDistance": 1,
    "wpDistances": [1, 2, 3, 4],
    "deepSleep": 30,
    "ds": [15, 30, 60]
  })
  const deepSleepOps = ref<SelectOption[]>([])
  const wakeupDistanceOps = ref<{
    label: string;
    value: number;
  }[]>([])
  const updateCtrlInfo = async () => {
    try {
      const data = await getKeyboardSetting();
      kbSettingInfo.value = data;
      updateDeepSleepOps(false);
      updateWpDistanceOps(false);
    } catch (error) {
      updateDeepSleepOps(true);
      updateWpDistanceOps(true);
    }
  }
  const updateDeepSleepOps = (isError: boolean) => {
    if (isError) {
      return
    }
    deepSleepOps.value = kbSettingInfo.value.ds.map((item, index) => {
      return {
        label: `${item}min`,
        value: item
      }
    })
  }
  const updateWpDistanceOps = (isError: boolean) => {
    if (isError) {
      // wakeupDistanceOps.value = [{
      //   value: 0,
      //   label: $t('businessCommon.temporaryUnavailable'),
      //   disabled: true
      // }]
      return
    }
    wakeupDistanceOps.value = kbSettingInfo.value.wpDistances.map((item, index) => {
      return {
        label: `${item}cm`,
        value: item
      }
    })
  }
  onMounted(async () => {
    await updateCtrlInfo();
  })
  return {
    kbSettingInfo,
    deepSleepOps,
    wakeupDistanceOps
  }
}
const { kbSettingInfo, deepSleepOps, wakeupDistanceOps } = useKbSettingCtrl();

const message = useMessage();
const onCheckUpdateClick = async () => {
  try {
    const [needUpgrade, checkMsg] = await versionCheck();
    if (!needUpgrade) {
      message.info(checkMsg as string);
      return
    }
    showProgress.value = true;
    const [otaRes] = await onlineOta();
    if (!otaRes && otaCtrl.value.errMsg) {
      window?.$message!.error(otaCtrl.value.errMsg);
    }

  } catch (error) {
    window?.$log!.error('Catch Error when check update', error);
  }
};
async function handleLocalUpgrade(e: InputEvent) {
  try {
    showProgress.value = true
    const [status, msg] = (await fileImport(e)) ?? [false, null];
    if (!status) {
      if (typeof msg === 'string') {
        message.error($t(msg as any));
      }
      return
    }
  } catch (error) {
    window?.$log!.error('catch error when local upgrade', error);
    message.error($t('businessCommon.executeFail'));
  }
}
const onReceiverPairClick = () => {
  // feat: wait for next version
  message.info($t('common.featCommingSoon'));
  return
};
const onFactoryResetClick = async () => {
  dialog.warning({
    title: $t('common.warning'),
    content: $t('businessCommon.confirmToReset'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      try {
        loadingBar.start()
        await resetKeyboard()
        message.success($t('setting.restoreSucess'));
        await deviceStore.disconnect()
      } catch (e) {
        message.error(`${$t('businessCommon.executeFail')}, ${$t('businessCommon.plsUpdate')}`);
        window?.$log!.error(`Reset device failed`, e);
      } finally {
        loadingBar.finish()
      }
    }
  })

};

// 处理全键无冲开关点击事件
const handleFullKeyChange = async (newValue: boolean) => {
  const [status, errorInfo] = await handleValueChange()
  if (!status) {
    message.success($t('businessCommon.executeFail'));
    window?.$log!.error(`Executed error when fullKeyChange`, errorInfo);
    return
  }
  const text = newValue ? $t('setting.allKeyOpenHint') : $t('setting.allKeyCloseHint');
  message.success(text);
};
async function handleValueChange() {
  const res: [boolean, Error | null] = [false, null]
  try {
    const { ds, wpDistances, ...sendData } = toRaw(kbSettingInfo.value);
    await setKeyboardSetting(sendData)
    res[0] = true;
  } catch (e: Error | any) {
    res[1] = e
  }
  return res;
}

// 处理感应唤醒开关点击事件
const onWakeUpSwitchChange = async (newValue: boolean) => {
  const [status, errorInfo] = await handleValueChange()
  if (!status) {
    message.error($t('businessCommon.executeFail'));
    window?.$log!.error(`Executed error when wakeUpSwitchChange`, errorInfo);
    return
  }
  const text = newValue ? $t('setting.wakeUpOpenHint') : $t('setting.wakeUpClosenHint');
  message.success(text);
};
const triggerFileImport = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};
async function handleUpgrade() {
  try {
    showVersion.value = false;
    nextTick(() => {
      showProgress.value = true;
    })
    await doUpgrade()
  } catch (error) {
    window?.$log!.error(`Upgrade failed`, error);
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col items-center select-none">
    <img :src="keyboardImg" alt="Logo" class="h-324px w-804px min-804px" />
    <div class="mt-20px h-520px w-976px flex flex-col   rounded-md bg-[#171619] p-30px pt-4">
      <h1 class="text-[22px] text-center">{{ $t('setting.devName', { total: kbInfo.hd?.model || 'kb001' }) }}</h1>
      <div class="flex flex-col gap-y-2">
        <GroupTitle :title="$t('setting.connectMode')">
          <template #end>
            <span>{{ kbInfo.hd!.connect || 'USB' }}</span>
          </template>
        </GroupTitle>
        <GroupTitle :title="$t('setting.allKeyNot')">
          <template #end>
            <NSwitch v-model:value="kbSettingInfo.allKey" :checked-value="1" :unchecked-value="0"
              @update:value="handleFullKeyChange" />
          </template>
        </GroupTitle>
        <div class="pb-3 border-b-1 border-#232327">
          <GroupTitle :title="$t('setting.wakeUp')" :sub-title="$t('setting.wakeUpHint')" :show-bottom-line="false">
            <template #end>
              <NSwitch v-model:value="kbSettingInfo.wakeUp" :checked-value="1" :unchecked-value="0"
                @update:value="onWakeUpSwitchChange" />
            </template>
          </GroupTitle>
          <div class="flex items-center justify-between -pt-2 p-1 rounded-md bg-[#19191d]">
            <div class="text-lg ml-2.5">{{ $t('setting.wakeUpDistance') }}</div>
            <List v-if="wakeupDistanceOps.length" :list="wakeupDistanceOps"
              v-model:selected-idx="kbSettingInfo.wpDistance" />
            <p v-else class="text-#666666">{{ $t("common.featCommingSoon") }}</p>
          </div>
        </div>
        <GroupTitle :title="$t('setting.deepSleep')" :sub-title="$t('setting.deepSleepHint')">
          <template #end>
            <NSelect v-if="deepSleepOps.length" v-model:value="kbSettingInfo.deepSleep" :options="deepSleepOps"
              class="h-40px w-120px !cursor-not-allowed" placement="bottom-start" trigger="click" size="large" />

            <p v-else class="text-#666666">{{ $t("common.featCommingSoon") }}</p>
          </template>
        </GroupTitle>
        <div class="flex justify-between pb-2 border-b-1 border-#232327">
          <div>
            <GroupTitle :title="$t('setting.gjUpdate')" :sub-title="`v${kbInfo.hd.version || '0.0.1'}`"
              :show-bottom-line="false">
            </GroupTitle>
            <div class="-mt-2">
              <i class="iconfont icon-file-export text-[20px] text-[#3C8DF4] cursor-pointer" @click="fileExport"></i>
              <i class="iconfont icon-file-import ml-30px text-[20px] text-[#3C8DF4] cursor-pointer"
                @click="triggerFileImport"></i>
              <input ref="fileInputRef" type="file" accept=".zip" style="display: none"
                @change="(e) => handleLocalUpgrade(e as InputEvent)" />
            </div>
          </div>
          <NButton type="info" :loading="loading" icon-placement="right" :disabled="remoteVersionInfo.isLastVersion"
            class="h-90% w-170px rounded-md bg-[#3c8df4] c-white hover:bg-[#3c8df4]" @click="onCheckUpdateClick">
            {{ remoteVersionInfo.isLastVersion ? $t('businessCommon.latestVersion') : $t('setting.checkUpdate') }}
          </NButton>
        </div>
      </div>
      <div class="flex-raw w-full flex justify-between rounded-md pt-20px">
        <button class="hollow-btn h-60px w-170px" @click="onReceiverPairClick">{{ $t('setting.pair24') }}</button>
        <button class="hollow-btn h-60px w-170px" @click="onFactoryResetClick">{{ $t('setting.restore') }}</button>
      </div>
    </div>
    <OtaVersion :show="showVersion" :versioninfo="remoteVersionInfo" @update:show="showVersion = $event"
      @upgrade="handleUpgrade" />
    <OtaProgress :show="showProgress" :status="otaCtrl.status" :progress="otaCtrl.progress"
      @update:show="showProgress = $event" />
  </div>
</template>

<style scoped>
.hollow-btn {
  background-color: transparent;
  color: #3c8df4;
  /* 按钮文字颜色 */
  border: 1px solid #3c8df4;
  /* 边框颜色 */
  border-radius: 8px;
  /* 圆角边框 */
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hollow-btn:hover {
  background-color: #3c8df4;
  /* 悬停时的背景颜色 */
  color: white;
  /* 悬停时文字颜色 */
}

.li-title {
  position: relative;
  text-align: left;
  font-size: 18px;
  padding-left: 8px;
  /* 给文本留出空间避免和线条重叠 */
  box-shadow: -4px 3px 0 0 #3c8df4;
  /* 创建蓝色竖线 */
}
</style>
