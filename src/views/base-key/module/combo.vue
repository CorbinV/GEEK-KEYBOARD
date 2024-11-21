<script setup lang="ts">
import { onMounted, ref } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { KeyTypeEnum } from '@/enum/keyType';
import { getComboList } from '@/api/combo';
import ComboEdit from '../components/combo-edit.vue';
const comboGroupList = ref<any>([]);
const editVisible = ref(false);
const MAC_GORUP_CNT = 20;
const emit = defineEmits(['key-clicked']);
function handleAddClicked() {
  if (comboGroupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning(`最多只能添加${MAC_GORUP_CNT}个组合键`);
    return;
  }
  // opent edit modal(dialog)
  editVisible.value = true;
}
onMounted(async () => {
  const { shortcuts } = await getComboList();
  comboGroupList.value = shortcuts.map(item => {
    return {
      base: {
        code: item.code,
        type: KeyTypeEnum.Combo,
        name: `组合按键${item.code}`
      }
      // optimize: wait function open
      // comboKeyList: item.keys.map(item => {
      //   return {
      // })
    };
  });
});
function handleGroupCreated({ code }: { code: number }) {
  comboGroupList.value.push({
    base: {
      code,
      type: KeyTypeEnum.Combo,
      name: `组合按键${code}`
    }
  });
}

function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.Combo } }) {
  const { code, type } = base;
  emit('key-clicked', {
    code,
    type
  });
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd icon="add" desc="添加组合键" @click="handleAddClicked" />
      <BasicGroupItem
        v-for="item in comboGroupList"
        :key="item.id"
        :base="item.base"
        code-preffix="C"
        @click="handleGroupItemClicked(item)"
      >
        <template #menu>
          <div class="rounded-md higth-light-bg px-3 hover:cursor-pointer">
            <i class="iconfont icon-add text-c-second"></i>
          </div>
        </template>
      </BasicGroupItem>
      <ComboEdit
        v-model:visible="editVisible"
        :group-length="comboGroupList.length"
        @create-group="handleGroupCreated"
      />
    </div>
  </div>
</template>
