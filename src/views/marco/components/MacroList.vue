<script setup lang="ts">
import { computed } from 'vue';
import type { Macro } from '@/api/modules/macro';
import { MacroType } from '../core/macroType';

const props = defineProps<{
  edit: boolean;
  macros: { macro: Macro[] };
}>();

const emit = defineEmits<{
  (e: 'new-macro'): void;
  (e: 'list-item', item: Macro): void;
  (e: 'macros-menu', key: string | number, item: Macro): void;
}>();

const canAddMacro = computed(() => props.edit && props.macros.macro.length < 8);

const macroList = computed(() => props.macros.macro);
function handleNewMacro() {
  emit('new-macro');
}

function handleListItem(item: Macro) {
  emit('list-item', item);
}

function handleMacrosMenu(key: string | number, item: Macro) {
  emit('macros-menu', key, item);
}
</script>

<template>
  <!-- list -->
  <div class="grid grid-cols-4 gap-4 p-7">
    <!-- add -->
    <div
      v-if="canAddMacro"
      class="h-25 flex flex-col items-center justify-center gap-2.5 border border border-[#3c8df4] rounded-lg border-dashed text-base text-[#3C8DF4] font-normal"
      @click="handleNewMacro"
    >
      <i class="iconfont icon-add" style="color: #3c8df4"></i>
      <span class="text-[#3C8DF4]">{{ $t('macro.addMacroKey') }}</span>
    </div>

    <!-- item -->
    <div v-for="item in macroList" :key="item.code" class="h-25 flex flex-col">
      <div class="flex basis-2/3 items-center justify-center rounded-t-lg bg-[#131313]" @click="handleListItem(item)">
        <span class="text-sm text-[#999999] font-medium">{{ item.name }}</span>
      </div>
      <div class="flex basis-1/3 items-center justify-between rounded-b-lg bg-[#222227] px-4">
        <span class="text-sm text-[#999999] font-medium">M{{ item.code + 1 }}</span>
        <NDropdown
          v-if="props.edit"
          trigger="hover"
          :options="MacroType.MacrosOps"
          @select="key => handleMacrosMenu(key, item)"
        >
          <div class="size-5 flex items-center justify-center rounded bg-[#1E1E22]">
            <SvgIcon icon="tabler:dots" />
          </div>
        </NDropdown>
      </div>
    </div>
  </div>
</template>
