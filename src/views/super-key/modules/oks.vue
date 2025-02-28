<script setup lang="ts">
import {ref } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { KeyTypeEnum } from '@/enum/keyType';
import { addOks, deleteOksByCode, getOksList, getTargetOks, resetOksName } from '@/api/super-key';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import { $t } from '@/locales';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';
import { formatGroupItem, GroupItem, useModuleLogic, utilGenerateGroupCode } from '../hooks';

const MAX_GORUP_CNT = 8;
const CURRENT_MODULE_TYPE = KeyTypeEnum.OKS;

const groupList = ref<GroupItem[]>([]);
const modalTitle = ref($t('supperKey.singleKeyStop'));

const { groupCreated, groupItemDelete, groupRename, editCtrl, renameCtrl, updateEditCache, beforeEditModalOpen } = useModuleLogic(groupList, {
  delFnc: deleteOksByCode,
  addFnc: <any>addOks,
  getGroupFnc: getTargetOks,
  renameFnc: resetOksName,
}, {
  CURRENT_MODULE_TYPE
})

function handleAddClicked() {
  if (groupList.value.length >= MAX_GORUP_CNT) {
    window.$message!.warning(`最多只能添加${MAX_GORUP_CNT}个组合键`);
    return;
  }
  // if (Object.keys(selectedKeys.value).length === 0) {
  //   window.$message!.info('请选择按键');
  //   return;
  // }
  editCtrl.item = { base: { code: -1, type: KeyTypeEnum.None, name: '' }, keyList: [], keyBaseList: [] };
  editCtrl.isEdit = false;
  editCtrl.show = true;
}
async function updateGroupList() {
  const { oks } = await getOksList();
  groupList.value = oks.map(item => {
    return formatGroupItem(Object.assign({}, item, { name: $t('supperKey.singleKeyStop') })) as GroupItem;
  });
}
updateGroupList();

function handleGroupItemClicked(_: any) { }
function generateGroupCode() {
  if (groupList.value.length === 0) return 0;
  return utilGenerateGroupCode(groupList.value)
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd v-if="groupList.length < MAX_GORUP_CNT" icon="add" :desc="$t('supperKey.x1')"
        @click="handleAddClicked" />
      <BasicGroupItem v-for="(item, idx) in groupList" :key="item.viewId" :base="item.base" :key-list="item.keyList"
        code-preffix="O" class="hover:cursor-pointer" @click="handleGroupItemClicked(item)">
        <template #menu>
          <GroupMenu :group-item="item" :idx="idx" :enable-edit="true" :enable-rename="false"
            @group-item-delete="groupItemDelete" @group-item-edit="beforeEditModalOpen"
            @group-item-rename="updateEditCache" @click.stop />
        </template>
      </BasicGroupItem>
    </div>
    <EditTemplate v-model:visible="editCtrl.show" v-model:title="modalTitle" :code-type="CURRENT_MODULE_TYPE"
      :fnc-generate-code="generateGroupCode" :need-import-key="false" keyboard-type="base" :desc="$t('supperKey.c6')"
      :edit-item="editCtrl.item" @create-group="groupCreated" :is-edit="editCtrl.isEdit"></EditTemplate>
    <RenameModal :show="renameCtrl.show" :list-edit-index="renameCtrl.idx" :name="editCtrl.item.base.name"
      @update:show="renameCtrl.show = $event" @rename="groupRename" />
  </div>
</template>
