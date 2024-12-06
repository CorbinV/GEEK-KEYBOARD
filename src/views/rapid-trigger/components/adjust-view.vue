<script setup lang="ts">
import { ref } from 'vue';
import type { Calibration } from '@/api/modules/keyboard-rapid-trigger';
import { getCalibration } from '@/api/keyConfig-rapid-trigger';

const calibration = ref<Calibration>({ switch: false });

const bothwayAdjustSwitch = ref(false);
// const triggerPoint = ref(66);

function bothwayAdjust() {
  bothwayAdjustSwitch.value = !bothwayAdjustSwitch.value;
}
async function getConfig() {
  calibration.value = await getCalibration();
}

getConfig();
</script>

<template>
  <div>
    <div class="flex flex-col rounded-md bg-[#171619] p-30px">
      <!-- 修改标题的父容器，使用 flex 布局来居中 -->
      <div class="flex justify-center">
        <p class="text-[22px]">{{ $t('repidTrigger.dgzsxsszjz') }}</p>
      </div>

      <div class="flex-raw mt-20px flex justify-between flex-content-start">
        <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-lg">{{ $t('repidTrigger.doubleAdjust') }}</p>
        </div>
        <NSwitch v-model:value="calibration.switch" @click="bothwayAdjust"></NSwitch>
      </div>
      <p class="... mt-20px text-[16px] text-[#999999]">
        {{ $t('repidTrigger.doubleAdjustHint') }}
      </p>

      <div class="flex-raw mt-40px flex justify-between flex-content-start">
        <div class="flex-raw flex">
          <p class="vertical-bar"></p>
          <p class="... text-lg">{{ $t('repidTrigger.handAdjust') }}</p>
        </div>
        <button class="h-60px w-170px rounded-md bg-[#3c8df4] c-white hover:bg-[#3c8df4]">
          {{ $t('repidTrigger.startAdjust') }}
        </button>
      </div>

      <p class="... text-[16px] text-[#999999]">
        {{ $t('repidTrigger.handAdjustHint') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.vertical-bar {
  width: 4px;
  height: 18px;
  margin-right: 10px;
  background-color: #3c8df4; /* 按钮文字颜色 */
}

.hollow-btn {
  background-color: transparent;
  color: #3c8df4; /* 按钮文字颜色 */
  border: 1px solid #3c8df4; /* 边框颜色 */
  border-radius: 8px; /* 圆角边框 */
  padding: 10px 20px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}
.hollow-btn:hover {
  background-color: #3c8df4; /* 悬停时的背景颜色 */
  color: white; /* 悬停时文字颜色 */
}
</style>
