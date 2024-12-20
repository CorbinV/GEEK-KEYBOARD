<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { NModal } from 'naive-ui';

const props = defineProps<{
  show: boolean;
  progress: number;
}>();

const emit = defineEmits(['update:show', 'handleBack']);

const progress = ref(props.progress || 0);

const showModal = computed(() => props.show);

watchEffect(() => {
  progress.value = props.progress || 0;
});

const handleBack = () => {
  emit('update:show', false);
};
</script>

<template>
  <NModal v-model:show="showModal" :mask-closable="false">
    <div class="rounded-log flex flex-col items-center justify-center rounded-lg bg-[#171619] p-7 text-center">
      <span class="text-4 text-[#ffffff]">固件升级</span>
      <NProgress
        type="line"
        color="#3C8DF4"
        rail-color="#D9D9D9"
        style="width: 365px"
        :show-indicator="false"
        :percentage="progress"
        class="mt-7"
      />
      <span class="mt-4 text-4" :class="progress > 0 ? 'text-[#3C8DF4]' : 'text-[#D9D9D9]'">{{ progress }}%</span>
      <template v-if="progress < 100">
        <span class="mt-5 text-4 text-[#666666]">升级过程中，请勿关闭设备以及网页</span>
        <span class="mt-1 text-4 text-[#666666]">升级成功后会有提示，请耐心等待～</span>
      </template>
      <template v-else>
        <div class="mt-5 flex">
          <i class="iconfont icon-mouse-mid"></i>
          <span class="ml-2 text-4 text-[#999999]">升级完成！</span>
        </div>
      </template>
      <button
        v-if="progress === 100"
        class="mt-5 h-15 w-42 rounded bg-[#3c8df4] text-4 text-[#FFFFFF]"
        @click="handleBack"
      >
        返回
      </button>
    </div>
  </NModal>
</template>

<style scoped></style>
