<script setup lang="ts">
import { ref } from 'vue';
import { NSelect } from 'naive-ui';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { KeyTypeEnum } from '@/enum/keyType';
import { addSOCD, deleteSOCDByCode, getSOCDList, getTargetSOCD, resetSOCDName } from '@/api/super-key';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import { $t } from '@/locales';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';
import { SOCDTriggerOps } from '../config';
import { formatGroupItem, GroupItem, useModuleLogic, utilGenerateGroupCode } from '../hooks';

const MAX_GORUP_CNT = 8;
const CURRENT_MODULE_TYPE = KeyTypeEnum.SOCD;


const groupList = ref<GroupItem[]>([]);
const modalTitle = ref('SOCD');

const { groupCreated, groupItemDelete, groupRename, editCtrl, renameCtrl, updateEditCache, beforeEditModalOpen } = useModuleLogic(groupList, {
  delFnc: deleteSOCDByCode,
  addFnc: <any>addSOCD,
  getGroupFnc: getTargetSOCD,
  renameFnc: resetSOCDName,
}, {
  CURRENT_MODULE_TYPE
})



const emit = defineEmits(['key-clicked']);

// 优先触发
const trigger = ref<number>(0);
const socdList = ref<any>([]);

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
  const { socd } = await getSOCDList();
  socdList.value = socd;
  groupList.value = socd.map(item => {
    return formatGroupItem(Object.assign({}, item, { name: 'SOCD' })) as GroupItem;
  });
}
updateGroupList();
function handleGroupItemClicked(item: GroupItem) {
  const { base: { code, type } } = item;
  emit('key-clicked', {
    code,
    type
  });
}
async function handleGroupItemEdit(items: any, idx: number) {
  await beforeEditModalOpen(items, idx);
  trigger.value = socdList.value[idx].trigger;
}
function generateGroupCode() {
  if (groupList.value.length === 0) return 0;
  return utilGenerateGroupCode(groupList.value)
}

</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd v-if="groupList.length < 8" icon="add" :desc="`${$t('common.add')} SOCD`" @click="handleAddClicked" />
      <BasicGroupItem v-for="(item, idx) in groupList" :key="item.viewId" :base="item.base" :key-list="item.keyList"
        code-preffix="S" class="hover:cursor-pointer" @click="handleGroupItemClicked(item)">
        <template #menu>
          <GroupMenu :group-item="item" :idx="idx" :enable-edit="true" :enable-rename="true"
            @group-item-delete="groupItemDelete" @group-item-edit="handleGroupItemEdit" @group-item-rename="updateEditCache"
            @click.stop />
        </template>
      </BasicGroupItem>
    </div>
    <EditTemplate v-model:visible="editCtrl.show" v-model:title="modalTitle" :code-type="KeyTypeEnum.SOCD"
      :fnc-generate-code="generateGroupCode" :need-import-key="false" keyboard-type="base"
      :desc="$t('repidTrigger.triggerDeadZone')" :edit-item="editCtrl.item" @create-group="groupCreated">
      <template #header-extra>
        <div class="flex items-center">
          <span class="text-4 text-[#999999]">{{ $t('supperKey.priorityExe') }}</span>
          <NSelect v-model:value="trigger"  to="#popover-portal" class="ml-3 w-45" size="large" :options="SOCDTriggerOps"
            ></NSelect>
        </div>
      </template>
    </EditTemplate>
    <RenameModal :show="renameCtrl.show" :list-edit-index="renameCtrl.idx" :name="editCtrl.item.base.name"
      @update:show="renameCtrl.show = $event" @rename="groupRename" />
  </div>
</template>
