<script setup lang="ts">
import { ref, watch } from 'vue';
import { toRefs } from '@vueuse/core';
import { getPerf } from '@/api/keyConfig-rapid-trigger';
import type { SetKeyPerf } from '@/api/modules/keyboard-rapid-trigger';
import CircleShow from '@/components/custom/circle-show.vue';
import Slider from '@/components/custom/zw-slider.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';

export type Opetion = { key: number; label: string };
const argShow = ref(true);
const showModal = ref(false);
const lmdLock = ref(true);
const selectedKey = ref<string[]>([]);
const sliderValue = ref(33);
// const triggerPoint = ref(66);
const rateOption = ref();
const shakeOption = ref();
const perf = ref<SetKeyPerf>({ actDeadZone: [0, 0] } as SetKeyPerf);

const curRate = ref({ key: 0, label: '' });
const curShake = ref({ key: 0, label: '' });
// const curRate = ref({});
const shakelayer = ['低', '中', '高'];
const keyboardStore = useKeyboardStore();

function rateSelect(key: number) {
  curRate.value = rateOption.value.find((item: Opetion) => item.key === key);
}
function shakeSelect(key: number) {
  curShake.value = shakeOption.value.find((item: Opetion) => item.key === key);
}

function reset() {}
function lock() {}

const { selectedKeys } = toRefs(keyboardStore);
watch(
  () => selectedKeys.value,
  (nLength, oLength) => {
    Object.keys(selectedKeys.value).forEach(key => {
      const val = selectedKeys.value[key];
      console.log(selectedKeys.value);

      if (val?.base) {
        // const base = val.base.key;
        // selectedKey.value.push('7');
        // console.log(base);
        console.log(nLength);
        console.log(oLength);
      } else {
        selectedKey.value.length = 0;
      }
    });
  }
);

// 滑动中事件处理
const onSliding = (value: number) => {
  if (lmdLock.value) {
    console.log('滑动中，当前值:', value);
  } else {
    console.log('滑动中，当前值:', value);
  }
};
function setAxosome() {}
// 1. 创建一个 Apple 实例并使其响应式
async function getPerf1() {
  perf.value = await getPerf();
  // console.log(calibration.value);
  // 当前最大轮询率
  rateOption.value = perf.value.rate.map(num => ({
    key: num,
    label: `${num / 1000}K`
  }));
  curRate.value = rateOption.value.find((item: Opetion) => item.key === perf.value.curRate);
  // 当前防抖等级
  shakeOption.value = shakelayer.map((label, index) => ({
    key: index,
    label
  }));

  curShake.value = shakeOption.value.find((item: Opetion) => item.key === perf.value.shakeIndex);
}
getPerf1();
</script>

<template>
  <div>
    <div class="flex-raw flex gap-30px bg-[#171619] p-20px">
      <div class="flex flex-col flex-1">
        <div class="flex-raw flex items-center justify-between border-b-1px border-[#232327] pb-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg">显示参数</p>
          </div>

          <NSwitch v-model:value="argShow"></NSwitch>
        </div>
        <div class="flex-raw flex items-center justify-between border-b-1px border-[#232327] pb-10px pt-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg">轮询率</p>
          </div>

          <NDropdown
            :options="rateOption"
            class="h-40px w-100px"
            placement="bottom-start"
            trigger="click"
            @select="rateSelect"
          >
            <NButton class="h-40px w-100px bg-[#222227]">{{ curRate.label }}</NButton>
          </NDropdown>
        </div>

        <div class="flex-raw flex items-center pt-10px">
          <p class="vertical-bar"></p>
          <p class="... text-lg">触发死区</p>
          <!-- <p class="... text-[14px] text-#999999">（ 死区为0时，轻微抖动就会触发，设置请谨慎）</p> -->
        </div>

        <Slider v-model="sliderValue" class="mt-10px"></Slider>
        <div class="flex-raw flex items-center pt-10px">
          <p class="vertical-bar"></p>
          <p class="... text-lg">抬起死区</p>
          <!-- <p class="... text-[14px] text-#999999">（ 死区为0时，轻微抖动就会触发，设置请谨慎）</p> -->
        </div>
        <Slider v-model="sliderValue" class="mt-10px"></Slider>
        <div class="flex-raw mt-30px flex justify-between">
          <button class="hollow-btn h-60px w-170px font-[18px]" @click="reset">重置</button>
          <button
            class="h-60px w-170px rounded-md bg-[#3c8df4] text-[18px] c-white hover:bg-[#3c8df4]"
            @click="setAxosome"
          >
            设置轴体
          </button>
        </div>
      </div>

      <div class="border-l-1px border-[#232327]"></div>
      <div class="flex flex-col flex-1">
        <div class="flex-raw flex justify-between pb-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg text-#999999">开启快速触发</p>
          </div>

          <NSwitch v-model:value="perf.quick"></NSwitch>
        </div>
        <span class="... border-b-1px border-[#232327] pb-10px text-14px text-[#999]">
          通过设置触发行程，只需按压抬起一定程度即可反复触发按键，达到快速触发效果
        </span>
        <div class="flex-raw flex items-center pt-10px">
          <p class="vertical-bar"></p>
          <p class="... text-lg">触发（按下）灵敏度</p>
        </div>
        <span class="... text-14px text-[#999]">（设置过高的精度，可能回导致手指按压时，细微的晃动而被认定抬起）</span>
        <Slider v-model="sliderValue" class="pt-10px" @sliding="onSliding"></Slider>

        <div class="mt-10px flex flex-row items-center justify-center gap-5">
          <div class="h-1px w-20% bg-[#ccc]"></div>

          <i class="iconfont icon-add text-[30px] text-[#3c8df4]" @click="lock"></i>
          <div class="h-1px w-20% bg-[#ccc]"></div>
        </div>

        <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-lg">抬起（重置）灵敏度</p>
        </div>
        <span class="... text-14px text-[#999]">（设置过高的精度，可能回导致手指按压时，细微的晃动而被认定抬起）</span>
        <Slider v-model="sliderValue" class="pt-10px" @sliding="onSliding"></Slider>
        <p class="... mt-10px pb-10px text-[#3C8DF4] underline underline-offset-4" @click="showModal = true">
          高级设置
        </p>

        <NModal v-model:show="showModal" class="h-500px w-34% rounded-[10px] bg-[#191b1d]">
          <div class="model-bg flex flex-col items-center p-30px text-[22px]">
            <p>高级设置</p>
            <!--
 <div class="mt-20px w-100% flex flex-row justify-between text-[18px]">
              <p>单独设置抬起按下灵敏度</p>
              <NSwitch></NSwitch>
            </div>
-->
            <p class="mt-40px w-100% text-[18px]">RT顶部死区</p>
            <Slider v-model="sliderValue" class="mt-20px"></Slider>

            <p class="mt-20px w-100% text-[18px]">RT底部死区</p>
            <Slider v-model="sliderValue" class="mt-20px"></Slider>

            <div class="mt-30px flex flex-row justify-center gap-70px">
              <button class="hollow-btn h-60px w-170px font-[18px]" @click="showModal = false">取消</button>
              <button
                class="h-60px w-170px rounded-md bg-[#3c8df4] text-[18px] c-white hover:bg-[#3c8df4]"
                @click="showModal = false"
              >
                确定
              </button>
            </div>
          </div>
        </NModal>
      </div>
      <div class="border-l-1px border-[#232327]"></div>
      <div class="flex flex-col flex-1">
        <div class="flex-raw flex justify-between border-b-1px border-[#232327] pb-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg">断触优化</p>
          </div>

          <NSwitch v-model:value="perf.breakOptimize"></NSwitch>
        </div>
        <div class="flex-raw back flex justify-between border-b-1px border-[#232327] pb-10px pt-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg">防抖等级</p>
          </div>

          <NDropdown
            :options="shakeOption"
            class="h-40px w-100px"
            placement="bottom-start"
            trigger="click"
            @select="shakeSelect"
          >
            <NButton class="h-40px w-100px bg-[#222227]">{{ curShake.label }}</NButton>
          </NDropdown>
        </div>
        <div class="flex-raw flex justify-between pb-10px pt-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg">
              按键级数示意
              <span class="text-[14px] text-[#999999]">（示意非精准显示，仅供参考）</span>
            </p>
          </div>
        </div>
        <div class="w-100%">
          <CircleShow></CircleShow>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --primary-color: #3c8df4;
  --background-color: #171619;
  --border-color: #232327;
  --text-color: #999999;
}

.vertical-bar {
  width: 4px;
  height: 18px;
  margin-right: 10px;
  background-color: #3c8df4; /* 按钮文字颜色 */
}
:root {
  --primary-color: #3c8df4;
  --background-color: #171619;
  --border-color: #232327;
  --text-color: #999999;
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
