<script setup lang="ts">
import { computed } from 'vue';
import type { Macro } from '@/api/modules/macro';
import { MacroType } from '../composables/macroType';

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
  <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
    <!-- add -->
    <!--
 <div
      v-if="canAddMacro"
      class="min-w-120px inline-flex items-center justify-center border border-#3C8DF4 rounded-md border-dashed py-6 text-#3C8DF4 hover:cursor-pointer"
      @click="handleNewMacro"
    >
      <div class="flex flex-col justify-center gap-y-1">
        <i class="iconfont icon-add text-center text-2xl font-bold"></i>
        <span class="text-base">{{ $t('macro.addMacroKey') }}</span>
      </div>
    </div>
-->
    <BasicGroupAdd v-if="canAddMacro" icon="add" :desc="$t('businessCommon.addSwtich')" @click="handleNewMacro" />

    <!-- item -->
    <div v-for="item in macroList" :key="item.code" class="flex flex-col">
      <div class="h-20 flex items-center justify-center rounded-t-md higth-light-bg" @click="handleListItem(item)">
        <span class="text-sm text-[#999999] font-medium">{{ item.name }}</span>
      </div>
      <div class="flex flex-row items-center justify-between rounded-b-md base-light-bg px-5 py-1">
        <span class="text-c-primary">M{{ item.code + 1 }}</span>
        <div class="rounded-md higth-light-bg px-3 hover:cursor-pointer">
          <NDropdown
            v-if="props.edit"
            trigger="hover"
            :options="MacroType.MacrosOps"
            @select="key => handleMacrosMenu(key, item)"
          >
            <div class="py-1 text-c-primary">
              <SvgIcon icon="tabler:dots" />
            </div>
          </NDropdown>
        </div>
      </div>
    </div>
  </div>
</template>
