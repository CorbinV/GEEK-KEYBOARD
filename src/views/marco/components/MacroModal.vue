<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import type { TabsInst } from 'naive-ui';
import { NInputNumber, NModal, NRadio, NSelect, NSwitch, NTab, NTabs } from 'naive-ui';
import type { Macro, MacroAttr } from '@/api/modules/macro';
import { MacroType } from '../core/macroType';
import type { UIKey } from '../core/macroHelper';
import actions from '../core/macroHelper';

const props = defineProps<{
  show: boolean;
  macro: Macro;
  listEditIndex: number;
  editType: number;
}>();

const emit = defineEmits(['update:show', 'save']);

const showModal = ref(props.show);
const macro = reactive(props.macro);
const listEditIndex = ref(props.listEditIndex);
const editType = ref(props.editType);

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
const inputDelayTimeStart = ref(0);
const inputDelayTimeEnd = ref(0);
const inputTime = ref(null);
const allTimeRadioValue = ref<string | null>(MacroType.AllTime.Show);
const isEdit = ref(false);
let uiKey = reactive([] as UIKey[]);
const selectKey = ref<UIKey>({ type: -1, code: -1, value: -1 });
// 选中索引
const selectIndex = ref(-1);
const selectName = ref('');
const tabIndex = ref(MacroType.KeyStatusTabs.Down);
// 宏录制状态
const recordStatus = ref(false);
const inputKeyTime = ref(null);
const tabsInstRef = ref<TabsInst | null>(null);

watch(
  () => props.show,
  newVal => {
    showModal.value = newVal;
    if (newVal) {
      updateUI();
    }
  }
);

onMounted(() => {
  updateUI();
});

function updateUI() {
  const macroAttr = actions.getMacroAttr();
  inputName.value = macroAttr.name;
  trigger.value = macroAttr.trigger;
  inputDelayTime.value = macroAttr.triggerDelay;
  inputLoop.value = macroAttr.loop;
  stopType.value = macroAttr.stopType;
  inputDelayTimeStart.value = macroAttr.delay[0];
  inputDelayTimeEnd.value = macroAttr.delay[1];
  uiKey = actions.getUIKey();
}

function handleTrigger(value: number) {
  trigger.value = value;
  inputDelayTime.value = 0;
}

function handleStopType(value: number) {
  stopType.value = value;
}

function handleRandomDelay(value: boolean) {
  randomDelay.value = value;
}

function handleAllTime() {
  if (inputTime.value === null) return;
  actions.updateAllTime(Number(inputTime.value));
}

function handleRadio() {
  if (allTimeRadioValue.value === MacroType.AllTime.Show) {
    allTimeRadioValue.value = MacroType.AllTime.Hide;
  } else {
    allTimeRadioValue.value = MacroType.AllTime.Show;
  }
}

function selectItem(item: UIKey, index: number) {
  if (recordStatus.value) return;
  selectKey.value = item;
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
    }
  }
}

function handleKeyEventTabs(value: string | number) {
  actions.updateKey(selectIndex.value, value === MacroType.KeyStatusTabs.Down ? 1 : 2);
}

function handleDelete() {
  actions.deleteUIKey(selectIndex.value);
}

function handleInsertTime() {
  actions.insertUIKey(selectIndex.value, { type: 3, code: 0, value: 0 });
}

function handleInsertKey() {
  actions.insertUIKey(selectIndex.value, { type: 1, code: 0, value: 0 });
}

function handleReset() {
  pauseRecord();
  actions.resetUIKey();
}

function handleRecord() {
  if (recordStatus.value) {
    pauseRecord();
  } else {
    startRecord();
    actions.recordUIKey();
  }
}

function startRecord() {
  recordStatus.value = true;

  const frames = [
    { index: 0, code: [4, 5], time: 0 },
    { index: 1, code: [4], time: 3 },
    { index: 2, code: [], time: 5 },
    { index: 3, code: [6], time: 7 },
    { index: 4, code: [6, 7], time: 9 }
  ];
  frames.forEach((item, index) => {
    setTimeout(() => {
      actions.addFrame(item);
    }, 1000 * index);
  });
}

function pauseRecord() {
  recordStatus.value = false;
  actions.pauseRecord();
}

function handleCancel() {
  pauseRecord();
  // showModal.value = false;
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
  actions.setMacroAttr(macroAttr);
}

function handleSave() {
  pauseRecord();
  saveMacroAttr();
  const result = actions.saveUIKey();
  if (result) {
    emit('save', { macro, listEditIndex: listEditIndex.value, editType: editType.value });
  }
  // showModal.value = false;
  emit('update:show', false);
}
</script>

<template>
  <NModal v-model:show="showModal" :mask-closable="false">
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
            placeholder="宏编辑编编辑"
            :disabled="!isEdit"
            maxlength="6"
          />
          <i class="iconfont icon-edit ml-3" style="color: #ffffff" @click="isEdit = !isEdit"></i>
        </div>
        <div class="mt-5 w-full flex flex-wrap items-center justify-between">
          <!-- header-left -->
          <div class="flex flex-wrap items-center text-center">
            <span class="text-[#999999]">触发</span>
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
              :update-value-on-input="false"
              placeholder="0s"
              maxlength="3"
              :min="0"
              :precision="0"
              :show-button="false"
            />
            <span class="ml-5 text-[#999999]">循环</span>
            <NInputNumber
              v-model:value="inputLoop"
              style="width: 70px"
              type="text"
              size="large"
              :update-value-on-input="false"
              class="ml-2"
              placeholder="1"
              maxlength="3"
              :min="1"
              :precision="0"
              :show-button="false"
            />
            <span class="ml-4 text-[#999999]">停止</span>
            <NSelect
              v-model:value="stopType"
              class="ml-3 w-45"
              size="large"
              :options="MacroType.QuitOps"
              @update:value="handleStopType"
            ></NSelect>
            <span class="ml-4 text-[#999999]">随机延迟</span>
            <NSwitch v-model:value="randomDelay" @update:value="handleRandomDelay" />
            <NInputNumber
              v-if="randomDelay"
              v-model:value="inputDelayTimeStart"
              style="width: 70px"
              type="text"
              size="large"
              class="ml-2"
              :update-value-on-input="false"
              :min="0"
              placeholder="0s"
              maxlength="3"
              :precision="0"
              :show-button="false"
            />
            <div v-if="randomDelay" class="mx-3 w-3 border-b border-b-[#232327]"></div>
            <NInputNumber
              v-if="randomDelay"
              v-model:value="inputDelayTimeEnd"
              style="width: 70px"
              type="text"
              size="large"
              :update-value-on-input="false"
              :min="0"
              class="ml-2"
              placeholder="0s"
              maxlength="3"
              :precision="0"
              :show-button="false"
            />
          </div>
          <!-- header-right -->
          <div class="flex items-center text-center">
            <span class="text-[#999999]">修改全部时间</span>
            <NInputNumber
              v-model:value="inputTime"
              style="width: 70px"
              type="text"
              size="large"
              class="ml-2"
              :update-value-on-input="false"
              placeholder="0s"
              maxlength="3"
              :min="0"
              :precision="0"
              :show-button="false"
            />
            <button
              class="text-[#3C8DF4 ml-5 h-10 w-30 border border-[#3c8df4] rounded bg-transparent"
              @click="handleAllTime"
            >
              生效
            </button>
            <NRadio
              :checked="allTimeRadioValue === MacroType.AllTime.Show"
              :value="MacroType.AllTime.Show"
              class="ml-5"
              @click="handleRadio"
            >
              <span class="ml-2 text-[#999999]">显示时间</span>
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
          <span v-if="selectKey.type !== 3" class="w-18 text-[#999999]">按键信息</span>
          <span v-if="selectKey.type === 3" class="w-18 text-[#999999]">时间</span>
          <NInput
            v-if="selectKey.type !== 3"
            v-model:value="selectName"
            type="text"
            size="large"
            style="width: 180px"
            :placeholder="String(selectKey.value)"
            :disabled="selectKey.type !== 3"
            maxlength="6"
          />
          <NInputNumber
            v-if="selectKey.type === 3"
            v-model:value="inputKeyTime"
            style="width: 180px"
            size="large"
            placeholder="0s"
            maxlength="3"
            :update-value-on-input="false"
            :min="1"
            :precision="0"
            :show-button="false"
          />

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
              重置
            </button>
            <button class="h-15 w-42 rounded bg-[#3c8df4]" @click="handleRecord">
              {{ !recordStatus ? '开始录制' : '暂停' }}
            </button>
          </div>
          <div class="flex gap-7">
            <button
              class="h-15 w-42 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]"
              @click="handleCancel"
            >
              取消
            </button>
            <button class="h-15 w-42 rounded bg-[#3c8df4]" @click="handleSave">保存</button>
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
