<script setup lang="ts">
import { computed, toRef, toRefs } from 'vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { $t } from '@/locales';
import { useDeviceStore } from '@/store/modules/device';
import { DeviceIptEnum } from '@/api/modules/setting';
import { setInputType } from '@/api/setting';
const deviceStore = useDeviceStore();
const { iptDevType } = toRefs(deviceStore);

const keyboardStore = useKeyboardStore();
const keyLayerInfo = toRef(keyboardStore, 'keyLayerInfo');

const modeOps = computed(() => {
  const cnt = keyLayerInfo.value.layerCount;
  return Array.from({ length: cnt }).map((_, idx) => {
    let label;
    if (!idx) {
      label = `${$t('businessCommon.competitionMode')}`;
    } else {
      label = `${$t('businessCommon.casualMode')} ${idx}`;
    }
    return {
      label,
      value: idx
    };
  });
});
const iptType = ['PC', 'PS', 'Switch'];

const TypeOps = computed(() => {
  const cnt = keyLayerInfo.value.configCount;
  return Array.from({ length: cnt }).map((_, idx) => {
    const disabled = idx === 0 && iptDevType.value !== DeviceIptEnum.PC;
    return {
      label: `${iptType[idx]}${$t('common.mode')}`,
      value: idx,
      disabled
    };
  });
});
function handleModeChange(v: number) {
  const allowTruelyChange = iptDevType.value !== DeviceIptEnum.PC;
  const cache = keyLayerInfo.value.configIndex;
  keyLayerInfo.value.configIndex = v as DeviceIptEnum;
  if (allowTruelyChange) {
    window.$dialog?.info({
      title: $t('common.tip'),
      content: `确认切换至 ${iptType[v]} 模式吗`,
      positiveText: $t('common.confirm'),
      negativeText: $t('common.cancel'),
      onPositiveClick: async () => {
        try {
          await setInputType({
            iptTp: v
          });
          window?.$message?.success('模式切换成功，请再次连接');
        } catch (error) {
          window?.$log?.error(error);
          keyLayerInfo.value.configIndex = cache;
          window?.$message?.info('模式切换异常，请更新固件');
        }
      }
    });
    return;
  }
  keyLayerInfo.value.configIndex = cache;
}
// const modeInfo = computed(() => {
//   return {
//     icon: keyLayerInfo.value.layerIndex ? 'hp-casual-mode' : 'hp-competition-mode',
//     label: keyLayerInfo.value.layerIndex ? $t('businessCommon.casualMode') : $t('businessCommon.competitionMode')
//   }
// })
</script>

<template>
  <div class="w-80 flex flex-row items-center gap-x-4">
    <NSelect v-model:value="keyLayerInfo.layerIndex" class="x-select" to="#popover-portal" :options="modeOps" />
    <NSelect
      class="x-select"
      :value="keyLayerInfo.configIndex"
      to="#popover-portal"
      :options="TypeOps"
      @update:value="handleModeChange"
    />
  </div>
</template>

<style lang="scss" scoped>
.x-select {
  & :deep(.n-base-selection) {
    border-radius: 2rem !important;
    background: black !important;
    color: white !important;
    transition: all 0.3s;
  }

  &:deep(.n-base-selection:hover) {
    background: #111 !important;
  }

  & :deep(.n-base-select-menu) {
    background: black;
    color: white;
    border-radius: 1rem;
    margin-top: 0.5rem;
  }

  & :deep(.n-base-select-option) {
    color: #eee;
  }

  & :deep(.n-base-select-option--hover) {
    background: #333 !important;
  }

  & :deep(.n-base-clear) {
    color: #ccc !important;
  }

  & :deep(.n-base-suffix) {
    color: #aaa;
  }
}
</style>
