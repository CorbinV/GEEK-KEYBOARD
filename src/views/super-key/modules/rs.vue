<script setup lang="ts">
import {  ref } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { KeyTypeEnum } from '@/enum/keyType';
import { addRS, deleteRSByCode, getRSList, getTargetRS, resetRSName } from '@/api/super-key';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import { $t } from '@/locales';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';
import { formatGroupItem, GroupItem, useModuleLogic, utilGenerateGroupCode } from '../hooks';

const CURRENT_MODULE_TYPE = KeyTypeEnum.RS;
const MAX_GORUP_CNT = 8;
const groupList = ref<any>([]);
const modalTitle = ref($t('supperKey.c5'));

const { groupCreated, groupItemDelete, groupRename, editCtrl, renameCtrl, updateEditCache, beforeEditModalOpen } = useModuleLogic(groupList, {
  delFnc: deleteRSByCode,
  addFnc: <any>addRS,
  getGroupFnc: getTargetRS,
  renameFnc: resetRSName,
}, {
  CURRENT_MODULE_TYPE
})

function handleAddClicked() {
  if (groupList.value.length >= MAX_GORUP_CNT) {
    window.$message!.warning($t('supperKey.maxAddCombinKey', { total: MAX_GORUP_CNT }));
    return;
  }
  editCtrl.item = { base: { code: -1, type: KeyTypeEnum.None, name: '' }, keyList: [], keyBaseList: [] };
  editCtrl.isEdit = false;
  editCtrl.show = true;
}
async function updateGroupList() {
  const { rs } = await getRSList({ pageNo: 1, pageSize: 8 });
  groupList.value = rs.map(item => {
    return formatGroupItem(Object.assign({}, item, { name: $t('supperKey.c5') })) as GroupItem;
  });
}
updateGroupList();
function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.RS } }) {
  console.log('handleGroupItemClicked', base);
  // const { code, type } = base;
  // emit('key-clicked', {
  //   code,
  //   type
  // });
}
function generateGroupCode() {
  if (groupList.value.length === 0) return 0;
  return utilGenerateGroupCode(groupList.value)
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd v-if="groupList.length < 8" icon="add" :desc="`${$t('common.add')} ${$t('supperKey.c5')}`" @click="handleAddClicked" />
      <BasicGroupItem v-for="(item, idx) in groupList" :key="item.code" :base="item.base" :key-list="item.keyList"
        code-preffix="R" class="hover:cursor-pointer" @click="handleGroupItemClicked(item)">
        <template #menu>
          <GroupMenu :group-item="item" :idx="idx" :enable-edit="true" :enable-rename="false"
            @group-item-delete="groupItemDelete" @group-item-edit="beforeEditModalOpen"
            @group-item-rename="updateEditCache" @click.stop />
        </template>
      </BasicGroupItem>
    </div>
    <EditTemplate v-model:visible="editCtrl.show" v-model:title="modalTitle" :code-type="CURRENT_MODULE_TYPE"
      :fnc-generate-code="generateGroupCode" :need-import-key="false" keyboard-type="base"
      :second-title="$t('supperKey.c7')" :desc="$t('supperKey.c8')"
      :edit-item="editCtrl.item" @create-group="groupCreated" :is-edit="editCtrl.isEdit"></EditTemplate>
    <RenameModal :show="renameCtrl.show" :list-edit-index="renameCtrl.idx" :name="editCtrl.item.base.name"
      @update:show="renameCtrl.show = $event" @rename="groupRename" />
  </div>
</template>
