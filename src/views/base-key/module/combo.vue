<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { KeyTypeEnum } from '@/enum/keyType';
import { createComboGroup, deleteComboGroup, getComboGroup, getComboList } from '@/api/combo';
import { useKeyboardStore } from '@/store/modules/keyboard';
import GroupMenu from '@/views/super-key/components/group-menu.vue';
import type { BaseKey as BaseKeyType } from '@/api/modules/combo';
import { $t } from '@/locales';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import { useCommonStore } from '@/store/modules/common';
import ComboEdit from '../components/combo-edit.vue';
import ComboLock from '../components/combo-lock.vue';
const keyboardStore = useKeyboardStore();
const { getKeyDetail } = keyboardStore;
const commonStore = useCommonStore();
const groupList = ref<any>([]);
const editVisible = ref(false);
const lockVisible = ref(false);
const MAC_GORUP_CNT = 20;
const emit = defineEmits(['key-clicked']);

const showRenameModal = ref(false);
const listEditIndex = ref(-1);
const editItemName = ref('');

let editItem = reactive<{
  idx: number;
  list: {
    base: BaseKeyType;
    detail: any;
  }[];
}>({ idx: 0, list: [] });

let isEdit = false;
let editItemCode = 0;

function handleAddClicked() {
  if (groupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning(`最多只能添加${MAC_GORUP_CNT}个组合键`);
    return;
  }
  // opent edit modal(dialog)
  editItem = { idx: 0, list: [] };
  isEdit = false;
  editVisible.value = true;
}

async function updateGroupList() {
  try {
    console.log('getShortcuts');
    const { shortcuts } = await getComboList();
    console.log('getShortcuts ret', shortcuts);
    groupList.value = shortcuts.map(item => {
      const { code, type } = item;
      let name = `组合按键${item.code + 1}`;
      const itemName = getLocalName(item.type, item.code);
      if (itemName) {
        name = itemName;
      }
      editItemName.value = name;
      return {
        base: { code, type, name },
        keyList: [] as any[]
        // keyList: item.keys.map(keyBase => {
        //   const res = getKeyDetail({ code: keyBase.code, type: keyBase.type });
        //   updateGroupEffect(keyBase.key!, toRaw(currentSuperKeyType.value), res);
        //   return res;
        // })
      };
    });
    window.$message!.success('读取成功');
  } catch (error) {
    console.error('handleGroupCreated', error);
    window.$message!.error('读取失败, 请更新最新固件后重试');
  }
}
onMounted(async () => {
  updateGroupList();
});
async function handleGroupCreated({ code, key: _key, keys }: { code: number; key: string; keys: any[] }) {
  try {
    let tmpCode = code;
    if (isEdit) {
      tmpCode = editItemCode;
    }
    const type = KeyTypeEnum.Combo;

    await createComboGroup({ code: tmpCode, keys, type });
    updateGroupList();
    // groupList.value.push({
    //   base: {
    //     code,
    //     key,
    //     type,
    //     name: `组合按键${code}`
    //   },
    //   keyList: keys
    // });
    // keyboardStore.updateSuperKey(key, { moduleType: type });
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
async function handleGroupItemDelete(item: any, idx: number) {
  try {
    const ret = await deleteComboGroup({ code: item.base.code });
    console.log('delShortcut ret', ret);
    const simpleBase = { code: item.base.code, type: item.base.type };
    const keyId = await commonStore.updateComboKeyTag('', simpleBase, { type: 'remove', updateOrigin: true });
    if (keyId) {
      keyboardStore.removeSuperKey(keyId as string, { moduleType: KeyTypeEnum.Combo });
    }
    removeLocalName(KeyTypeEnum.Combo, item.base.code);
    groupList.value.splice(idx, 1);

    window.$message!.success($t('businessCommon.delSuccess'));
  } catch (error) {
    console.error('handleGroupItemDelete', error);
    window.$message!.error($t('businessCommon.delFailPlsUpdate'));
  }
}
async function handleGroupItemEdit(items: any, idx: number) {
  // feat: open edit modal(dialog), and transform data
  console.log('handleGroupItemEdit', items, idx);
  try {
    console.log('getShortcut', items.base.code);
    editItemCode = items.base.code;
    const ret = await getComboGroup({ code: items.base.code, type: items.base.type });
    console.log('getShortcut ret', ret);
    editItem.list = [];
    ret.keys.forEach(key => {
      const res = getKeyDetail({ code: key.code, type: key.type });
      editItem.list.push({
        base: { code: key.code, type: key.type, key: '' },
        detail: res
      });
    });
    isEdit = true;
    editItem.idx = idx;
    editVisible.value = true;
  } catch (error) {
    console.error('handleGroupItemEdit', error);
    window.$message!.error('获取组合键信息失败, 请更新最新固件后重试');
  }
}
function generateGroupCode() {
  if (groupList.value.length === 0) return 0;
  const usedCodes = new Set(groupList.value.map((group: { base: { code: number } }) => group.base.code));
  let newCode = 0;
  while (usedCodes.has(newCode)) {
    newCode++;
  }
  return newCode;
}
function handleGroupItemRename(items: any, idx: number) {
  // feat: rename group name
  console.log('handleGroupItemRename', items, idx);
  listEditIndex.value = idx;
  showRenameModal.value = true;
}

async function handleReNameSave(data: { name: string }) {
  if (data.name === '' || listEditIndex.value === -1) return;
  const defName = `组合按键${listEditIndex.value + 1}`;
  if (defName === `${data.name}${listEditIndex.value + 1}`) return;
  addLocalName(KeyTypeEnum.Combo, listEditIndex.value, data.name);
  showRenameModal.value = false;
  updateGroupList();
}

function getLocalName(type: number, code: number) {
  return localStorage.getItem(`${type}-${code}`);
}
function addLocalName(type: number, code: number, name: string) {
  localStorage.setItem(`${type}-${code}`, name);
}

function removeLocalName(type: number, code: number) {
  localStorage.removeItem(`${type}-${code}`);
}
function handleLockCombo() {
  lockVisible.value = true;
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd icon="add" :desc="$t('baseKey.combination.addCombKey')" @click="handleAddClicked" />
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
            :enable-edit="true"
            :enable-rename="true"
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
      :edit-item="editItem"
      @create-group="handleGroupCreated"
    />
    <RenameModal
      :show="showRenameModal"
      :name="editItemName"
      @update:show="showRenameModal = $event"
      @rename="handleReNameSave"
    />
    <ComboLock v-model:visible="lockVisible" />
  </div>
</template>
