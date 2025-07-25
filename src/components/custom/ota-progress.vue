<script setup lang="ts">
import { computed } from 'vue';
import { NModal } from 'naive-ui';
import { OtaStatusEnum } from '@/enum/index';

const props = defineProps<{
  show: boolean;
  progress: number;
  status: OtaStatusEnum;
}>();

const emit = defineEmits(['update:show', 'handleBack', 'redo']);

const showModal = computed(() => props.show);
const upgradeFinished = computed(() => {
  return props.status === OtaStatusEnum.UPGRADE_SUCCESS || props.status === OtaStatusEnum.UPGRADE_FAIL;
});
// const handleBack = () => {
//   emit('update:show', false);
// };
const handleRedo = () => {
  emit('redo');
};
// const backBtnAttr: any = computed(() => {
//   if (props.status === OtaStatusEnum.UPGRADE_SUCCESS) {
//     return {
//       class: 'flex-1 max-w-32 text-white',
//       type: 'info',
//       gohst: false,
//       size: 'large',
//       onClick: handleBack
//     };
//   }
//   return {
//     class: 'flex-1 max-w-32',
//     size: 'large',
//     onClick: handleBack
//   };
// });
</script>

<template>
  <NModal v-model:show="showModal" :mask-closable="false">
    <div class="rounded-log flex flex-col items-center justify-center gap-y-4 rounded-lg bg-[#171619] p-7 text-center">
      <span class="mb-4 text-4 text-[#ffffff]">{{ $t('setting.gjUpdate') }}</span>
      <NProgress
        type="line"
        color="#e64324"
        rail-color="#D9D9D9"
        style="width: 365px"
        :show-indicator="false"
        :percentage="progress"
        class=""
      />
      <span class="text-4" :class="progress > 0 ? 'text-[#e64324]' : 'text-[#D9D9D9]'">{{ progress }}%</span>
      <template v-if="upgradeFinished">
        <div class="flex flex-row items-center gap-x-2">
          <template v-if="status === OtaStatusEnum.UPGRADE_SUCCESS">
            <i class="iconfont icon-hollow-done text-#a1ec41"></i>
            <p class="text-base text-[#999999]">{{ $t('businessCommon.upgradeSuccess') }}</p>
          </template>
          <template v-else>
            <i class="iconfont icon-hollow-close text-#e4583e"></i>
            <p class="text-base text-[#999999]">{{ $t('businessCommon.upgradeFail') }}</p>
          </template>
        </div>
        <div class="w-70% flex flex-row justify-center gap-x-8">
          <!--
 <NButton v-bind="backBtnAttr">
            {{ $t('common.back') }}
          </NButton>
-->
          <NButton class="max-w-32 flex-1 text-white" size="large" type="info" @click="handleRedo">
            {{ $t('setting.upgradeAgain') }}
          </NButton>
        </div>
      </template>
      <template v-else>
        <div class="text-4 text-[#666666]">
          <p>{{ $t('setting.upgradeNotice1') }}</p>
          <p>{{ $t('setting.upgradeNotice2') }}</p>
        </div>
      </template>
    </div>
  </NModal>
</template>

<style scoped></style>
