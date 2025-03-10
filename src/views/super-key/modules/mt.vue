<script setup lang="ts">
import { onMounted, ref, toRef, toRefs, watch } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { addMT, deleteMTByCode, getMTList, getTargetMT, resetMTName } from '@/api/super-key';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import { $t } from '@/locales';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';

import { formatGroupItem, GroupItem, useModuleLogic, utilGenerateGroupCode } from '../hooks';

const MAX_GORUP_CNT = 8;
const CURRENT_MODULE_TYPE = KeyTypeEnum.MT;

const groupList = ref<GroupItem[]>([]);
const modalTitle = ref('单击/按住');

const { groupCreated, groupItemDelete, groupRename, editCtrl, renameCtrl, updateEditCache, beforeEditModalOpen } = useModuleLogic(groupList, {
  delFnc: deleteMTByCode,
  addFnc: <any>addMT,
  getGroupFnc: <any>getTargetMT,
  renameFnc: resetMTName,
}, {
  CURRENT_MODULE_TYPE
})
const keyboardStore = useKeyboardStore();
// 按住时间
const inputTime = ref(200);
const mtList = ref<any>([]);

const { selectedKeys } = toRefs(keyboardStore);
const activeKeyLayer = toRef(keyboardStore, 'activeKeyLayer');

let keyId = '';

onMounted(() => {
  watch(
    () => selectedKeys.value,
    newSelectedKeys => {
      const keys = Object.keys(newSelectedKeys);
      keyId = keys.length > 0 ? keys[0] : '';
    }
  );
});

function handleAddClicked() {
  const superKey = activeKeyLayer.value.superKeyMap[keyId];
  console.log('handleAddClicked', superKey);
  if (keyId === '') {
    window.$message!.info($t('supperKey.plsSelectKey'));
    return;
  }
  if (superKey?.dks) {
    window.$message!.info($t('supperKey.keyBinedDKSFunc'));
    return;
  }
  if (groupList.value.length >= MAX_GORUP_CNT) {
    window.$message!.warning($t('supperKey.maxAddCombinKey', { total: MAX_GORUP_CNT }));
    return;
  }
  inputTime.value = 200;
  editCtrl.item = {
    base: { code: -1, type: KeyTypeEnum.None, name: '' }, keyList: [
      selectedKeys.value[keyId].detail
    ], keyBaseList: [
      selectedKeys.value[keyId].base
    ]
  };
  editCtrl.isEdit = false;
  editCtrl.show = true;
}
async function updateGroupList() {
  const { mt } = await getMTList({ pageNo: 1, pageSize: 8 });
  mtList.value = mt;
  groupList.value = mt.map(item => {
    return formatGroupItem(Object.assign({}, item, { name: $t('supperKey.singleKeyStop') })) as GroupItem;
  });
}
updateGroupList();

function handleGroupItemClicked({ base }: { base: GroupItem['base'] }) {
  console.log('handleGroupItemClicked', base);
}
async function handleGroupItemEdit(items: any, idx: number) {
  updateEditCache(items, idx);
  inputTime.value = mtList.value[idx].time;
}
function generateGroupCode() {
  if (groupList.value.length === 0) return 0;
  return utilGenerateGroupCode(groupList.value)
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd v-if="groupList.length < MAX_GORUP_CNT" icon="add" :desc="$t('supperKey.addClickDown')"
        @click="handleAddClicked" />
      <BasicGroupItem v-for="(item, idx) in groupList" :key="item.viewId" :base="item.base" :key-list="item.keyList"
        code-preffix="M" class="hover:cursor-pointer" @click="handleGroupItemClicked(item)">
        <template #menu>
          <GroupMenu :group-item="item" :idx="idx" :enable-edit="true" :enable-rename="false"
            @group-item-delete="groupItemDelete" @group-item-edit="beforeEditModalOpen"
            @group-item-rename="handleGroupItemEdit" @click.stop />
        </template>
      </BasicGroupItem>
    </div>
    <EditTemplate v-model:visible="editCtrl.show" v-model:title="modalTitle" :code-type="CURRENT_MODULE_TYPE"
      :fnc-generate-code="generateGroupCode" :need-import-key="true" :wide="true" keyboard-type="standard"
      :desc="$t('supperKey.setClickDowndown1down2')" :edit-item="editCtrl.item" @create-group="groupCreated"
      :is-edit="editCtrl.isEdit">
      <template #extra>
        <div class="flex items-center justify-center">
          <NInputNumber
          v-model:value="inputTime"
          style="width: 60px"
          type="text"
          size="large"
          :min="1"
          :max="2000"
            :step="1"
            :precision="0"
            :show-button="false"
            :autofocus="false"
            placeholder="">
          </NInputNumber>
          <span class="ml-3 text-4 text-[#999999]">ms</span>
        </div>
      </template>
    </EditTemplate>
    <RenameModal :show="renameCtrl.show" :list-edit-index="renameCtrl.idx" :name="editCtrl.item.base.name"
      @update:show="renameCtrl.show = $event" @rename="groupRename" />
  </div>
</template>
