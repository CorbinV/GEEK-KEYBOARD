<script setup lang="ts">
import type { Ref } from 'vue';
import { reactive, ref, toRaw, toRef } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { addRS, deleteRSByCode, getRSList, resetRSName } from '@/api/super-key';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import { $t } from '@/locales';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';
const rsGroupList = ref<any>([]);
const editVisible = ref(false);
const modalTitle = ref('灵动触发按键');
const MAC_GORUP_CNT = 8;
// const emit = defineEmits(['key-clicked']);
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey, removeSuperKey } = keyboardStore;
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;
type GroupItem = {
  base: { code: number; type: KeyTypeEnum; name: string; key?: string };
  keyList: any[];
  keyBaseList: any[];
};
let editItem = reactive<GroupItem>({
  base: { code: -1, type: KeyTypeEnum.None, name: '', key: '' },
  keyList: [],
  keyBaseList: []
});

const showRenameModal = ref(false);
const renameIndex = ref(-1);

let isEdit = false;
const editItemCode = 0;

function handleAddClicked() {
  if (rsGroupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning($t('supperKey.maxAddCombinKey', { total: MAC_GORUP_CNT }));
    return;
  }
  editItem = { base: { code: -1, type: KeyTypeEnum.None, name: '' }, keyList: [], keyBaseList: [] };
  isEdit = false;
  editVisible.value = true;
}
function updateGroupEffect(key: string, moduleType: KeyTypeEnum) {
  updateSuperKey(key!, { moduleType });
}
async function updateGroupList() {
  const { rs } = await getRSList({ pageNo: 1, pageSize: 8 });
  rsGroupList.value = rs.map(item => {
    const { code, type } = item;
    return {
      base: { code, type },
      keyList: item.keys.map(keyBase => {
        const res = getKeyDetail({ code: keyBase.code, type: keyBase.type });
        updateGroupEffect(keyBase.key!, toRaw(currentSuperKeyType.value), res);
        return res;
      }),
      keyBaseList: item.keys.map(keyBase => {
        return keyBase;
      })
    };
  });
}
updateGroupList();
async function handleGroupCreated({ code, keys, name, listDetail }: any) {
  try {
    console.log('code', code, 'keys', keys, 'name', name, 'listDetail', listDetail);
    let tmpCode = code;
    if (isEdit) {
      tmpCode = editItemCode;
      editItem.keyBaseList.forEach((listItem: any) => {
        removeSuperKey(listItem.key!, { moduleType: KeyTypeEnum.RS });
      });
    }
    const type = KeyTypeEnum.RS;
    await addRS({ type, code: tmpCode, keys });
    updateGroupList();
    // rsGroupList.value.push({
    //   base: {
    //     code,
    //     name
    //   },
    //   keyList: listDetail.map((item: any) => {
    //     return item.detail;
    //   })
    // });
    window.$message!.success($t('businessCommon.addSuccess'));
  } catch (e) {
    window.$message!.error($t('businessCommon.addFailPlsUpdate'));
    console.error(e);
  }
}

function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.RS } }) {
  console.log('handleGroupItemClicked', base);
  // const { code, type } = base;
  // emit('key-clicked', {
  //   code,
  //   type
  // });
}
async function handleGroupItemDelete(item: any, idx: number) {
  try {
    console.log('handleGroupItemDelete', JSON.stringify(item), idx);
    await deleteRSByCode({ code: item.base.code });
    rsGroupList.value.splice(idx, 1);
    item.keyBaseList.forEach((listItem: any) => {
      removeSuperKey(listItem.key!, { moduleType: KeyTypeEnum.RS });
    });
    window.$message!.success($t('businessCommon.delSuccess'));
  } catch (error) {
    window.$message!.error($t('businessCommon.delFailPlsUpdate'));
    console.error(error);
  }
}
async function handleGroupItemEdit(items: any, idx: number) {
  // feat: open edit modal(dialog), and transform data
  console.log('handleGroupItemEdit', items, idx);
  editItem = items;
  isEdit = true;
  editVisible.value = true;
}
async function handleGroupItemRename(items: any, idx: number) {
  // feat: rename group name
  console.log('handleGroupItemRename', items, idx);
  editItem = items;
  renameIndex.value = idx;
  showRenameModal.value = true;
}
function generateGroupCode() {
  if (rsGroupList.value.length === 0) return 0;
  const usedCodes = new Set(rsGroupList.value.map((group: { base: { code: number } }) => group.base.code));
  let newCode = 0;
  while (usedCodes.has(newCode)) {
    newCode++;
  }
  return newCode;
}
async function handleReNameSave(data: { name: string }) {
  console.log('handleReNameSave', data.name);
  if (data.name === '') return;
  try {
    await resetRSName({ code: editItem.base.code, name: data.name });
    editItem.base.name = data.name;
    showRenameModal.value = false;
    rsGroupList.value[renameIndex.value].base.name = data.name;
  } catch (error) {
    console.log('error', error);
  }
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd v-if="rsGroupList.length < 8" icon="add" desc="添加灵动触发按键" @click="handleAddClicked" />
      <BasicGroupItem
        v-for="(item, idx) in rsGroupList"
        :key="item.code"
        :base="item.base"
        :key-list="item.keyList"
        code-preffix="R"
        class="hover:cursor-pointer"
        @click="handleGroupItemClicked(item)"
      >
        <template #menu>
          <GroupMenu
            :group-item="item"
            :idx="idx"
            :enable-edit="true"
            :enable-rename="false"
            @group-item-delete="handleGroupItemDelete"
            @group-item-edit="handleGroupItemEdit"
            @group-item-rename="handleGroupItemRename"
            @click.stop
          />
        </template>
      </BasicGroupItem>
    </div>
    <EditTemplate
      v-model:visible="editVisible"
      v-model:title="modalTitle"
      :code-type="KeyTypeEnum.RS"
      :fnc-generate-code="generateGroupCode"
      :need-import-key="false"
      keyboard-type="standard"
      second-title="监控两个按键，当两个按键同事按下时，触发按压更深的按键"
      desc="*例：设置AB键为RS键，当A键按压比D键更深时，A键触发，抬起A键后，D键将恢复触发"
      :edit-item="editItem"
      @create-group="handleGroupCreated"
    ></EditTemplate>
    <RenameModal
      :show="showRenameModal"
      :list-edit-index="renameIndex"
      :name="editItem.base.name"
      @update:show="showRenameModal = $event"
      @rename="handleReNameSave"
    />
  </div>
</template>
