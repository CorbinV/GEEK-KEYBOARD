<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { TabsInst } from 'naive-ui';
import { NInputNumber, NModal, NRadio, NSelect, NSwitch, NTab, NTabs, useMessage } from 'naive-ui';
import type { Macro, MacroAttr } from '@/api/modules/macro';
import { macroStart, macroStop, setMacro } from '@/api/macroApi';
import type { UIKey } from '@/store/modules/macro';
import { useMacroStore } from '@/store/modules/macro';
import { MacroType } from '../composables/macroType';
import { useKeyListener } from '../composables/useKeyListener';

const message = useMessage();

const {
  getMacroAttr,
  updateAllTime,
  updateKey,
  deleteUIKey,
  insertUIKey,
  resetUIKey,
  addFrame,
  setMacroAttr,
  saveUIKey,
  uiKey,
  getKeyNameByCode
} = useMacroStore();

const { keyPressed, onKeyListener, offKeyListener } = useKeyListener();

const props = defineProps<{
  show: boolean;
  macro: Macro;
  listEditIndex: number;
  editType: number;
}>();

const emit = defineEmits(['update:show', 'save']);

const showModal = ref(props.show);
const macro = reactive(props.macro);
// const listEditIndex = ref(props.listEditIndex);
// const editType = ref(props.editType);

// 宏名称
const inputName = ref('');
// 触发方式
const trigger = ref(MacroType.TriggerOptionKey.Down);
// 宏按下触发延迟
const inputDelayTime = ref(1);
// 宏循环次数
const inputLoop = ref(1);
// 停止方式
const stopType = ref(MacroType.QuitOptionKey.Normal);
const randomDelay = ref(false);
// 宏延迟时间区间
const inputDelayTimeStart = ref(1);
const inputDelayTimeEnd = ref(1);
const inputTime = ref(0);
const allTimeRadioValue = ref<string | null>(MacroType.AllTime.Show);
const isEdit = ref(false);
// let uiKey = reactive([] as UIKey[]);
const selectKey = ref<UIKey>({ type: -1, code: -1, value: -1 });
// 选中索引
const selectIndex = ref(-1);
const selectName = ref('');
const tabIndex = ref(MacroType.KeyStatusTabs.Down);
// 宏录制状态
const recordStatus = ref(false);
const inputKeyTime = ref(0);
const tabsInstRef = ref<TabsInst | null>(null);

onMounted(() => offKeyListener());
onUnmounted(() => offKeyListener());

watch(
  () => props.show,
  newVal => {
    showModal.value = newVal;
    if (newVal) updateUI();
  }
);

watch(
  () => keyPressed.value,
  newVal => {
    if (newVal !== -1) {
      uiKey[selectIndex.value].code = newVal;
      selectName.value = getKeyNameByCode(newVal);
    }
  }
);

watch(
  () => selectIndex.value,
  newVal => {
    if (newVal !== -1 && selectKey.value.type !== 3) onKeyListener();
    else offKeyListener();
  }
);

watch(
  () => selectName.value,
  value => {
    if (selectIndex.value !== -1 && selectKey.value.type !== 3) {
      uiKey[selectIndex.value].value = selectName.value;
    }
    console.log('selectName', value);
  }
);

watch(
  () => inputKeyTime.value,
  value => {
    if (selectIndex.value !== -1 && selectKey.value.type === 3) {
      uiKey[selectIndex.value].value = Number(inputKeyTime.value);
    }
    console.log('inputKeyTime', value);
  }
);

// 更新UI
function updateUI() {
  console.log('updateUI');
  const macroAttr = getMacroAttr();
  inputName.value = macroAttr.name;
  trigger.value = macroAttr.trigger;
  inputDelayTime.value = macroAttr.triggerDelay;
  inputLoop.value = macroAttr.loop;
  stopType.value = macroAttr.stopType;
  inputDelayTimeStart.value = macroAttr.delay[0];
  inputDelayTimeEnd.value = macroAttr.delay[1];
  // uiKey = getUIKey();
}

// 触发方式
function handleTrigger(value: number) {
  trigger.value = value;
  inputDelayTime.value = 1;
}

// 停止方式
function handleStopType(value: number) {
  stopType.value = value;
}

// 随机延迟
function handleRandomDelay(value: boolean) {
  randomDelay.value = value;
}

// 修改全部时间-生效
function handleAllTime() {
  if (recordStatus.value) {
    message.warning('录制中，请先停止录制');
    return;
  }
  if (inputTime.value === null) return;
  if (uiKey.length === 0) return;
  updateAllTime(Number(inputTime.value));
}

// 显示时间
function handleRadio() {
  if (allTimeRadioValue.value === MacroType.AllTime.Show) {
    allTimeRadioValue.value = MacroType.AllTime.Hide;
  } else {
    allTimeRadioValue.value = MacroType.AllTime.Show;
  }
}

// 选择帧
function selectItem(item: UIKey, index: number) {
  if (recordStatus.value) return;
  selectKey.value = item;
  console.log(index, item);
  if (selectIndex.value === index) {
    selectIndex.value = -1;
  } else {
    selectIndex.value = index;
    if (item.type === 1) {
      tabIndex.value = MacroType.KeyStatusTabs.Down;
      nextTick(() => tabsInstRef.value?.syncBarPosition());
    } else if (item.type === 2) {
      tabIndex.value = MacroType.KeyStatusTabs.Up;
      nextTick(() => tabsInstRef.value?.syncBarPosition());
    } else {
      inputKeyTime.value = Number(item.value);
    }
  }
}

// 按下或抬起
function handleKeyEventTabs(value: string | number) {
  updateKey(selectIndex.value, value === MacroType.KeyStatusTabs.Down ? 1 : 2);
}

// 删除
function handleDelete() {
  deleteUIKey(selectIndex.value);
  selectIndex.value = -1;
  inputKeyTime.value = 0;
  selectName.value = '';
}

// 插入时间
function handleInsertTime() {
  insertUIKey(selectIndex.value, { type: 3, code: 0, value: 0 });
}

// 插入按键
function handleInsertKey() {
  insertUIKey(selectIndex.value, { type: 1, code: 4, value: 'A' });
}

// 重置
function handleReset() {
  if (recordStatus.value) {
    message.warning('录制中，请先停止录制');
    return;
  }
  stopRecord();
  resetUIKey();
  message.success('重置成功');
}

// 录制
function handleRecord() {
  if (recordStatus.value) {
    stopRecord();
  } else {
    startRecord();
  }
}

// 开始录制
async function startRecord() {
  try {
    await macroStart();
    recordStatus.value = true;
    await recording();
  } catch (e) {
    console.log(e);
    message.error('开始录制失败');
  }
}

async function stopRecord() {
  try {
    await macroStop();
    recordStatus.value = false;
  } catch (e) {
    console.log(e);
    message.error('停止录制失败');
  }
}

// 添加帧
async function recording() {
  // 模拟录制 - 待完善
  const frames = [
    { index: 0, code: [4, 5], time: 0 },
    { index: 1, code: [4], time: 3 },
    { index: 2, code: [], time: 5 },
    { index: 3, code: [6], time: 7 },
    { index: 4, code: [6, 7], time: 9 }
  ];
  frames.forEach((item, index) => {
    setTimeout(() => {
      addFrame(item);
    }, 1000 * index);
  });
}

// 取消
async function handleCancel() {
  if (recordStatus.value) {
    message.warning('录制中，请先停止录制');
    return;
  }
  emit('update:show', false);
}

function saveMacroAttr() {
  if (trigger.value !== MacroType.TriggerOptionKey.Delay) {
    inputDelayTime.value = 0;
  }
  macro.name = inputName.value;
  const macroAttr: MacroAttr = {
    type: macro.type,
    code: macro.code,
    name: inputName.value,
    trigger: trigger.value,
    triggerDelay: inputDelayTime.value,
    loop: inputLoop.value,
    delay: [inputDelayTimeStart.value, inputDelayTimeEnd.value],
    stopType: stopType.value
  };
  setMacroAttr(macroAttr);
}

// 保存
async function handleSave() {
  if (recordStatus.value) {
    message.warning('录制中，请先停止录制');
    return;
  }
  if (uiKey.length === 0) {
    message.warning('请录制后保存');
    return;
  }
  saveMacroAttr();
  const result = saveUIKey();
  if (result) {
    await setMacro({ attr: result.attr, keys: result.keys });
    message.success('保存成功');
    emit('update:show', false);
    // emit('save', { macro, listEditIndex: listEditIndex.value, editType: editType.value });
  }
}
</script>

<template>
  <NModal v-model:show="showModal" :mask-closable="false" :close-on-es="false">
    <div class="h-[90vh] w-4/5 flex flex-col rounded-lg bg-[#191B1D] p-7">
      <!-- header -->
      <div class="flex-col flex-none items-center justify-center">
        <!-- header-top -->
        <div class="flex text-center">
          <NInput
            v-model:value="inputName"
            type="text"
            size="medium"
            style="width: 132px"
            :readonly="!isEdit"
            maxlength="6"
          />
          <i class="iconfont icon-edit ml-3" style="color: #ffffff" @click="isEdit = !isEdit"></i>
        </div>
        <div class="mt-5 w-full flex flex-wrap items-center justify-between">
          <!-- header-left -->
          <div class="flex flex-wrap items-center text-center">
            <span class="text-[#999999]">{{ $t('macro.exe') }}</span>
            <NSelect
              v-model:value="trigger"
              class="ml-3 w-45"
              size="large"
              :options="MacroType.TriggerOps"
              @update:value="handleTrigger"
            ></NSelect>
            <NInputNumber
              v-if="trigger === MacroType.TriggerOptionKey.Delay"
              v-model:value="inputDelayTime"
              style="width: 70px"
              type="text"
              size="large"
              class="ml-2"
              :min="0.1"
              :max="10.0"
              :step="0.1"
              :precision="1"
              :show-button="false"
            >
              <template #suffix>s</template>
            </NInputNumber>
            <span class="ml-5 text-[#999999]">{{ $t('macro.loop') }}</span>
            <NInputNumber
              v-model:value="inputLoop"
              style="width: 70px"
              type="text"
              size="large"
              class="ml-2"
              :min="1"
              :max="9999"
              :step="1"
              :precision="0"
              :show-button="false"
            />
            <span class="ml-4 text-[#999999]">{{ $t('macro.stop') }}</span>
            <NSelect
              v-model:value="stopType"
              class="ml-3 w-45"
              size="large"
              :options="MacroType.QuitOps"
              @update:value="handleStopType"
            ></NSelect>
            <span class="ml-4 text-[#999999]">{{ $t('macro.randomDelay') }}</span>
            <NSwitch v-model:value="randomDelay" class="ml-2" @update:value="handleRandomDelay" />
            <NInputNumber
              v-if="randomDelay"
              v-model:value="inputDelayTimeStart"
              style="width: 90px"
              type="text"
              size="large"
              class="ml-2"
              :min="1"
              :max="2000"
              :step="1"
              :precision="0"
              :show-button="false"
            >
              <template #suffix>ms</template>
            </NInputNumber>
            <div v-if="randomDelay" class="mx-3 w-3 border-b-2 border-b-[#999999]"></div>
            <NInputNumber
              v-if="randomDelay"
              v-model:value="inputDelayTimeEnd"
              style="width: 90px"
              type="text"
              size="large"
              :min="1"
              :max="2000"
              :step="1"
              :precision="0"
              :show-button="false"
            >
              <template #suffix>ms</template>
            </NInputNumber>
          </div>
          <!-- header-right -->
          <div class="flex items-center text-center">
            <span class="text-[#999999]">{{ $t('macro.updateAllTime') }}</span>
            <NInputNumber
              v-model:value="inputTime"
              style="width: 90px"
              type="text"
              size="large"
              class="ml-2"
              :min="0"
              :max="6000"
              :step="1"
              :precision="0"
              :show-button="false"
            >
              <template #suffix>ms</template>
            </NInputNumber>
            <button
              class="text-[#3C8DF4 ml-5 h-10 w-30 border border-[#3c8df4] rounded bg-transparent"
              @click="handleAllTime"
            >
              {{ $t('macro.enable') }}
            </button>
            <NRadio
              :checked="allTimeRadioValue === MacroType.AllTime.Show"
              :value="MacroType.AllTime.Show"
              class="ml-5"
              @click="handleRadio"
            >
              <span class="ml-2 text-[#999999]">{{ $t('macro.showTime') }}</span>
            </NRadio>
          </div>
        </div>
      </div>

      <div class="my-7 w-full border-b border-b-[#232327]"></div>

      <!-- content -->
      <div class="h-150 flex-col overflow-auto">
        <!-- content list -->
        <div class="grid grid-cols-18 w-full grow gap-3 rounded bg-[#171619] p-4">
          <template v-for="(item, index) in uiKey" :key="index">
            <div
              v-if="item.type === 1"
              class="point size-15 flex flex-col items-center justify-center rounded bg-[#222227]"
              :class="[selectIndex === index ? 'border-2 border-blue-500' : '']"
              @click="selectItem(item, index)"
            >
              <span class="text-5 text-[##999999]">{{ item.value }}</span>
              <i class="iconfont icon-triangle-down" style="color: #999999"></i>
            </div>
            <div
              v-else-if="item.type === 2"
              class="point size-15 flex flex-col items-center justify-center rounded bg-[#222227]"
              :class="[selectIndex === index ? 'border-2 border-blue-500' : '']"
              @click="selectItem(item, index)"
            >
              <span class="text-5 text-[##999999]">{{ item.value }}</span>
              <i class="iconfont icon-triangle-up" style="color: #999999"></i>
            </div>
            <div
              v-else-if="allTimeRadioValue === MacroType.AllTime.Show"
              class="point size-15 flex flex-col items-center justify-center rounded bg-[#222227]"
              :class="[selectIndex === index ? 'border-2 border-blue-500' : '']"
              @click="selectItem(item, index)"
            >
              <span class="text-5 text-[##999999]">{{ item.value }}</span>
              <div class="w-11 border-b border-b-[#999999]"></div>
              <span class="text-5 text-[##999999]">ms</span>
            </div>
          </template>
        </div>
      </div>

      <div v-if="selectIndex != -1" class="my-7 w-full border-b border-b-[#232327]"></div>
      <!-- content edit -->
      <div v-if="selectIndex != -1" class="h-12 flex items-center justify-between">
        <div class="flex items-center text-center">
          <span v-if="selectKey.type !== 3" class="w-18 text-[#999999]">{{ $t('macro.keyInfo') }}</span>
          <span v-if="selectKey.type === 3" class="w-18 text-[#999999]">{{ $t('macro.time') }}</span>
          <NInput
            v-if="selectKey.type !== 3"
            v-model:value="selectName"
            type="text"
            size="large"
            style="width: 180px"
            :placeholder="String(selectKey.value)"
            :disabled="selectKey.type !== 3"
            maxlength="1"
          />
          <NInputNumber
            v-if="selectKey.type === 3"
            v-model:value="inputKeyTime"
            style="width: 180px"
            size="large"
            :min="0"
            :max="6000"
            :step="1"
            :precision="0"
            :show-button="false"
          >
            <template #suffix>ms</template>
          </NInputNumber>

          <NTabs
            v-if="selectKey.type !== 3"
            ref="tabsInstRef"
            v-model:value="tabIndex"
            type="segment"
            style="width: 120px"
            animated
            class="ml-5"
            @update:value="handleKeyEventTabs"
          >
            <NTab :name="MacroType.KeyStatusTabs.Down" />
            <NTab :name="MacroType.KeyStatusTabs.Up" />
          </NTabs>

          <button
            class="ml-5 h-10 w-30 border border-[#FF4242] rounded bg-transparent text-[#FF4242]"
            @click="handleDelete"
          >
            删除
          </button>
        </div>
        <div class="flex items-center">
          <span class="text-[#999999]">向后插入</span>
          <button
            v-if="selectKey.type !== 3 && selectIndex !== uiKey.length - 1"
            class="ml-3 h-10 w-30 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]"
            @click="handleInsertTime"
          >
            时间
          </button>
          <button
            class="ml-2.5 h-10 w-30 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]"
            @click="handleInsertKey"
          >
            按键
          </button>
        </div>
      </div>

      <div class="my-7 w-full border-b border-b-[#232327]"></div>
      <!-- footer -->
      <div class="flex-col flex-none">
        <div class="flex justify-between">
          <div class="flex gap-7">
            <button
              class="h-15 w-42 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]"
              @click="handleReset"
            >
              {{ $t('common.reset') }}
            </button>
            <button class="h-15 w-42 rounded bg-[#3c8df4]" @click="handleRecord">
              {{ !recordStatus ? $t('macro.startRecord') : $t('macro.stop') }}
            </button>
          </div>
          <div class="flex gap-7">
            <button
              class="h-15 w-42 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]"
              @click="handleCancel"
            >
              {{ $t('businessCommon.cancel') }}
            </button>
            <button class="h-15 w-42 rounded bg-[#3c8df4]" @click="handleSave">
              {{ $t('businessCommon.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.n-tabs-tab--active {
  color: #ffffff !important;
  background: #3c8df4 !important;
}

.point {
  cursor: pointer;
}
</style>
