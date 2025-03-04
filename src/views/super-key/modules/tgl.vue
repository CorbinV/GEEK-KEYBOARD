<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, reactive, ref, toRaw, toRef, toRefs, watch } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { addTGL, deleteTGLByCode, getTargetTGL, getTGLList, resetTGLName } from '@/api/super-key';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import { $t } from '@/locales';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';

import { formatGroupItem, GroupItem, useModuleLogic, utilGenerateGroupCode } from '../hooks';

const MAX_GORUP_CNT = 8;
const CURRENT_MODULE_TYPE = KeyTypeEnum.MT;
const groupList = ref<any[]>([]);
const modalTitle = ref($t('businessCommon.switchSwitch'));

const { groupCreated, groupItemDelete, groupRename, editCtrl, renameCtrl, updateEditCache, beforeEditModalOpen } = useModuleLogic(groupList, {
  delFnc: deleteTGLByCode,
  addFnc: <any>addTGL,
  getGroupFnc: <any>getTargetTGL,
  renameFnc: resetTGLName,
}, {
  CURRENT_MODULE_TYPE
})



// const emit = defineEmits(['key-clicked']);
const keyboardStore = useKeyboardStore();
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
  if (keyId === '') {
    window.$message!.info($t('supperKey.plsSelectKey'));
    return;
  }
  if (superKey?.dks) {
    window.$message!.info($t('supperKey.keyBinedDKSFunc'));
    return;
  }
  if (superKey?.sp?.length) {
    window.$message!.info($t('supperKey.keyBinedOtherFunc'));
    return;
  }
  if (groupList.value.length >= MAX_GORUP_CNT) {
    window.$message!.warning($t('supperKey.keyBinedOtherFunc', { total: MAX_GORUP_CNT }));
    return;
  }
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
  const {tgl} = await getTGLList({ pageNo: 1, pageSize: 8 });
  groupList.value = tgl.map(item => {
    return formatGroupItem(Object.assign({}, item, { name: $t('supperKey.singleKeyStop') })) as GroupItem;
  });
}
updateGroupList();

function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.TGL } }) {
  console.log('handleGroupItemClicked', base);
}
function generateGroupCode() {
  if (groupList.value.length === 0) return 0;
  return utilGenerateGroupCode(groupList.value)
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd v-if="groupList.length < 8" icon="add" :desc="$t('businessCommon.addSwtich')"
        @click="handleAddClicked" />
      <BasicGroupItem v-for="(item, idx) in groupList" :key="item.code" :base="item.base" :key-list="item.keyList"
        code-preffix="T" class="hover:cursor-pointer" @click="handleGroupItemClicked(item)">
        <template #menu>
          <GroupMenu :group-item="item" :idx="idx" :enable-edit="true" :enable-rename="false"
            @group-item-delete="groupItemDelete" @group-item-edit="beforeEditModalOpen"
            @group-item-rename="updateEditCache" @click.stop />
        </template>
      </BasicGroupItem>
    </div>
    <EditTemplate v-model:visible="editCtrl.show" v-model:title="modalTitle" :code-type="CURRENT_MODULE_TYPE"
      :fnc-generate-code="generateGroupCode" :need-import-key="true" :wide="true" keyboard-type="standard"
      :desc="$t('businessCommon.plsSetSwitchKeys')" :edit-item="editCtrl.item" @create-group="groupCreated">
    </EditTemplate>
    <RenameModal :show="renameCtrl.show" :list-edit-index="renameCtrl.idx" :name="editCtrl.item.base.name"
      @update:show="renameCtrl.show = $event" @rename="groupRename" />
  </div>
</template>
