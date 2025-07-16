<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { onMounted, ref } from 'vue';
import type { SocdBase } from '@/api/modules/socd';
import { getSocdMode, setSocdMode } from '@/api/socd';
import { $t } from '@/locales';
enum ModeEnum {
  upPriorityMode = 'upPriorityMode',
  centerReset = 'centerReset',
  lastInputPriority = 'lastInputPriority'
}
const modeList = [ModeEnum.upPriorityMode, ModeEnum.centerReset, ModeEnum.lastInputPriority];

const base = {
  [ModeEnum.upPriorityMode]: false,
  [ModeEnum.centerReset]: false,
  [ModeEnum.lastInputPriority]: false
};
let activeMode: ModeEnum | null = null;
const modeValues = ref(base);

onMounted(async () => {
  const { mode } = await getSocdMode();
  activeMode = modeList[mode];
  modeValues.value[activeMode] = true;
});
async function handleSwitchChange(val: boolean, tag: ModeEnum, idx: number) {
  try {
    if (activeMode === tag && val === false) {
      window?.$log?.warn(`Cannot set the only true property '${tag}' to false`);
      modeValues.value[tag] = true;
      return;
    }
    if (val === true) {
      if (activeMode !== null) {
        modeValues.value[activeMode] = false;
      }
      activeMode = tag;
    } else if (activeMode === tag) {
      activeMode = null;
    }
    await setSocdMode(idx as any as SocdBase);
    modeValues.value[tag] = val;
  } catch (error) {
    window?.$log?.error(error);
    window.$message?.error('设置失败，请检查设备状态或更新固件');
  }
}
function railStyle({ focused, checked }: { focused: boolean; checked: boolean }) {
  const style: CSSProperties = {};
  if (checked) {
    style.background = '#88362a';
    if (focused) {
      style.boxShadow = '0 0 0 2px #88362a40';
    }
  } else {
    style.background = '#06070b';
    if (focused) {
      style.boxShadow = '0 0 0 2px #06070b40';
    }
  }
  return style;
}
</script>

<template>
  <div class="w-64 flex flex-col">
    <div class="rounded-md bg-#2a2a31 p-3">
      <h1 class="text-2xl">SOCD {{ $t('common.mode') }}</h1>
      <template v-for="(modeName, idx) in modeList" :key="modeName">
        <NDivider class="!my-3" />
        <p class="flex flex-row items-center justify-between text-lg">
          <span :class="[{ 'text-#E64324': modeValues[modeName] }]">{{ $t(`socd.${modeName}`) }}</span>
          <NSwitch
            v-model:value="modeValues[modeName]"
            :rail-style="railStyle"
            class="socd-switch"
            @update-value="v => handleSwitchChange(v, modeName, idx)"
          ></NSwitch>
        </p>
      </template>
    </div>
    <div class="w-full flex-1"></div>
  </div>
</template>

<style lang="scss" scoped>
.socd-switch {
  ::deep(.n-switch__rail) {
    .n-switch__button {
      background: #06070b;
    }
  }
}
</style>
