<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { $t } from '@/locales';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { useDeviceStore } from '@/store/modules/device';
import { DeviceIptEnum } from '@/api/modules/setting';
import SOCD from './module/socd.vue';
import Control from './module/control.vue';
import BtnList from './module/btn-list.vue';
const btnName = ref('');
const btnNameFlag = ref(Date.now());
function injBtnItemClick(k: string) {
  btnName.value = k;
  btnNameFlag.value = Date.now();
}
const keyboardStore = useKeyboardStore();
const deviceStore = useDeviceStore();
const { keyLayerInfo, allowUndo, undo } = toRefs(keyboardStore);
const { iptDevType } = toRefs(deviceStore);
const showSocd = computed(() => {
  return !(keyLayerInfo.value.layerIndex === 0);
});
const showMask = computed(() => iptDevType.value !== DeviceIptEnum.PC);

const ControlRef = ref<typeof Control>();

async function handleCancel() {
  const historyItem = undo.value();
  if (Array.isArray(historyItem)) {
    for await (const item of historyItem) {
      const { oldVal } = item;
      await ControlRef.value?.updateBtnByParent(oldVal.k, oldVal.v);
    }
  } else if (historyItem?.newVal) {
    const { oldVal: oldBase } = historyItem;
    await ControlRef.value?.updateBtnByParent(oldBase.k, oldBase.v);
  }
}
function handleResetLayerConfig() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: `确认重置当前层的按键配置吗？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await keyboardStore.resetTargetLayerCfg();
        btnName.value = '';
      } catch (error) {
        window?.$log?.error(error);
        window?.$message?.error('配置重置异常，请检查设备状态或更新版本');
      }
    }
  });
}

function handleSelectAll() {
  window?.$message?.info('该功能暂未开放，敬请期待');
}
function handleSelectRevert() {
  window?.$message?.info('该功能暂未开放，敬请期待');
}
</script>

<template>
  <div class="relative h-full w-full">
    <div v-if="showMask" class="mask">
      <div class="mask-content text-bold text-3xl line-height-relaxed">
        <p class="w-full text-center">请在设备上切换模式值PC模式后，</p>
        <p class="w-full text-center">再次进入此界面操作</p>
      </div>
    </div>
    <div class="flex flex-col p-6 pt-17">
      <div class="grid grid-cols-5">
        <div class="col-span-1">
          <SOCD v-show="showSocd"></SOCD>
        </div>
        <div class="col-span-3">
          <Control
            ref="ControlRef"
            :vs-layer="keyLayerInfo.layerIndex === 0"
            :update-btn="btnName"
            :update-flag="btnNameFlag"
          ></Control>
        </div>
        <div class="col-span-1 w-46 text-#999999">
          <div class="mt-25%"></div>
          <div class="mx-auto my-6.5 w-fit text-7xl" @click="handleResetLayerConfig">
            <SvgIcon local-icon="refresh" class="hover:cursor-pointer hover:text-#e64324"></SvgIcon>
          </div>
          <div class="flex flex-col gap-y-4 text-lg">
            <div
              class="h-10 flex items-center justify-center rounded-md bg-#222227 hover:cursor-pointer hover:text-#E64324"
              @click="handleSelectAll"
            >
              全选
            </div>
            <div
              class="h-10 flex items-center justify-center rounded-md bg-#222227 hover:cursor-pointer hover:text-#E64324"
              @click="handleSelectRevert"
            >
              反选
            </div>
            <div
              class="h-10 flex items-center justify-center rounded-md bg-#222227"
              :class="`${!allowUndo ? 'cursor-not-allowed' : 'cursor-pointer hover:text-#E64324'}`"
              @click="handleCancel"
            >
              撤销
            </div>
          </div>
        </div>
      </div>
      <BtnList class="mx-auto mt-76 w-90%" @list-item-click="injBtnItemClick"></BtnList>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: absolute;
  inset: 0;
  background-color: #000000aa;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.mask-content {
  margin-top: 33vh;
  text-align: center;
  white-space: pre-wrap;
}
</style>
