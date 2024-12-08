<script setup lang="ts">
import { ref } from 'vue';
import { getKeyboardSetting } from '@/api/keyConfig-setting';
import keyboardImg from '@/assets/img/keyboard_img.png';
// import RestoreFactoryModal from '@/views/settings/components/reset-modal.vue';

async function getSet() {
  const x = await getKeyboardSetting();
  console.log(x);
}
const versionCode = ref('1.2.0');
const fullKeyRolloverSwitch = ref(true);
const wakeUpSwitch = ref(true);

const onCheckUpdateClick = () => {
  console.log('检查更新按钮被点击');
  // 这里可以加入更新检查的逻辑
};

const onReceiverPairClick = () => {
  console.log('2.4g接收器配对按钮被点击');
  // 这里可以加入接收器配对的逻辑
};
function getVersion() {}
const onFactoryResetClick = () => {
  console.log('恢复出厂设置按钮被点击');
  // 这里可以加入恢复出厂设置的逻辑
};

// async function setWakeup() {
//   const x = await getKeyboardSetting();
//   console.log(x);
// }
// 处理全键无冲开关点击事件
const onFullKeyRolloverChange = (newValue: boolean) => {
  console.log('全键无冲切换状态:', newValue);
  setDevPerf();
};

// 处理感应唤醒开关点击事件
const onWakeUpSwitchChange = (newValue: boolean) => {
  console.log('感应唤醒切换状态:', newValue);
  setDevPerf();
  // 在这里可以添加逻辑，比如同步到服务器或其他操作
};
async function setDevPerf() {
  // await getKeyboardSetting({ allKey: 1, wakeUp: 1 });
  //  await addOks({ code, keys, name });
}

getVersion();
getSet();
</script>

<template>
  <!-- 引用 public 目录下的图片 -->
  <div class="h-full w-full flex flex-col items-center">
    <img :src="keyboardImg" alt="Logo" class="mt-50px h-324px w-804px" />

    <div class="mt-38px h-520px w-976px flex flex-col items-center rounded-md bg-[#171619] p-30px">
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
          <div>{{ $t('setting.gjUpdate') }}</div>
          <p class="mt-20px text-[16px] text-[#999]">{{ versionCode }}</p>
        </div>
        <button class="h-60px w-170px rounded-md bg-[#3c8df4] c-white hover:bg-[#3c8df4]" @click="onCheckUpdateClick">
          {{ $t('setting.checkUpdate') }}
        </button>
      </div>
      <div class="flex-raw w-full flex justify-between rounded-md pb-20px pt-20px">
        <button class="hollow-btn h-60px w-170px" @click="onReceiverPairClick">{{ $t('setting.pair24') }}</button>
        <button class="hollow-btn h-60px w-170px" @click="onFactoryResetClick">{{ $t('setting.restore') }}</button>
      </div>
      <!-- <RestoreFactoryModal></RestoreFactoryModal> -->
    </div>
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
