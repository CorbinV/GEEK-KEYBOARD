<script setup lang="ts">
import { computed, ref } from 'vue';
const initSw = () => {
  const originSwitchList = [
    {
      key: 'H',
      label: 'HOME'
    },
    {
      key: 'TP',
      label: 'TP'
    },
    {
      key: 'SEL',
      label: 'SEL'
    },
    {
      key: 'M7',
      label: 'L3'
    },
    {
      key: 'M8',
      label: 'R3'
    },
    {
      key: 'ST',
      label: 'START'
    },
    {
      key: 'PC',
      label: 'PC'
    },
    {
      key: 'NS',
      label: 'NS'
    },
    {
      key: 'LK',
      label: 'LOCK',
      icon: 'lock'
    },
    {
      key: 'UNLK',
      label: 'UNLOCK',
      icon: 'unlock'
    },
    {
      key: 'VS',
      label: 'VS',
      icon: 'vs-layer'
    },
    {
      key: 'GL1',
      label: 'GL1',
      icon: 'game-layer-1'
    },
    {
      key: 'GL2',
      label: 'GL2',
      icon: 'game-layer-2'
    }
  ];
  return originSwitchList.map(item => {
    return {
      ...item,
      value: false,
      pr: false
    };
  });
};
const initBtn = () => {
  const originBtnList = [
    'M1',
    'M2',
    'M3',
    'M4',
    'RB',
    'LB',
    'RT',
    'LT',
    'A',
    'B',
    'X',
    'Y',
    'UP',
    'DOWN',
    'LEFT',
    'RIGHT',
    'L3',
    'R3'
  ];
  return originBtnList.map(item => {
    return {
      key: item,
      label: item,
      value: false,
      pr: false
    };
  });
};
const switchList = ref(initSw());
const btnList = ref(initBtn());

const passTested = computed(() => {
  const swStatus = switchList.value.every(item => item.value) && btnList.value.every(item => item.value);
  const btnStatus = btnList.value.every(item => item.value);
  return swStatus && btnStatus;
});
</script>

<template>
  <div class="h-full w-full flex flex-row bg-#ffffff px-6 py-8 text-white">
    <div class="w-1/5">
      <NButton size="large">Connect</NButton>
      <div>
        <p class="text-xl">
          <span class="mr-4">Status:</span>
          <span v-if="passTested" class="text-#7ada00">Passed</span>
          <span v-else class="text-#ff3d00">Failed</span>
        </p>
      </div>
    </div>
    <div class="flex-1">
      <div>
        <p>switch button</p>
        <div class="flex flex-row flex-wrap gap-x-12 gap-y-6">
          <div
            v-for="sw in switchList"
            :key="sw.key"
            class="h-16 w-32 flex items-center justify-center border-1 border-#000000 rounded-xl bg-#171717 text-center text-xl"
            :class="{
              'bg-#7ada00': sw.value && !sw.pr,
              'bg-#ffd850': sw.pr
            }"
          >
            <SvgIcon v-if="sw?.icon" :local-icon="sw.icon" class="text-3xl"></SvgIcon>
            <span v-else>{{ sw.label }}</span>
          </div>
        </div>
      </div>
      <div>
        <p>base button</p>
        <div class="flex flex-row flex-wrap gap-x-12 gap-y-6">
          <div
            v-for="btn in btnList"
            :key="btn.key"
            class="h-16 w-32 flex items-center justify-center border-1 border-#000000 rounded-xl bg-#171717 text-center text-xl"
          >
            <span>{{ btn.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
