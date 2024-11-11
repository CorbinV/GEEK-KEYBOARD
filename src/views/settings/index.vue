<script setup lang="ts">
import { ref } from 'vue';

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

const onFactoryResetClick = () => {
  console.log('恢复出厂设置按钮被点击');
  // 这里可以加入恢复出厂设置的逻辑
};
// 处理全键无冲开关点击事件
const onFullKeyRolloverChange = (newValue: boolean) => {
  console.log('全键无冲切换状态:', newValue);
  // 在这里可以添加逻辑，比如同步到服务器或其他操作
};

// 处理感应唤醒开关点击事件
const onWakeUpSwitchChange = (newValue: boolean) => {
  console.log('感应唤醒切换状态:', newValue);
  // 在这里可以添加逻辑，比如同步到服务器或其他操作
};
</script>

<template>
  <!-- 引用 public 目录下的图片 -->
  <div class="h-full w-full flex flex-col items-center">
    <img src="/images/keyboard_img.png" alt="Logo" class="mt-50px h-324px w-804px" />

    <div class="mt-38px h-520px w-976px flex flex-col items-center rounded-md bg-[#171619] p-30px">
      <h1 class="text-[22px]">设备名称：NB999</h1>
      <!-- <div class="li-title">连接模式</div> -->

      <div class="h-66px w-full flex flex items-center justify-between border-b-1px border-[#232327] text-[18px]">
        连接模式
        <div>USB</div>
      </div>

      <div class="h-66px w-full flex items-center justify-between border-b-1px border-[#232327] text-[18px]">
        全键无冲
        <NSwitch v-model:value="fullKeyRolloverSwitch" @update:value="onFullKeyRolloverChange" />
      </div>
      <div class="h-110px w-full flex flex-col justify-between border-b-1px border-[#232327] pb-20px pt-20px">
        <div class="h-110px w-full flex justify-between text-[18px]">
          感应唤醒
          <NSwitch v-model:value="wakeUpSwitch" onupdate @update:value="onWakeUpSwitchChange" />
        </div>
        <div class="text-[16px] text-[#999]">
          电感轴可以感知双手是否离开键盘，从而进入低功耗模式，当双手靠近键盘时立即唤醒键盘，从而达到降低功耗，和极大的续航
        </div>
      </div>
      <div
        class="flex-raw h-110px w-full flex justify-between border-b-1px border-[#232327] pb-20px pt-20px text-[18px]"
      >
        <div class="flex flex-col">
          <div>固件更新</div>
          <p class="mt-20px text-[16px] text-[#999]">{{ versionCode }}</p>
        </div>
        <button class="h-60px w-170px rounded-md bg-[#3c8df4] c-white hover:bg-[#3c8df4]" @click="onCheckUpdateClick">
          检查更新
        </button>
      </div>
      <div class="flex-raw w-full flex justify-between rounded-md pb-20px pt-20px">
        <button class="hollow-btn h-60px w-170px" @click="onReceiverPairClick">2.4g接收器配对</button>
        <button class="hollow-btn h-60px w-170px" @click="onFactoryResetClick">恢复出厂设置</button>
      </div>
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

.li-title {
  position: relative;
  text-align: left;
  font-size: 18px;
  padding-left: 8px; /* 给文本留出空间避免和线条重叠 */
  box-shadow: -4px 3px 0 0 #3c8df4; /* 创建蓝色竖线 */
}
.hollow-btn:hover {
  background-color: #3c8df4; /* 悬停时的背景颜色 */
  color: white; /* 悬停时文字颜色 */
}
</style>
