<script setup lang="ts">
import { reactive } from 'vue';

const controlList = reactive([
  {
    type: 'press-low',
    value: 0.5
  },
  {
    type: 'press-deep',
    value: 3.5
  },
  {
    type: 'release-deep',
    value: 3.5
  },
  {
    type: 'release-low',
    value: 0.5
  }
]);
function updateControlItem(idx: number, value: number) {
  controlList[idx].value = value;
}
defineExpose({
  controlList,
  updateControlItem
});
</script>

<template>
  <div class="flex flex-col gap-y-5">
    <div class="w-full flex-1"></div>
    <div
      v-for="ctr in controlList"
      :key="`${ctr.type}-kdc`"
      class="flex flex-row items-center rounded-md higth-light-bg p-2"
    >
      <SvgIcon :local-icon="ctr.type" class="mr-4 text-lg" />
      <NInputNumber
        v-model:value="ctr.value"
        style="width: 64px"
        size="tiny"
        :min="0.5"
        :max="3.5"
        :step="0.1"
        :show-button="false"
      >
        <template #suffix>mm</template>
      </NInputNumber>
    </div>
  </div>
</template>
