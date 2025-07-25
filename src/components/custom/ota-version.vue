<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { NModal } from 'naive-ui';
import { number2Version } from '@/utils/tools';

const props = defineProps<{
  show: boolean;
  versioninfo: any;
  secondConfirm?: boolean;
  secondConfirmFnc?: () => Promise<HIDDevice[]>;
}>();

const emit = defineEmits<{
  (
    e: 'update:show',
    value: {
      res: boolean;
      firstConfirm: boolean;
    }
  ): void; // 更新外部值
  (e: 'upgrade', res: (val: boolean) => void): void; // 更新外部值
  (e: 'upgrade:confirm', res: HIDDevice[]): void;
}>();
const version = computed(() => {
  return number2Version(props.versioninfo.version, 3).join('.');
});
const showModal = computed(() => props.show);
const firstConfirm = ref(false);
const descRef = ref<HTMLElement | null>(null);
const cancel = () => {
  emit('update:show', { res: false, firstConfirm: firstConfirm.value });
};

const upgrade = async () => {
  const isAllowed = await new Promise<boolean>(res => {
    emit('upgrade', res);
  });
  if (props.secondConfirm && isAllowed) {
    firstConfirm.value = true;
  }
};
const upgradeSecond = async () => {
  if (props.secondConfirmFnc) {
    const devices = await props.secondConfirmFnc();
    emit('upgrade:confirm', devices);
  }
};

watchEffect(() => {
  if (descRef.value) {
    descRef.value.innerHTML = props.versioninfo.journal_cn || '-';
  }
});
</script>

<template>
  <NModal v-model:show="showModal" :mask-closable="false">
    <div class="rounded-log w-108 flex flex-col items-center justify-center rounded-lg bg-[#171619] p-7 text-center">
      <span class="text-5 text-[#ffffff]">发现新固件V{{ version }}</span>

      <div class="mt-7 min-h-54 w-full text-left">
        <span ref="descRef" class="text-4 text-[#999999] leading-8" />
      </div>

      <div class="mt-7 flex justify-center">
        <button class="h-15 w-42 border border-[#e64324] rounded bg-transparent text-4 text-[#e64324]" @click="cancel">
          {{ firstConfirm ? '连接页' : '取消' }}
        </button>

        <button v-if="!firstConfirm" class="ml-7 h-15 w-42 rounded bg-[#e64324] text-4 text-[#FFFFFF]" @click="upgrade">
          更新
        </button>
        <button v-else class="ml-7 h-15 w-42 rounded bg-[#e64324] text-4 text-[#FFFFFF]" @click="upgradeSecond">
          确认更新
        </button>
      </div>
    </div>
  </NModal>
</template>

<style scoped></style>
