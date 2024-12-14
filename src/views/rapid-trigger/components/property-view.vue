<script setup lang="ts">
import { ref, watch } from 'vue';
import { toRefs } from '@vueuse/core';
// import { getPerf, getRate, setPerf, setRate } from '@/api/keyConfig-rapid-trigger';
import useConver from '@/utils/conver';
import { getRate, setPerf, setRate } from '@/api/keyConfig-rapid-trigger';
import { useCommonStore } from '@/store/modules/common';

import CircleShow from '@/components/custom/circle-show.vue';
import Slider from '@/components/custom/zw-slider.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { $t } from '@/locales';
// import { getComboList } from '@/api/combo';
import KeyMove from './key-move.vue';
const { triggerToPage, PageToTrigger, sensitivityToPage, PageToSensitivity } = useConver();
export type Opetion = { key: number; label: string };
const commonStore = useCommonStore();
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
const curKey = ref<string>('');

const showModal = ref(false);
const argShow = ref(true);
const lmdLock = ref(true);
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
  console.log(key);
  // curShake.value = shakeOption.value.find((item: Opetion) => item.key === key);
  const index = rateOption.value.findIndex((item: { key: number }) => item.key === key);

  curRate.value = rateOption.value[index];
  setPerfIndex(SHAKE_LEAVE, index);
  console.log(index);
  setPerfIndex(SHAKE_LEAVE, key);

  setRate({ index });
}
function shakeSelect(key: number) {
  console.log(key);
  // curShake.value = shakeOption.value.find((item: Opetion) => item.key === key);
  const index = shakeOption.value.findIndex((item: { key: number }) => item.key === key);
  curShake.value = shakeOption.value[index];
  setPerfIndex(SHAKE_LEAVE, index);
  setDevPerf();
}

function reset() {}
function lock() {
  lmdLock.value = !lmdLock.value;
  console.log(lmdLock.value);
}

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

function upLmdSlideUpdate(value: number) {
  if (lmdLock.value) {
    downLMD.value = value;
  }
}
function downLmdSlideUpdate(value: number) {
  if (lmdLock.value) {
    upLMD.value = value;
  }
}
// function convertValue(x: number, min = 0.01, max = 3) {
//   return Math.ceil(1 + ((x - min) / (max - min)) * (255 - 1));
// }
function rtTopDeadSlide(value: number) {
  setPerfIndex(RT_TOP_DEAD_ZONE, Number(PageToSensitivity(value)));
  setDevPerf();
}
function rtBelowDeadSlide(value: number) {
  setPerfIndex(RT_BELOW_DEAD_ZONE, Number(PageToSensitivity(value)));
  setDevPerf();
}
function setPerfIndex(index: number, value: number) {
  perfArr.value[index] = value;
}

const { selectedKeys } = toRefs(keyboardStore);

watch(
  () => selectedKeys.value,

  // (nLength, oLength) => {
  nLength => {
    setTimeout(() => {
      Object.keys(selectedKeys.value).forEach(key => {
        const val = selectedKeys.value[key];
        console.log('11111111111', selectedKeys.value);

        if (val?.base) {
          // const base = val.base.key;
          // selectedKey.value.push('7');
          // console.log(base);
          Object.entries(nLength).forEach(([newKey]) => {
            commonStore.getTargetKeyInfo(newKey).then(data => {
              Object.entries(nLength).forEach(([keykey]) => {
                // console.log(`键: ${keykey}, 值: ${value}`);
                curKey.value = keykey;
              });
              getDevPerf(data.tary);
              console.log('22222222222 ', data.tary);
              // curKey.value = data.getDevPerf();
            });
            // getDevPerf({ key: newKey });
          });
        } else {
          selectedKey.value.length = 0;
        }
      });
    }, 100);
  }
);

// function setAxosome() {}
// 1. 创建一个 Apple 实例并使其响应式
// async function getDevPerf(data: { key: string }) {
async function getDevPerf(tary: number[]) {
  // console.log(11111111);
  // console.log(data);
  //  const x = await getPerf(data);
  perfArr.value = tary;

  rapidTiggerSwitch.value = getPerfIndex(RAPID_TRIGGER_SWITCH) === 1;
  breakOptimize.value = getPerfIndex(BREAK_OPTIMIZE_SWITCH) === 1;
  //  exeDeadZoneValue.value = getPerfIndex(EXE_DEAD_ZONE) / Math.ceil(255 / 35);
  exeDeadZoneValue.value = Number(triggerToPage(getPerfIndex(EXE_DEAD_ZONE)));

  downLMD.value = Math.ceil(getPerfIndex(DOWN_LMD_VALUE) / 30) / 10;
  upLMD.value = Math.ceil(getPerfIndex(UP_LMD_VALUE) / 30) / 10;
  downLMD.value = Number(sensitivityToPage(getPerfIndex(DOWN_LMD_VALUE)));
  upLMD.value = Number(sensitivityToPage(getPerfIndex(UP_LMD_VALUE)));

  shakeLeaveValue.value = getPerfIndex(SHAKE_LEAVE);
  // rtTopDeadValue.value = Math.ceil(getPerfIndex(RT_TOP_DEAD_ZONE) / 30) / 10;
  // rtBelowDeadValue.value = Math.ceil(getPerfIndex(RT_BELOW_DEAD_ZONE) / 30) / 10;

  rtTopDeadValue.value = Number(sensitivityToPage(getPerfIndex(RT_TOP_DEAD_ZONE)));
  rtBelowDeadValue.value = Number(sensitivityToPage(getPerfIndex(RT_BELOW_DEAD_ZONE)));
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
  const perf = { key: [curKey.value], tary: perfArr.value };
  console.log('2222222222222222', perf.tary);

  await setPerf(perf);

  //  await addOks({ code, keys, name });
}

function exeDeadSlidingStop(value: number) {
  console.log('2222222222222222', value);
  // const xxx = Math.floor((value * 10 * 255) / 35);
  const xxx = PageToTrigger(value);
  console.log('2222222222222222', xxx);
  setPerfIndex(EXE_DEAD_ZONE, Number(xxx));
  setDevPerf();
}

// 滑动中事件处理
function downLmdValue(value: number) {
  console.log('11111111111', value);
  const xxx = Number(PageToSensitivity(value));
  console.log('11111111111', xxx);

  // setPerfIndex(EXE_DEAD_ZONE, Number(xxx));
  setPerfIndex(DOWN_LMD_VALUE, xxx);
  if (lmdLock.value) {
    setPerfIndex(UP_LMD_VALUE, xxx);
  }
  setDevPerf();
}
function upLmdSlide(value: number) {
  const xxx = Number(PageToSensitivity(value));
  setPerfIndex(UP_LMD_VALUE, xxx);
  if (lmdLock.value) {
    setPerfIndex(DOWN_LMD_VALUE, xxx);
  }

  setDevPerf();
}
async function getDevRate() {
  const data = await getRate();
  const rate = data.rate;
  const index = data.index;
  rateOption.value = rate.map(num => ({
    key: num,
    label: `${num / 1000}K`
  }));
  curRate.value = rateOption.value[index];
}
// getComboList();
// getDevPerf({ key: 'G' });
getDevRate();
</script>

<template>
  <div>
    <div class="flex-raw w-full flex gap-30px bg-[#171619] p-20px">
      <div class="flex flex-col flex-1">
        <div class="flex-raw flex items-center justify-between border-b-1px border-[#232327] pb-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-18px">{{ $t('repidTrigger.showArg') }}</p>
          </div>

          <NSwitch v-model:value="argShow"></NSwitch>
        </div>
        <div class="flex-raw flex items-center justify-between border-b-1px border-[#232327] pb-10px pt-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-18px">{{ $t('repidTrigger.pollingRate') }}</p>
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

        <KeyMove v-model="exeDeadZoneValue" @stop-sliding="exeDeadSlidingStop"></KeyMove>
        <div class="flex-raw flex justify-center">
          <button class="hollow-btn h-60px w-170px font-[18px]" @click="reset">{{ $t('repidTrigger.reset') }}</button>
          <!--
 <button
            class="h-60px w-170px rounded-md bg-[#3c8df4] text-[18px] c-white hover:bg-[#3c8df4]"
            @click="setAxosome"
          >
            {{ $t('repidTrigger.switchType') }}
          </button>
-->
        </div>
      </div>

      <div class="border-l-1px border-[#232327]"></div>
      <div class="flex flex-col flex-1">
        <div class="flex-raw flex justify-between pb-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-18px text-#999999">{{ $t('repidTrigger.fastTrigger') }}</p>
          </div>

          <!-- <NSwitch v-model:value="perf.quick"></NSwitch> -->
          <NSwitch v-model:value="rapidTiggerSwitch" @update:value="rapidSwitch"></NSwitch>
        </div>
        <span class="... border-b-1px border-[#232327] pb-10px text-14px text-[#999]">
          {{ $t('repidTrigger.fastTriggerDesc') }}
        </span>
        <div class="flex-raw flex items-center pt-10px">
          <p class="vertical-bar"></p>
          <p class="... text-18px">{{ $t('repidTrigger.pressSensitivity') }}</p>
        </div>
        <span class="... text-14px text-[#999]">{{ $t('repidTrigger.pressSensitivityDesc') }}</span>
        <Slider
          :model-value="downLMD"
          class="pt-10px"
          @update:model-value="downLmdSlideUpdate"
          @stop-sliding="downLmdValue"
        ></Slider>

        <div class="mt-10px flex flex-row items-center justify-center gap-5">
          <div class="h-1px w-20% bg-[#ccc]"></div>

          <i
            class="iconfont icon-container text-[25px] text-[#fff]"
            :class="lmdLock ? 'icon-lock-solid' : 'icon-unlock-solid'"
            @click="lock"
          ></i>
          <div class="h-1px w-20% bg-[#ccc]"></div>
        </div>

        <div class="flex-raw flex items-center">
          <p class="vertical-bar"></p>
          <p class="... text-18px">{{ $t('repidTrigger.liftSensitivity') }}</p>
        </div>
        <span class="... text-14px text-[#999]">{{ $t('repidTrigger.pressSensitivityDesc') }}</span>
        <Slider
          :model-value="upLMD"
          class="pt-10px"
          @update:model-value="upLmdSlideUpdate"
          @stop-sliding="upLmdSlide"
        ></Slider>
        <p class="... mt-20px pb-10px text-[#3C8DF4] underline underline-offset-4" @click="showModal = true">
          {{ $t('repidTrigger.advancedSettings') }}
        </p>

        <NModal v-model:show="showModal" class="h-500px w-34% rounded-[10px] bg-[#191b1d]">
          <div class="model-bg flex flex-col items-center p-30px text-[22px]">
            <p>{{ $t('repidTrigger.advancedSettings') }}</p>

            <p class="mt-40px w-100% text-[18px]">{{ $t('repidTrigger.rtTopDeadZone') }}</p>
            <Slider v-model="rtTopDeadValue" onsclass="mt-20px" @stop-sliding="rtTopDeadSlide"></Slider>

            <p class="mt-20px w-100% text-[18px]">{{ $t('repidTrigger.rtBellowDeadZone') }}</p>
            <Slider v-model="rtBelowDeadValue" class="mt-20px" @stop-sliding="rtBelowDeadSlide"></Slider>

            <div class="mt-88px flex flex-row justify-center gap-70px">
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
            <p class="... text-18px">{{ $t('repidTrigger.debounceOptimization') }}</p>
          </div>

          <NSwitch v-model:value="breakOptimize" @update:value="breakOptimizeSwitch"></NSwitch>
        </div>
        <div class="flex-raw back flex justify-between border-b-1px border-[#232327] pb-10px pt-10px">
          <div class="flex-raw flex items-center">
            <p class="vertical-bar"></p>
            <p class="... text-18px">{{ $t('repidTrigger.debounceLevel') }}</p>
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
            <p class="... text-18px">
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
.icon-container {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background-color: #3c8df480;
  cursor: pointer;
}

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
