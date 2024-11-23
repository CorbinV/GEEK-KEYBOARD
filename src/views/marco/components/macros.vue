<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import type { TabsInst } from 'naive-ui';
import { delMacro, getMacroCfg, getMacros, setMacro, setMacroName } from '@/api/macroApi';
import type { Macro, MacroAttr } from '@/api/modules/macro';
import type { UIKey } from './macroHelper';
import actions from './macroHelper';
import { MacroType } from './macroType';

const emit = defineEmits(['key-clicked']);
const props = defineProps<{ edit: boolean }>();
function handleListItem(item: Macro) {
  emit('key-clicked', { code: item.code, type: item.type });
}

// 宏列表
const macros = reactive<{ macro: Macro[] }>({ macro: [] });
// 添加或编辑的宏
let macro: Macro = { type: 6, code: -1, name: '' };
// 0-添加 1-编辑
let editType = 0;
// 宏配置
let uiKey: UIKey[] = reactive([]);
// 宏弹窗
const showModal = ref(false);
// 宏重命名弹窗
const showRenameModal = ref(false);
// 宏列表编辑索引
const listEditIndex = ref(-1);
// 宏重命名
const inputReName = ref('');
// 宏录制状态
const recordStatus = ref(false);
// 触发方式
const trigger = ref(MacroType.TriggerOptionKey.Down);
// 随机延迟开关
const randomDelay = ref(false);
// 显示时间
const allTimeRadioValue = ref<string | null>(MacroType.AllTime.Show);
// 宏按键编辑
const isEdit = ref(false);
// 宏名称
const inputName = ref('');
// 宏按下触发延迟
const inputDelayTime = ref(1);
// 宏循环次数
const inputLoop = ref(1);
// 停止方式
const stopType = ref(MacroType.QuitOptionKey.Normal);
// 宏延迟时间区间
const inputDelayTimeStart = ref(0);
const inputDelayTimeEnd = ref(0);
// 宏修改全部时间
const inputTime = ref(null);
// 选中uikey
const selectKey = ref({ type: -1, code: -1, value: -1 });
// 选中索引
const selectIndex = ref(-1);
// 选中的按键名称
const selectName = ref('');
// tab ref
const tabsInstRef = ref<TabsInst | null>(null);
// tab index
const tabIndex = ref(MacroType.KeyStatusTabs.Down);
// 宏修改时间
const inputKeyTime = ref(null);

onMounted(async () => {
  initData();
});

// 初始化数据
async function initData() {
  const macrosList = await getMacros();
  macros.macro = macrosList.macro.slice(0, 7);
}

// 刷新UI
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

// 宏列表操作菜单
function handleMacrosMenu(key: string | number, item: Macro) {
  listEditIndex.value = macros.macro.indexOf(item);
  switch (key) {
    case MacroType.MenuOptionKey.Edit: {
      handleMacroEdit(item);
      break;
    }
    case MacroType.MenuOptionKey.ReName: {
      handleReName();
      break;
    }

    case MacroType.MenuOptionKey.Delete: {
      handleMacroDelete();
      break;
    }

    default:
      break;
  }
}

// 添加宏按键
function handleNewMacro() {
  editType = 0;
  let index = 0;
  for (const item of macros.macro) {
    if (item.code === index) {
      index++;
    } else {
      break;
    }
  }
  listEditIndex.value = index;
  macro = {
    type: 6,
    code: listEditIndex.value,
    name: `M${listEditIndex.value + 1}`
  };
  actions.newMacroAttr(macro);
  updateUI();
  showModal.value = true;
}

// 编辑宏
async function handleMacroEdit(item: Macro) {
  editType = 1;
  macro = item;
  const macroCfg = await getMacroCfg({ type: item.type, code: item.code });
  actions.initMacroCfg(macroCfg);
  updateUI();
  showModal.value = true;
}
// 重命名
function handleReName() {
  inputReName.value = '';
  showRenameModal.value = true;
}

// 重命名保存
async function handleReNameSave() {
  if (inputReName.value === '' || listEditIndex.value === -1) return;
  await setMacroName({ type: macro.type, code: macros.macro[listEditIndex.value].code, name: inputReName.value });
  // 等待响应后再更新数据
  macros.macro[listEditIndex.value].name = inputReName.value;
  showRenameModal.value = false;
}

// 删除宏
async function handleMacroDelete() {
  if (listEditIndex.value === -1) return;
  await delMacro({ code: macros.macro[listEditIndex.value].code });
  // 等待响应后再更新数据
  macros.macro.splice(listEditIndex.value, 1);
}

// 触发方式
function handleTrigger(value: number) {
  trigger.value = value;
  inputDelayTime.value = 0;
}

// 停止方式
function handleStopType(value: number) {
  stopType.value = value;
}

// 随机延迟
function handleRandomDelay(value: boolean) {
  randomDelay.value = value;
}

// 修改全部时间
function handleAllTime() {
  if (inputTime.value === null) return;
  actions.updateAllTime(Number(inputTime.value));
}

// 显示时间
function handleRadio() {
  if (allTimeRadioValue.value === MacroType.AllTime.Show) {
    allTimeRadioValue.value = MacroType.AllTime.Hide;
  } else {
    allTimeRadioValue.value = MacroType.AllTime.Show;
  }
}

// 选中编辑
function selectItem(item: UIKey, index: number) {
  if (recordStatus.value) return;
  selectKey.value = item;
  selectName.value = String(item.code);
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

// 修改按键按下、抬起
function handleKeyEventTabs(value: string | number) {
  actions.updateKey(selectIndex.value, value === MacroType.KeyStatusTabs.Down ? 1 : 2);
}

// 删除选中
function handleDelete() {
  actions.deleteUIKey(selectIndex.value);
}

// 插入时间0
function handleInsertTime() {
  actions.insertUIKey(selectIndex.value, { type: 3, code: 0, value: 0 });
}

// 插入按键0
function handleInsertKey() {
  actions.insertUIKey(selectIndex.value, { type: 1, code: 0, value: 0 });
}

// 重置
function handleReset() {
  pauseRecord();
  actions.resetUIKey();
}

// 录制控制
function handleRecord() {
  if (recordStatus.value) {
    pauseRecord();
  } else {
    startRecord();
    actions.recordUIKey();
  }
}

// 开始录制
function startRecord() {
  recordStatus.value = true;

  const frames = [
    { index: 0, code: [2, 3], time: 0 },
    { index: 1, code: [2], time: 3 },
    { index: 2, code: [], time: 5 },
    { index: 3, code: [4], time: 7 },
    { index: 4, code: [4, 5], time: 9 }
  ];

  frames.forEach((item, index) => {
    setTimeout(() => {
      actions.addFrame(item);
    }, 1000 * index);
  });
}

// 暂停录制
function pauseRecord() {
  recordStatus.value = false;
  actions.pauseRecord();
}

// 取消
function handleCancel() {
  pauseRecord();
  showModal.value = false;
}

// 宏属性
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

// 保存
async function handleSave() {
  console.log('handleSave');
  pauseRecord();
  saveMacroAttr();
  const result = actions.saveUIKey();
  if (result) {
    await setMacro({ attr: result.attr, keys: result.keys });
    // 等待响应后再更新数据
    macros.macro.splice(listEditIndex.value, editType, macro);
  }
  showModal.value = false;
}
</script>

<template>
  <!-- list -->
  <div class="grid grid-cols-4 gap-4 p-7">
    <!-- add -->
    <div
      v-if="props.edit && macros.macro.length < 8"
      class="h-25 flex flex-col items-center justify-center gap-2.5 border border border-[#3c8df4] rounded-lg border-dashed text-base text-[#3C8DF4] font-normal"
      @click="handleNewMacro"
    >
      <i class="iconfont icon-add" style="color: #3c8df4"></i>
      <span class="text-[#3C8DF4]">添加宏按键</span>
    </div>

    <!-- item -->
    <div v-for="item in macros.macro" :key="item.code" class="h-25 flex flex-col">
      <div class="flex basis-2/3 items-center justify-center rounded-t-lg bg-[#131313]" @click="handleListItem(item)">
        <span class="text-sm text-[#999999] font-medium">{{ item.name }}</span>
      </div>
      <div class="flex basis-1/3 items-center justify-between rounded-b-lg bg-[#222227] px-4">
        <span class="text-sm text-[#999999] font-medium">M{{ item.code + 1 }}</span>
        <NDropdown
          v-if="props.edit"
          trigger="hover"
          :options="MacroType.MacrosOps"
          @select="key => handleMacrosMenu(key, item)"
        >
          <div class="size-5 flex items-center justify-center rounded bg-[#1E1E22]">
            <SvgIcon icon="tabler:dots" />
          </div>
        </NDropdown>
      </div>
    </div>

    <!-- reName modal -->
    <NModal v-model:show="showRenameModal" :mask-closable="false">
      <div class="rounded-log flex flex-col items-center justify-center gap-7 bg-[#191B1D] p-7 text-center">
        <span>重命名</span>
        <NInput v-model:value="inputReName" type="text" size="large" placeholder="最长六个字符" maxlength="6" />
        <div>
          <button
            class="h-15 w-42 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]"
            @click="showRenameModal = false"
          >
            取消
          </button>
          <button class="ml-7 h-15 w-42 rounded bg-[#3c8df4]" @click="handleReNameSave">保存</button>
        </div>
      </div>
    </NModal>

    <!-- modal -->
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
              <span class="ml-4 ml-4 text-[#999999]">停止</span>
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

        <!-- contont -->
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
                <span class="text-5 text-[##999999]">{{ item.code }}</span>
                <i class="iconfont icon-triangle-down" style="color: #999999"></i>
              </div>
              <div
                v-else-if="item.type === 2"
                class="point size-15 flex flex-col items-center justify-center rounded bg-[#222227]"
                :class="[selectIndex === index ? 'border-2 border-blue-500' : '']"
                @click="selectItem(item, index)"
              >
                <span class="text-5 text-[##999999]">{{ item.code }}</span>
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
              :placeholder="selectKey.type !== 3 ? String(selectKey.code) : String(selectKey.value)"
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
  </div>
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
