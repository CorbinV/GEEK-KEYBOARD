<script setup lang="ts">
import { onMounted, ref } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { KeyTypeEnum } from '@/enum/keyType';
import { createComboGroup, deleteComboGroup, getComboList } from '@/api/combo';
import { useKeyboardStore } from '@/store/modules/keyboard';
import ComboEdit from '../components/combo-edit.vue';
const keyboardStore = useKeyboardStore();
const groupList = ref<any>([]);
const editVisible = ref(false);
const MAC_GORUP_CNT = 20;
const emit = defineEmits(['key-clicked']);
function handleAddClicked() {
  if (groupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning(`最多只能添加${MAC_GORUP_CNT}个组合键`);
    return;
  }
  // opent edit modal(dialog)
  editVisible.value = true;
}

async function updateGroupList() {
  const { shortcuts } = await getComboList();
  groupList.value = shortcuts.map(item => {
    const { code, type, key } = item;
    const name = `组合按键${item.code}`;
    return {
      base: { code, type, name, key },
      keyList: [] as any[]
      // keyList: item.keys.map(keyBase => {
      //   const res = getKeyDetail({ code: keyBase.code, type: keyBase.type });
      //   updateGroupEffect(keyBase.key!, toRaw(currentSuperKeyType.value), res);
      //   return res;
      // })
    };
  });
}
onMounted(async () => {
  updateGroupList();
});
async function handleGroupCreated({ code, key, keys }: { code: number; key: string; keys: any[] }) {
  try {
    const type = KeyTypeEnum.Combo;
    await createComboGroup({ code, keys, key, type });
    groupList.value.push({
      base: {
        code,
        key,
        type,
        name: `组合按键${code}`
      },
      keyList: keys
    });
    keyboardStore.updateSuperKey(key, { moduleType: type });
    window.$message!.success('创建成功');
  } catch (error) {
    console.error('handleGroupCreated', error);
    window.$message!.error('创建失败, 请更新最新固件后重试');
  }
}

function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.Combo; keyId: string } }) {
  const { code, type, keyId } = base;
  emit('key-clicked', {
    code,
    type,
    keyId
  });
}
async function handleGroupItemDelete(items: any, idx: number) {
  try {
    await deleteComboGroup({ code: items.code });
    groupList.value.splice(idx, 1);
    keyboardStore.removeSuperKey(items.key, { moduleType: KeyTypeEnum.Combo });
    window.$message!.success('删除成功');
  } catch (error) {
    console.error('handleGroupItemDelete', error);
    window.$message!.error('删除失败, 请更新最新固件后重试');
  }
}
async function handleGroupItemEdit(items: any, idx: number) {
  // feat: open edit modal(dialog), and transform data
  console.log('handleGroupItemEdit', items, idx);
}
function generateGroupCode() {
  if (groupList.value.length === 0) return 1;
  const usedCodes = new Set(groupList.value.map((group: { base: { code: number } }) => group.base.code));
  let newCode = 1;
  while (usedCodes.has(newCode)) {
    newCode++;
  }
  return newCode;
}
function handleGroupItemRename(items: any, idx: number) {
  // feat: rename group name
  console.log('handleGroupItemRename', items, idx);
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd icon="add" desc="添加组合键" @click="handleAddClicked" />
      <BasicGroupItem
        v-for="(item, idx) in groupList"
        :key="item.id"
        :base="item.base"
        code-preffix="C"
        @click="handleGroupItemClicked(item)"
      >
        <template #menu>
          <GroupMenu
            :group-item="item"
            :idx="idx"
            :enable-edit="false"
            @group-item-delete="handleGroupItemDelete"
            @group-item-edit="handleGroupItemEdit"
            @group-item-rename="handleGroupItemRename"
          />
        </template>
      </BasicGroupItem>
    </div>
    <ComboEdit
      v-model:visible="editVisible"
      :group-length="groupList.length"
      :fnc-generate-code="generateGroupCode"
      @create-group="handleGroupCreated"
    />
  </div>
</template>
