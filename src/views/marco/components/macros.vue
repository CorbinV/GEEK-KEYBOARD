<script setup lang="ts">
import { reactive } from 'vue';
import { getMacros } from '@/api/macroApi';
import type { Macro } from '@/api/modules/macro';

const macros = reactive<{ macro: Macro[] }>({ macro: [] });
async function test() {
  console.log('test');
  const data = await getMacros();
  macros.macro = data.macro;
  macros.macro.forEach(item => {
    console.log(item);
  });
}

const options = [
  { label: '编辑', key: 'edit' },
  { type: 'divider' },
  { label: '重命名', key: 'rename' },
  { type: 'divider' },
  { label: '删除', key: 'del' }
];

function handleSelect(key: string | number) {
  console.log(key);
  test();
}
</script>

<template>
  <div class="grid grid-cols-4 gap-4">
    <!-- add -->
    <div
      class="h-25 flex flex-col items-center justify-center gap-2.5 border border border-[#3c8df4] rounded-lg border-dashed text-base text-[#3C8DF4] font-normal"
    >
      <i class="iconfont icon-mouse-mid" style="color: #3c8df4"></i>
      <span class="text-[#3C8DF4]">添加宏按键</span>
    </div>
    <!-- item -->
    <div class="h-25 flex flex-col">
      <div class="flex basis-2/3 items-center justify-center rounded-t-lg bg-[#131313]">
        <span class="text-sm text-[#999999] font-medium">宏按键</span>
      </div>
      <div class="flex basis-1/3 items-center justify-between rounded-b-lg bg-[#222227] px-4">
        <span class="text-sm text-[#999999] font-medium">M1</span>
        <NDropdown trigger="hover" :options="options" @select="handleSelect">
          <i class="iconfont icon-mouse-mid" style="color: #999999"></i>
        </NDropdown>
      </div>
    </div>
  </div>
</template>

<style scoped>
.n-dropdown-menu .n-divider {
  margin-left: 20px;
  margin-right: 20px;
  width: calc(100% - 40px);
}
</style>
