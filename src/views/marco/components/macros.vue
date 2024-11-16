<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { getMacros } from '@/api/macroApi';
import type { Macro } from '@/api/modules/macro';

const macros = reactive<{ macro: Macro[] }>({ macro: [] });
const showModal = ref(true);

onMounted(() => {
  test();
});
async function test() {
  const data = await getMacros();
  macros.macro = data.macro.slice(0, -1);
}

enum MenuOptionKey {
  Edit,
  ReName,
  Delete
}

const options = [
  { label: '编辑', key: MenuOptionKey.Edit },
  { type: 'divider' },
  { label: '重命名', key: MenuOptionKey.ReName },
  { type: 'divider' },
  { label: '删除', key: MenuOptionKey.Delete }
];

function handleSelect(key: string | number, item: Macro) {
  console.log(key, item);
  switch (key) {
    case MenuOptionKey.Edit: {
      console.log(`edit ${item} `);
      showModal.value = true;
      break;
    }
    case MenuOptionKey.ReName: {
      console.log(`rename ${item}`);
      const index = macros.macro.indexOf(item);
      macros.macro[index].name = 'test';
      break;
    }

    case MenuOptionKey.Delete: {
      macros.macro.splice(macros.macro.indexOf(item), 1);
      break;
    }

    default:
      break;
  }
}
</script>

<template>
  <!-- list -->
  <div class="grid grid-cols-4 gap-4 p-7">
    <!-- add -->
    <div
      v-if="macros.macro.length < 8"
      class="h-25 flex flex-col items-center justify-center gap-2.5 border border border-[#3c8df4] rounded-lg border-dashed text-base text-[#3C8DF4] font-normal"
    >
      <i class="iconfont icon-mouse-mid" style="color: #3c8df4"></i>
      <span class="text-[#3C8DF4]">添加宏按键</span>
    </div>

    <!-- item -->
    <div v-for="item in macros.macro" :key="item.code" class="h-25 flex flex-col">
      <div class="flex basis-2/3 items-center justify-center rounded-t-lg bg-[#131313]">
        <span class="text-sm text-[#999999] font-medium">{{ item.name }}</span>
      </div>
      <div class="flex basis-1/3 items-center justify-between rounded-b-lg bg-[#222227] px-4">
        <span class="text-sm text-[#999999] font-medium">M{{ item.code + 1 }}</span>
        <NDropdown trigger="hover" :options="options" @select="key => handleSelect(key, item)">
          <i class="iconfont icon-mouse-mid" style="color: #999999"></i>
        </NDropdown>
      </div>
    </div>

    <!-- modal -->
    <NModal v-model:show="showModal" :mask-closable="false">
      <div class="h-[90vh] w-4/5 flex flex-col rounded-lg bg-[#191B1D] p-7">
        <!-- header -->
        <div class="flex flex-col basis-3/19 items-center justify-center">
          <div>
            <span>宏编辑编编辑</span>
            <i class="iconfont icon-mouse-mid" style="color: #3c8df4"></i>
          </div>
          <div class="mt-5 w-full flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-[#999999]">触发</span>
              <div class="ml-3 h-12 w-45 flex items-center justify-center rounded bg-[#222227]">
                <span class="text-[#999999]">按下延迟触发</span>
              </div>
              <input type="text" class="ml-2 h-12 w-17 rounded bg-[#222227] text-center" placeholder="0s" />
              <span class="ml-5 text-[#999999]">循环</span>
              <input type="text" class="ml-2 h-12 w-17 rounded bg-[#222227] text-center" placeholder="1" />
              <span class="ml-4 ml-4 text-[#999999]">停止</span>
              <div class="ml-3 h-12 w-45 flex items-center justify-center rounded bg-[#222227]">
                <span class="text-[#999999]">执行完停止</span>
              </div>
              <span class="ml-4 text-[#999999]">随机延迟</span>
              <input type="text" class="ml-2 h-12 w-17 rounded bg-[#222227] text-center" placeholder="1ms" />
              <div class="mx-3 w-3 border-b border-b-[#232327]"></div>
              <input type="text" class="h-12 w-17 rounded bg-[#222227] text-center" placeholder="1ms" />
            </div>
            <div>
              <span class="text-[#999999]">修改全部时间</span>
              <input type="text" class="ml-2 h-12 w-17 rounded bg-[#222227] text-center" placeholder="0ms" />
              <button class="ml-5 h-10 w-30 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]">生效</button>
              <span class="ml-5 text-[#999999]">显示时间间隔</span>
            </div>
          </div>
        </div>

        <div class="my-7 w-full border-b border-b-[#232327]"></div>

        <!-- contont -->
        <div class="flex flex-col basis-14/19">
          <!-- content list -->
          <div class="w-full flex grow gap-3 rounded bg-[#171619] p-4">
            <div class="size-15 flex flex-col items-center justify-center rounded bg-[#222227]">
              <div>G</div>
              <i class="iconfont icon-mouse-mid" style="color: #3c8df4"></i>
            </div>
            <div class="size-15 flex flex-col items-center justify-center rounded bg-[#222227]">
              <div>G</div>
              <i class="iconfont icon-mouse-mid" style="color: #3c8df4"></i>
            </div>
          </div>
          <div class="my-7 w-full border-b border-b-[#232327]"></div>
          <!-- content edit -->
          <div class="h-12 flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-[#999999]">按键信息</span>
              <div class="ml-3 mr-5 h-12 w-45 flex items-center justify-center rounded bg-[#222227]">
                <span class="text-[#3c8df4]">G</span>
              </div>
              <span>按下抬起</span>
              <button class="ml-5 h-10 w-30 border border-[#FF4242] rounded bg-transparent text-[#FF4242]">删除</button>
            </div>
            <div class="flex items-center">
              <span class="text-[#999999]">向后插入</span>
              <button class="ml-3 h-10 w-30 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]">时间</button>
              <button class="ml-2.5 h-10 w-30 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]">
                按键
              </button>
            </div>
          </div>
        </div>

        <div class="my-7 w-full border-b border-b-[#232327]"></div>
        <!-- footer -->
        <div class="flex flex-col basis-2/19">
          <div class="flex justify-between">
            <div class="flex gap-7">
              <button class="h-15 w-42 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]">重置</button>
              <button class="h-15 w-42 rounded bg-[#3c8df4]">开始录制</button>
            </div>
            <div class="flex gap-7">
              <button
                class="h-15 w-42 border border-[#3c8df4] rounded bg-transparent text-[#3C8DF4]"
                @click="showModal = false"
              >
                取消
              </button>
              <button class="h-15 w-42 rounded bg-[#3c8df4]">保存</button>
            </div>
          </div>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style scoped></style>
