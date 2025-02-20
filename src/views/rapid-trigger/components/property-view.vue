<script setup lang="ts">
import { ref, watch } from 'vue';
import { toRefs } from '@vueuse/core';
import { useMessage } from 'naive-ui';
import useConver from '@/utils/conver';
import { getRate, setRate } from '@/api/keyConfig-rapid-trigger';
import { useCommonStore } from '@/store/modules/common';

import CircleShow from '@/components/custom/circle-show.vue';
import Slider from '@/components/custom/zw-slider.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';

import { $t } from '@/locales';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import GroupTitle from './group-title.vue';
import KeyMove from './key-move.vue';
const { triggerToPage, PageToTrigger, sensitivityToPage, PageToSensitivity } = useConver();
export type Opetion = { key: number; label: string };

const commonStore = useCommonStore();
const keyboardStore = useKeyboardStore();
const { showKeyParams, selectedKeys, selectedKeysMap } = toRefs(keyboardStore);

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
const timeoutId = ref();

const showModal = ref(false);
const lmdLock = ref(true);
const isLoading = ref(false);
const selectedKey = ref<string[]>([]);
type RateOption = {
  key: number;
  label: string;
  disabled?: boolean;
}
const rateCtrl = ref<{
  val: RateOption;
  ops: RateOption[];
  idx: number;
}>({
  ops: [],
  val: {} as RateOption,
  idx: 0,
})
const shakeOption = ref();
// const perf = ref<GetKeyPerf>;
// 正确的 ref 定义方式
const perfArr = ref<number[]>([0, 0, 0, 0, 0, 0, 0, 0]); // perfArr 应该是一个 Ref 类型
const curRate = ref({ key: 0, label: '' });
const curShake = ref({ key: 0, label: '' });
// const curRate = ref({});
const shakelayerLabel = [$t('repidTrigger.low'), $t('repidTrigger.medium'), $t('repidTrigger.high')];
const message = useMessage();
function rateSelect(key: number) {
  console.log(key);
  // curShake.value = shakeOption.value.find((item: Opetion) => item.key === key);
  const index = rateCtrl.value.ops.findIndex((item: { key: number }) => item.key === key);

  curRate.value = rateCtrl.value.ops[index];
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

// function reset() {}
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
emitter.on(EventNameEnum.selecteAll, () => { });
const showMask = ref(true);
watch(
  () => selectedKeysMap.value.size,
  len => {
    if (len > 0) {
      showMask.value = false;
    } else {
      showMask.value = true;
    }
    selectedKey.value = Object.keys(selectedKeys.value);

    Object.entries(selectedKeysMap.value).forEach(([newKey]) => {
      commonStore.getTargetKeyInfo(newKey).then(data => {
        if (newKey === '0') {
          // 如果需要遍历某个数据结构中的键
          Object.entries(data).forEach(([keykey]) => {
            curKey.value = keykey; // 这里的赋值可能是要处理 `keykey`
          });
          getDevPerf(data.tary); // 假设的功能调用
        }
      });
    });
  }
);
// watch(
//   () => selectedKeys.value,
//       console.log('11111111111', Object.keys(selectedKeys.value));

//   // (nLength, oLength) => {
//   nLength => {
//     setTimeout(() => {

//       Object.keys(selectedKeys.value).forEach(key => {
//         const val = selectedKeys.value[key];
//         console.log('11111111111', selectedKeys.value);

//         if (val?.base) {
//           // const base = val.base.key;
//           // selectedKey.value.push('7');
//           // console.log(base);
//           Object.entries(nLength).forEach(([newKey]) => {
//             commonStore.getTargetKeyInfo(newKey).then(data => {
//               Object.entries(nLength).forEach(([keykey]) => {
//                 // console.log(`键: ${keykey}, 值: ${value}`);
//                 curKey.value = keykey;
//               });
//               getDevPerf(data.tary);
//               console.log('22222222222 ', data.tary);
//               // curKey.value = data.getDevPerf();
//             });
//             // getDevPerf({ key: newKey });
//           });
//         } else {
//           selectedKey.value.length = 0;
//         }
//       });
//     }, 100);
//   }
// );

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
  exeDeadZoneValue.value = Number(triggerToPage(getPerfIndex(EXE_DEAD_ZONE)));

  downLMD.value = Number(sensitivityToPage(getPerfIndex(DOWN_LMD_VALUE)));
  upLMD.value = Number(sensitivityToPage(getPerfIndex(UP_LMD_VALUE)));

  shakeLeaveValue.value = getPerfIndex(SHAKE_LEAVE);

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
}
async function setDevPerf() {
  isLoading.value = true;

  timeoutId.value = setTimeout(() => {
    isLoading.value = false;
    message.error('写入失败', {
      duration: 2000 // 持续时间
    });
  }, 3000);
  const sendData = selectedKey.value.map((key) => {
    return {
      key: key,
      tary: perfArr.value
    }
  })
  await commonStore.setKeyInfoByList(sendData)
  emitter.emit(EventNameEnum.updateKeyCtrl, selectedKey.value[0]);
  isLoading.value = false;

  if (timeoutId.value) {
    clearTimeout(timeoutId.value); // 清除之前的定时器
  }

  //  await addOks({ code, keys, name });
}

function exeDeadSlidingStop(value: number) {
  const deadValue = PageToTrigger(value);
  setPerfIndex(EXE_DEAD_ZONE, Number(deadValue));
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
// 滑动中事件处理
function downLmdValue(value: number) {
  const downValue = Number(PageToSensitivity(value));

  setPerfIndex(DOWN_LMD_VALUE, downValue);
  if (lmdLock.value) {
    upLMD.value = value;
    setPerfIndex(UP_LMD_VALUE, upLMD.value);
  }
  setDevPerf();
}
function upLmdSlide(value: number) {
  const upValue = Number(PageToSensitivity(value));
  setPerfIndex(UP_LMD_VALUE, upValue);
  if (lmdLock.value) {
    downLMD.value = value;
    setPerfIndex(DOWN_LMD_VALUE, downLMD.value);
  }

  setDevPerf();
}
async function getDevRate() {
  try {
    const data = await getRate();
    const rate = data.rate;
    const index = data.index;
    rateCtrl.value.ops = rate.map(num => ({
      key: num,
      label: `${num / 1000}K`
    }));
    rateCtrl.value.val = rateCtrl.value.ops[index];
  } catch (error) {
    rateCtrl.value.ops = [{
      key: 0,
      label: $t('businessCommon.temporaryUnavailable'),
      disabled: true
    }]
    window.$log!.error('Catch Error when get Device Rate', error);
  }
}
// getComboList();
// getDevPerf({ key: 'G' });
getDevRate();

function handleMaskClick(e: MouseEvent) {
  if (!showMask.value) {
    return
  }
  const targetElement = (e.target as Element).closest('[data-tag]');
  if (!targetElement) {
    window?.$message!.info($t('businessCommon.btnSelectRequired'))
  }
}
</script>

<template>
  <div>
    <NSpin :show="isLoading">
      <div class="w-full" :class="{
        mask: showMask
      }" @click.prevent="handleMaskClick">
        <div class="flex-raw box-border w-full flex gap-30px bg-[#171619] p-20px">
          <div class="flex flex-col flex-1 gap-y-10px">
            <GroupTitle :title="$t('repidTrigger.showArg')" class="z-60" data-tag="showArg">
              <template #end>
                <NSwitch v-model:value="showKeyParams"></NSwitch>
              </template>
            </GroupTitle>
            <GroupTitle :title="$t('repidTrigger.pollingRate')" class="z-60" data-tag="pollingRate">
              <template #end>
                <NDropdown :options="rateCtrl.ops" class="h-40px w-100px asd2222222 !cursor-not-allowed"
                  placement="bottom-start" trigger="click" @select="rateSelect">
                  <NButton class="h-40px w-100px bg-[#222227]">{{ curRate.label }}</NButton>
                </NDropdown>
              </template>
            </GroupTitle>
            <GroupTitle :title="$t('repidTrigger.exeDistance')" :show-bottom-line="false" />
            <KeyMove v-model="exeDeadZoneValue" @stop-sliding="exeDeadSlidingStop"></KeyMove>
          </div>

          <div class="border-l-1px border-[#232327]"></div>

          <div class="flex-1">
            <div class="flex flex-col">
              <GroupTitle :title="$t('repidTrigger.fastTrigger')" :show-bottom-line="false">
                <template #end>
                  <NSwitch v-model:value="rapidTiggerSwitch" @update:value="rapidSwitch"></NSwitch>
                </template>
              </GroupTitle>
              <span class="border-b-1px border-[#232327] pb-10px text-14px text-[#999]">
                {{ $t('repidTrigger.fastTriggerDesc') }}
              </span>
              <GroupTitle :title="$t('repidTrigger.pressSensitivity')" :show-bottom-line="false"></GroupTitle>
              <span class="text-14px text-[#999]">{{ $t('repidTrigger.pressSensitivityDesc') }}</span>
              <Slider :model-value="downLMD" class="pt-10px" @update:model-value="downLmdSlideUpdate"
                @stop-sliding="downLmdValue"></Slider>

              <div class="mt-10px flex flex-row items-center justify-center gap-5">
                <div class="h-1px w-20% bg-[#ccc]"></div>

                <i class="iconfont icon-container text-[25px] text-[#fff]"
                  :class="lmdLock ? 'icon-lock-solid' : 'icon-unlock-solid'" @click="lock"></i>
                <div class="h-1px w-20% bg-[#ccc]"></div>
              </div>
              <GroupTitle :title="$t('repidTrigger.liftSensitivity')" :show-bottom-line="false">
                <template #end>
                  <NSwitch v-model:value="rapidTiggerSwitch" @update:value="rapidSwitch"></NSwitch>
                </template>
              </GroupTitle>
              <span class="text-14px text-[#999]">{{ $t('repidTrigger.pressSensitivityDesc') }}</span>
              <Slider :model-value="upLMD" class="pt-10px" @update:model-value="upLmdSlideUpdate"
                @stop-sliding="upLmdSlide">
              </Slider>
              <p class="mt-20px pb-10px text-[#3C8DF4] underline underline-offset-4 hover:cursor-pointer"
                @click="showModal = true">
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
                    <button class="h-60px w-170px rounded-md bg-[#3c8df4] text-[18px] c-white hover:bg-[#3c8df4]"
                      @click="showModal = false">
                      {{ $t('businessCommon.confirm1') }}
                    </button>
                  </div>
                </div>
              </NModal>
            </div>
          </div>
          <div class="border-l-1px border-[#232327]"></div>
          <div class="flex flex-col flex-1 gap-y-10px">
            <GroupTitle :title="$t('repidTrigger.debounceOptimization')">
              <template #end>
                <NSwitch v-model:value="breakOptimize" @update:value="breakOptimizeSwitch"></NSwitch>
              </template>
            </GroupTitle>
            <GroupTitle :title="$t('repidTrigger.debounceLevel')">
              <template #end>
                <NDropdown :options="shakeOption" class="h-40px w-100px" placement="bottom-start" trigger="click"
                  @select="shakeSelect">
                  <NButton class="h-40px w-100px bg-[#222227]">{{ curShake.label }}</NButton>
                </NDropdown>
              </template>
            </GroupTitle>
            <GroupTitle :title="$t('repidTrigger.keyLevelIllustration')"
              :sub-title="$t('repidTrigger.keyLevelIllustration')">
              <template #end>
                <NSwitch v-model:value="breakOptimize" @update:value="breakOptimizeSwitch"></NSwitch>
              </template>
            </GroupTitle>
            <div class="w-100%">
              <CircleShow></CircleShow>
            </div>
          </div>
        </div>
      </div>
    </NSpin>
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
.mask::before {
  content: '';
  position: absolute;
  border-radius: 0.375rem;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  opacity: 0.5;
  transition: all 0.3s ease;
  z-index: 50;
}
</style>
