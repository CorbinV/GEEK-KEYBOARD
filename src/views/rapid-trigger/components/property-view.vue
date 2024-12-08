<script setup lang="ts">
import { ref, watch } from 'vue';
import { toRefs } from '@vueuse/core';
import { getPerf, setPerf } from '@/api/keyConfig-rapid-trigger';

import CircleShow from '@/components/custom/circle-show.vue';
import Slider from '@/components/custom/zw-slider.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { $t } from '@/locales';
import KeyMove from './key-move.vue';
export type Opetion = { key: number; label: string };

const EXE_DEAD_ZONE = 0;
const RAPID_TRIGGER_SWITCH = 1;
const DOWN_LMD_VALUE = 2;
const UP_LMD_VALUE = 3;
const BREAK_OPTIMIZE_SWITCH = 4;
const SHAKE_LEAVE = 5;
const RT_TOP_DEAD_ZONE = 6;
const RT_BELOW_DEAD_ZONE = 7;

const exeDeadZoneValue = ref<number>(0);
const rapidTiggerSwitch = ref<boolean>(false);
const downLMD = ref<number>(0);
const upLMD = ref<number>(0);
const breakOptimize = ref<boolean>(false);
const shakeLeaveValue = ref<number>(0);
const rtTopDeadValue = ref<number>(0);
const rtBelowDeadValue = ref<number>(0);

const showModal = ref(false);
const argShow = ref(true);
// const lmdLock = ref(true);
const selectedKey = ref<string[]>([]);

// const triggerPoint = ref(66);
const rateOption = ref();
const shakeOption = ref();
// const perf = ref<GetKeyPerf>;
// 正确的 ref 定义方式
const perfArr = ref<number[]>([0, 0, 0, 0, 0, 0, 0, 0]); // perfArr 应该是一个 Ref 类型
const curRate = ref({ key: 0, label: '' });
const curShake = ref({ key: 0, label: '' });
// const curRate = ref({});
const shakelayerLabel = [$t('repidTrigger.low'), $t('repidTrigger.medium'), $t('repidTrigger.high')];
const keyboardStore = useKeyboardStore();

function rateSelect(key: number) {
  curRate.value = rateOption.value.find((item: Opetion) => item.key === key);
  setPerfIndex(SHAKE_LEAVE, key);
  setDevPerf();
}
function shakeSelect(key: number) {
  curShake.value = shakeOption.value.find((item: Opetion) => item.key === key);
  setPerfIndex(SHAKE_LEAVE, key);
  setDevPerf();
}

function reset() {}
function lock() {}

// 传入索引，返回对应的数据项
function getPerfIndex(index: number) {
  if (index >= 0 && index < perfArr.value.length) {
    return perfArr.value[index]; // 根据索引获取数据
  }
  return 0; // 根据索引获取数据
}

function rapidSwitch(value: boolean) {
  const rapid = value ? 1 : 0;
  setPerfIndex(RAPID_TRIGGER_SWITCH, rapid);
  setDevPerf();
}
function breakOptimizeSwitch(value: boolean) {
  const rapid = value ? 1 : 0;
  setPerfIndex(BREAK_OPTIMIZE_SWITCH, rapid);
  setDevPerf();
}
// 滑动中事件处理
function downLmdValue(value: number) {
  setPerfIndex(DOWN_LMD_VALUE, value);
  setDevPerf();
}
function upLmdSlide(value: number) {
  setPerfIndex(UP_LMD_VALUE, value);
  setDevPerf();
}
function rtTopDeadSlide(value: number) {
  setPerfIndex(RT_TOP_DEAD_ZONE, value);
  setDevPerf();
}
function rtBelowDeadSlide(value: number) {
  setPerfIndex(RT_BELOW_DEAD_ZONE, value);
  setDevPerf();
}
function setPerfIndex(index: number, value: number) {
  perfArr.value[index] = value;
}

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

function setAxosome() {}
// 1. 创建一个 Apple 实例并使其响应式
async function getDevPerf() {
  const x = await getPerf();
  perfArr.value = x.tary;
  exeDeadZoneValue.value = getPerfIndex(EXE_DEAD_ZONE);
  rapidTiggerSwitch.value = getPerfIndex(RAPID_TRIGGER_SWITCH) === 1;
  breakOptimize.value = getPerfIndex(BREAK_OPTIMIZE_SWITCH) === 1;
  downLMD.value = getPerfIndex(DOWN_LMD_VALUE);
  upLMD.value = getPerfIndex(UP_LMD_VALUE);
  shakeLeaveValue.value = getPerfIndex(SHAKE_LEAVE);
  rtTopDeadValue.value = getPerfIndex(RT_TOP_DEAD_ZONE);
  rtBelowDeadValue.value = getPerfIndex(RT_BELOW_DEAD_ZONE);

  // // console.log(calibration.value);
  // // 当前最大轮询率
  // console.log('滑动中，当前值:', perfArr.value);
  // // rateOption.value = perf.value.rate.map(num => ({
  // //   key: num,
  // //   label: `${num / 1000}K`
  // // }));
  // curRate.value = rateOption.value.find((item: Opetion) => item.key === perf.value.curRate);
  // 当前防抖等级
  shakeOption.value = shakelayerLabel.map((label, index) => ({
    key: index,
    label
  }));
  curShake.value.label = shakelayerLabel[shakeLeaveValue.value];

  // // curShake.value = shakeOption.value.find((item: Opetion) => item.key === perf.value.shakeIndex);
}
async function setDevPerf() {
  const perf = { key: ['A', 'B'], tary: perfArr.value };
  console.log(perf);
  await setPerf(perf);

  //  await addOks({ code, keys, name });
}
getDevPerf();
</script>

<template>
  <div>
    <div class="flex-raw flex gap-30px bg-[#171619] p-20px">
      <div class="flex flex-col flex-1">
        <div class="flex-raw flex items-center justify-between border-b-1px border-[#232327] pb-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg">{{ $t('repidTrigger.showArg') }}</p>
          </div>

          <NSwitch v-model:value="argShow"></NSwitch>
        </div>
        <div class="flex-raw flex items-center justify-between border-b-1px border-[#232327] pb-10px pt-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg">{{ $t('repidTrigger.pollingRate') }}</p>
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

        <KeyMove></KeyMove>
        <div class="flex-raw mt-30px flex justify-between">
          <button class="hollow-btn h-60px w-170px font-[18px]" @click="reset">{{ $t('repidTrigger.reset') }}</button>
          <button
            class="h-60px w-170px rounded-md bg-[#3c8df4] text-[18px] c-white hover:bg-[#3c8df4]"
            @click="setAxosome"
          >
            {{ $t('repidTrigger.switchType') }}
          </button>
        </div>
      </div>

      <div class="border-l-1px border-[#232327]"></div>
      <div class="flex flex-col flex-1">
        <div class="flex-raw flex justify-between pb-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg text-#999999">{{ $t('repidTrigger.fastTrigger') }}</p>
          </div>

          <!-- <NSwitch v-model:value="perf.quick"></NSwitch> -->
          <NSwitch v-model:value="rapidTiggerSwitch" @update:value="rapidSwitch"></NSwitch>
        </div>
        <span class="... border-b-1px border-[#232327] pb-10px text-14px text-[#999]">
          {{ $t('repidTrigger.fastTriggerDesc') }}
        </span>
        <div class="flex-raw flex items-center pt-10px">
          <p class="vertical-bar"></p>
          <p class="... text-lg">{{ $t('repidTrigger.pressSensitivity') }}</p>
        </div>
        <span class="... text-14px text-[#999]">{{ $t('repidTrigger.pressSensitivityDesc') }}</span>
        <Slider v-model="downLMD" class="pt-10px" @stop-sliding="downLmdValue"></Slider>

        <div class="mt-10px flex flex-row items-center justify-center gap-5">
          <div class="h-1px w-20% bg-[#ccc]"></div>

          <i class="iconfont icon-add text-[30px] text-[#3c8df4]" @click="lock"></i>
          <div class="h-1px w-20% bg-[#ccc]"></div>
        </div>

        <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-lg">{{ $t('repidTrigger.liftSensitivity') }}</p>
        </div>
        <span class="... text-14px text-[#999]">{{ $t('repidTrigger.pressSensitivityDesc') }}</span>
        <Slider v-model="upLMD" class="pt-10px" @sliding="upLmdSlide"></Slider>
        <p class="... mt-10px pb-10px text-[#3C8DF4] underline underline-offset-4" @click="showModal = true">
          {{ $t('repidTrigger.advancedSettings') }}
        </p>

        <NModal v-model:show="showModal" class="h-500px w-34% rounded-[10px] bg-[#191b1d]">
          <div class="model-bg flex flex-col items-center p-30px text-[22px]">
            <p>{{ $t('repidTrigger.advancedSettings') }}</p>

            <p class="mt-40px w-100% text-[18px]">{{ $t('repidTrigger.rtTopDeadZone') }}</p>
            <Slider v-model="rtTopDeadValue" onsclass="mt-20px" @stop-sliding="rtTopDeadSlide"></Slider>

            <p class="mt-20px w-100% text-[18px]">{{ $t('repidTrigger.rtBellowDeadZone') }}</p>
            <Slider v-model="rtBelowDeadValue" class="mt-20px" @stop-sliding="rtBelowDeadSlide"></Slider>

            <div class="mt-30px flex flex-row justify-center gap-70px">
              <button class="hollow-btn h-60px w-170px font-[18px]" @click="showModal = false">
                {{ $t('businessCommon.cancel') }}
              </button>
              <button
                class="h-60px w-170px rounded-md bg-[#3c8df4] text-[18px] c-white hover:bg-[#3c8df4]"
                @click="showModal = false"
              >
                {{ $t('businessCommon.confirm1') }}
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
            <p class="... text-lg">{{ $t('repidTrigger.debounceOptimization') }}</p>
          </div>

          <NSwitch v-model:value="breakOptimize" @update:value="breakOptimizeSwitch"></NSwitch>
        </div>
        <div class="flex-raw back flex justify-between border-b-1px border-[#232327] pb-10px pt-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-lg">{{ $t('repidTrigger.debounceLevel') }}</p>
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
              {{ $t('repidTrigger.keyLevelIllustration') }}
              <span class="text-[14px] text-[#999999]">{{ $t('repidTrigger.keyLevelIllustration') }}</span>
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
