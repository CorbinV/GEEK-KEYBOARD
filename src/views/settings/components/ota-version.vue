<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { NModal } from 'naive-ui';
import type { VersionInfo } from '../composables/useOTA';

const props = defineProps<{
  show: boolean;
  versioninfo: VersionInfo;
}>();

const emit = defineEmits(['update:show', 'upgrade']);

const showModal = computed(() => props.show);

const descRef = ref<HTMLElement | null>(null);
const cancel = () => {
  emit('update:show', false);
};

const upgrade = () => {
  emit('upgrade');
};

watchEffect(() => {
  if (descRef.value) {
    descRef.value.innerHTML = props.versioninfo.desc_cn;
  }
});
</script>

<template>
  <NModal v-model:show="showModal" :mask-closable="false">
    <div class="rounded-log w-108 flex flex-col items-center justify-center rounded-lg bg-[#171619] p-7 text-center">
      <span class="text-5 text-[#ffffff]">发现新固件V{{ versioninfo.version }}</span>

      <div class="mt-7 min-h-54 w-full text-left">
        <span ref="descRef" class="text-4 text-[#999999] leading-8" />
      </div>

      <div class="mt-7 flex justify-center">
        <button class="h-15 w-42 border border-[#3c8df4] rounded bg-transparent text-4 text-[#3c8df4]" @click="cancel">
          以后再说
        </button>

        <button class="ml-7 h-15 w-42 rounded bg-[#3c8df4] text-4 text-[#FFFFFF]" @click="upgrade">立刻更新</button>
      </div>
    </div>
  </NModal>
</template>

<style scoped></style>
