<script setup lang="ts">
import { ref } from 'vue';
import { useMessage } from 'naive-ui';
import { getKeyboardSetting, setKeyboardSetting } from '@/api/keyConfig-setting';
import keyboardImg from '@/assets/img/keyboard_img.png';
import { $t } from '@/locales';
// import RestoreFactoryModal from '@/views/settings/components/reset-modal.vue';
import OtaProgress from './components/ota-progress.vue';
import OtaVersion from './components/ota-version.vue';
import { useOTA } from './composables/useOTA';

const fileInputRef = ref<HTMLInputElement | null>(null);
const { loading, showVersion, versionInfo, progress, showProgress, fetchVersion, upgrade, fileImport, fileExport } =
  useOTA();

async function getSet() {
  const x = await getKeyboardSetting();
  console.log(x);
}
const versionCode = ref('1.2.0');
const fullKeyRolloverSwitch = ref(true);
const wakeUpSwitch = ref(true);
const message = useMessage();
const onCheckUpdateClick = () => {
  fetchVersion();
};

const onReceiverPairClick = () => {
  console.log('2.4g接收器配对按钮被点击');
  // 这里可以加入接收器配对的逻辑
};
function getVersion() {}
const onFactoryResetClick = () => {
  message.success($t('setting.restoreSucess'), {
    duration: 3000 // 持续时间
  });
  // 这里可以加入恢复出厂设置的逻辑
};

// 处理全键无冲开关点击事件
const onFullKeyRolloverChange = (newValue: boolean) => {
  if (newValue) {
    message.success($t('setting.allKeyOpenHint'), {
      duration: 3000 // 持续时间
    });
  } else {
    message.error($t('setting.allKeyCloseHint'), {
      duration: 3000 // 持续时间
    });
  }

  // setDevPerf();
};

// 处理感应唤醒开关点击事件
const onWakeUpSwitchChange = (newValue: boolean) => {
  if (newValue) {
    message.success($t('setting.wakeUpOpenHint'), {
      duration: 3000 // 持续时间
    });
  } else {
    message.error($t('setting.wakeUpClosenHint'), {
      duration: 3000 // 持续时间
    });
  }
  setDevPerf();
  // 在这里可以添加逻辑，比如同步到服务器或其他操作
};
async function setDevPerf() {
  await setKeyboardSetting({ allKey: fullKeyRolloverSwitch.value ? 1 : 0, wakeUp: wakeUpSwitch.value ? 1 : 0 });
  //  await addOks({ code, keys, name });
}

getVersion();
getSet();

const triggerFileImport = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};
</script>

<template>
  <!-- 引用 public 目录下的图片 -->
  <div class="h-full w-full flex flex-col items-center">
    <img :src="keyboardImg" alt="Logo" class="h-324px w-804px" />

    <div class="mt-20px h-520px w-976px flex flex-col items-center rounded-md bg-[#171619] p-30px">
      <h1 class="text-[22px]">{{ $t('setting.devName', { total: 'NB99' }) }}</h1>
      <!-- <div class="li-title">连接模式</div> -->

      <div class="h-66px w-full flex flex items-center justify-between border-b-1px border-[#232327] text-[18px]">
        {{ $t('setting.connectMode') }}
        <div>USB</div>
      </div>

      <div class="h-66px w-full flex items-center justify-between border-b-1px border-[#232327] text-[18px]">
        {{ $t('setting.allKeyNot') }}
        <NSwitch v-model:value="fullKeyRolloverSwitch" @update:value="onFullKeyRolloverChange" />
      </div>
      <div class="h-110px w-full flex flex-col justify-between border-b-1px border-[#232327] pb-20px pt-20px">
        <div class="h-110px w-full flex justify-between text-[18px]">
          {{ $t('setting.wakeUp') }}
          <NSwitch v-model:value="wakeUpSwitch" onupdate @update:value="onWakeUpSwitchChange" />
        </div>
        <div class="text-[16px] text-[#999]">
          {{ $t('setting.wakeUpHint') }}
        </div>
      </div>
      <div
        class="flex-raw h-110px w-full flex justify-between border-b-1px border-[#232327] pb-20px pt-20px text-[18px]"
      >
        <div class="flex flex-col">
          <div>
            {{ $t('setting.gjUpdate') }}
            <span class="text-14px text-[#999]">{{ versionCode }}</span>
          </div>
          <div class="mt-10px">
            <i class="iconfont icon-shezhi-daoru text-[28px] text-[#3C8DF4]" @click="fileExport"></i>
            <i class="iconfont icon-shezhi-daochu ml-30px text-[28px] text-[#3C8DF4]" @click="triggerFileImport"></i>
            <input ref="fileInputRef" type="file" accept=".bin,.ufw" style="display: none" @change="fileImport" />
          </div>
        </div>
        <!--
 <button class="h-60px w-170px rounded-md bg-[#3c8df4] c-white hover:bg-[#3c8df4]" @click="onCheckUpdateClick">
          {{ $t('setting.checkUpdate') }}
        </button>
-->
        <NButton
          :loading="loading"
          icon-placement="right"
          class="h-60px w-170px rounded-md bg-[#3c8df4] c-white hover:bg-[#3c8df4]"
          @click="onCheckUpdateClick"
        >
          {{ $t('setting.checkUpdate') }}
        </NButton>
      </div>
      <div class="flex-raw w-full flex justify-between rounded-md pt-20px">
        <button class="hollow-btn h-60px w-170px" @click="onReceiverPairClick">{{ $t('setting.pair24') }}</button>
        <button class="hollow-btn h-60px w-170px" @click="onFactoryResetClick">{{ $t('setting.restore') }}</button>
      </div>
      <!-- <RestoreFactoryModal></RestoreFactoryModal> -->
    </div>
    <OtaVersion :show="showVersion" :versioninfo="versionInfo" @update:show="showVersion = $event" @upgrade="upgrade" />
    <OtaProgress :show="showProgress" :progress="progress" @update:show="showProgress = $event" />
  </div>
</template>

<style scoped>
.hollow-btn {
  background-color: transparent;
  color: #3c8df4; /* 按钮文字颜色 */
  border: 1px solid #3c8df4; /* 边框颜色 */
  border-radius: 8px; /* 圆角边框 */
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.hollow-btn:hover {
  background-color: #3c8df4; /* 悬停时的背景颜色 */
  color: white; /* 悬停时文字颜色 */
}
.li-title {
  position: relative;
  text-align: left;
  font-size: 18px;
  padding-left: 8px; /* 给文本留出空间避免和线条重叠 */
  box-shadow: -4px 3px 0 0 #3c8df4; /* 创建蓝色竖线 */
}
</style>
