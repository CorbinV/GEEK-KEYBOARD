<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, reactive, ref, toRaw, toRef, toRefs, watch } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { addTGL, deleteTGLByCode, getTGLList, resetTGLName } from '@/api/super-key';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import { $t } from '@/locales';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';
const groupList = ref<any[]>([]);
const editVisible = ref(false);
const modalTitle = ref($t('businessCommon.switchSwitch'));
const MAC_GORUP_CNT = 8;
// const emit = defineEmits(['key-clicked']);
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey, removeSuperKey } = keyboardStore;
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;
let editItem = reactive<{
  base: { code: number; type: KeyTypeEnum; name: ''; key: '' };
  keyList: any[];
  keyBaseList: any[];
}>({ base: { code: -1, type: KeyTypeEnum.None, name: '', key: '' }, keyList: [], keyBaseList: [] });

const { selectedKeys } = toRefs(keyboardStore);
const activeKeyLayer = toRef(keyboardStore, 'activeKeyLayer');

let keyId = '';
const showRenameModal = ref(false);
const renameIndex = ref(-1);

let isEdit = false;
let editItemCode = 0;
function handleMittEvent() {
  emitter.on(EventNameEnum.resetKey, (key: string) => {
    if (!key) {
      return;
    }
    groupList.value.forEach((group, idx: number) => {
      const matchingKeyBase = group.base.key === key;
      if (matchingKeyBase) {
        handleGroupItemDelete(group, idx);
      }
    });
  });
}
onMounted(() => {
  watch(
    () => selectedKeys.value,
    newSelectedKeys => {
      const keys = Object.keys(newSelectedKeys);
      keyId = keys.length > 0 ? keys[0] : '';
    }
  );
  handleMittEvent();
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
  if (groupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning($t('supperKey.keyBinedOtherFunc', { total: MAC_GORUP_CNT }));
    return;
  }
  isEdit = false;
  editVisible.value = true;
}
function updateGroupEffect(key: string, moduleType: KeyTypeEnum) {
  updateSuperKey(key!, { moduleType });
}
async function updateGroupList() {
  console.log('getTGLList');
  const ret = await getTGLList({ pageNo: 1, pageSize: 8 });
  console.log('getTGLList ret', ret);
  groupList.value = ret.tgl.map(item => {
    const { code, type, key } = item;
    return {
      base: { code, type, key },
      keyList: item.keys.map(keyBase => {
        const res = getKeyDetail({ code: keyBase.code, type: keyBase.type });
        updateGroupEffect(key!, toRaw(currentSuperKeyType.value));
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
    console.log('handleGroupCreated', code, keys, name, listDetail);
    let tmpCode = code;
    let key = keys[0].key;
    if (isEdit) {
      tmpCode = editItemCode;
      key = editItem.base.key;
    }
    // const key = keys[0].key;
    const type = KeyTypeEnum.TGL;
    await addTGL({ type, code: tmpCode, keys: keys.map((item: any) => ({ code: item.code, type: item.type })), key });

    updateGroupList();
    // emit(
    //   'key-clicked',
    //   {
    //     code: keys[0].code,
    //     type: keys[0].type,
    //     keyId: keys[0].key
    //   },
    //   { toDevice: false }
    // );

    // groupList.value.push({
    //   base: {
    //     code,
    //     name,
    //     key: keys[0].key,
    //     type: KeyTypeEnum.TGL
    //   },
    //   keyList: listDetail.map((item: any) => {
    //     return item.detail;
    //   }),
    //   keyBaseList: keys.map((keyBase: any) => {
    //     return keyBase;
    //   })
    // });
    // const res = getKeyDetail({ code: keys[1].code, type: keys[1].type });
    // updateGroupEffect(keys[0].key!, toRaw(currentSuperKeyType.value), res);
    window.$message!.success($t('businessCommon.addSuccess'));
  } catch (e) {
    window.$message!.error($t('businessCommon.addFailPlsUpdate'));
    console.error(e);
  }
}

function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.TGL } }) {
  console.log('handleGroupItemClicked', base);
}
async function handleGroupItemDelete(item: any, idx: number) {
  console.log('handleGroupItemDelete', JSON.stringify(item), idx);
  try {
    await deleteTGLByCode({ code: item.base.code });
    groupList.value.splice(idx, 1);
    removeSuperKey(item.base.key!, { moduleType: KeyTypeEnum.TGL });
    window.$message!.success($t('businessCommon.delSuccess'));
  } catch (error) {
    window.$message!.error($t('businessCommon.delFailPlsUpdate'));
    console.error(error);
  }
}
async function handleGroupItemEdit(items: any, idx: number) {
  // feat: open edit modal(dialog), and transform data
  editItemCode = items.base.code;
  editItem = items;
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
  if (groupList.value.length === 0) return 0;
  const usedCodes = new Set(groupList.value.map((group: { base: { code: number } }) => group.base.code));
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
    await resetTGLName({ code: editItem.base.code, name: data.name });
    // editItem.base.name = data.name;
    showRenameModal.value = false;
    groupList.value[renameIndex.value].base.name = data.name;
  } catch (error) {
    console.log('error', error);
  }
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd
        v-if="groupList.length < 8"
        icon="add"
        :desc="$t('businessCommon.addSwtich')"
        @click="handleAddClicked"
      />
      <BasicGroupItem
        v-for="(item, idx) in groupList"
        :key="item.code"
        :base="item.base"
        :key-list="item.keyList"
        code-preffix="T"
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
      :code-type="KeyTypeEnum.TGL"
      :fnc-generate-code="generateGroupCode"
      :need-import-key="true"
      :wide="true"
      keyboard-type="standard"
      :desc="$t('businessCommon.plsSetSwitchKeys')"
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
