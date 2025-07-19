<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { $t } from '@/locales';
import { useKeyboardStore } from '@/store/modules/keyboard';
import SOCD from './module/socd.vue';
import Control from './module/control.vue';
import BtnList from './module/btn-list.vue';
const btnName = ref('');
function injBtnItemClick(k: string) {
  btnName.value = k;
}

const keyboardStore = useKeyboardStore();
const { keyLayerInfo, allowUndo, undo } = toRefs(keyboardStore);
const showSocd = computed(() => {
  return !(keyLayerInfo.value.layerIndex === 0);
});
function handleResetLayerConfig() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: `确认重置当前层的按键配置吗？`,
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      try {
        // send reset cmd
        const cfg = keyLayerInfo.value.configIndex;
        const layer = keyLayerInfo.value.layerIndex;
        await resetLayerKeys({
          cfg,
          layer
        });
        // reload current config
        await keyboardStore.updateLayerKeys(
          {
            config: cfg,
            layer
          },
          {
            forced: true
          }
        );
      } catch (error) {
        window?.$log?.error(error);
        window?.$message?.error('配置重置异常，请检查设备状态或更新版本');
      }
    }
  });
}

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
function handleSelectAll() {
  window?.$message?.info('该功能暂未开放，敬请期待');
}
function handleSelectRevert() {
  window?.$message?.info('该功能暂未开放，敬请期待');
}
</script>

<template>
  <div class="flex flex-col p-6 pt-17">
    <div class="grid grid-cols-5">
      <div class="col-span-1">
        <SOCD v-show="showSocd"></SOCD>
      </div>
      <div class="col-span-3">
        <Control ref="ControlRef" :vs-layer="keyLayerInfo.layerIndex === 0" :update-btn="btnName"></Control>
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
</template>

<style scoped>
.custom-segment-tabs {
  :deep(.n-tabs-tab) {
    margin: 3px 12px;
  }
}
</style>
