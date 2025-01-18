<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, reactive, ref, toRaw, toRef, toRefs, watch } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { addMT, deleteMTByCode, getMTList, resetMTName } from '@/api/super-key';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import { $t } from '@/locales';
import { formatLableSub3 } from '@/hooks/common/format';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';

type GroupItem = {
  base: { code: number; type: KeyTypeEnum; name: string; key?: string };
  keyList: any[];
  keyBaseList: any[];
};
const groupList = ref<GroupItem[]>([]);
const editVisible = ref(false);
const modalTitle = ref('单击/按住');
const MAC_GORUP_CNT = 8;
// const emit = defineEmits(['key-clicked']);
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey, removeSuperKey } = keyboardStore;
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;
// 按住时间
const inputTime = ref(200);
const mtList = ref<any>([]);
let editItem = reactive<GroupItem>({
  base: { code: -1, type: KeyTypeEnum.None, name: '', key: '' },
  keyList: [],
  keyBaseList: []
});
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
    groupList.value.forEach((group, idx) => {
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
  console.log('handleAddClicked', superKey);
  if (keyId === '') {
    window.$message!.info($t('supperKey.plsSelectKey'));
    return;
  }
  if (superKey?.dks) {
    window.$message!.info($t('supperKey.keyBinedDKSFunc'));
    return;
  }
  if (groupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning($t('supperKey.maxAddCombinKey', { total: MAC_GORUP_CNT }));
    return;
  }
  inputTime.value = 200;
  isEdit = false;
  editVisible.value = true;
}
function updateGroupEffect(key: string, moduleType: KeyTypeEnum, res?: any) {
  const mtCfg = formatLableSub3(res);
  updateSuperKey(key!, { moduleType, mtCfg });
}
async function updateGroupList() {
  console.log('getMTList');
  const ret = await getMTList({ pageNo: 1, pageSize: 8 });
  console.log('getMTList ret', ret);
  mtList.value = ret.mt;
  groupList.value = ret.mt.map(item => {
    const { code, type, time, key } = item;
    return {
      base: { code, type, time, key, name: '' },
      keyList: item.keys.map(keyBase => {
        const res = getKeyDetail({ code: keyBase.code, type: keyBase.type });
        updateGroupEffect(key!, toRaw(currentSuperKeyType.value), res);
        // if (index === 0) {
        //   emit(
        //     'key-clicked',
        //     {
        //       code: keyBase.code,
        //       type: keyBase.type,
        //       keyId: key
        //     },
        //     { toDevice: false }
        //   );
        //   console.log('key-clicked', keyBase.code, keyBase.type, key);
        //   console.log('key-clicked', index, res);
        // }
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
  console.log('handleGroupCreated code', code);
  console.log('handleGroupCreated keys', keys);
  console.log('handleGroupCreated name', name);
  console.log('handleGroupCreated listDetail', listDetail);

  let tmpCode = code;
  let tmpKey = keys[0].key;
  if (isEdit) {
    tmpCode = editItemCode;
    tmpKey = editItem.base.key;
  }
  console.log('addShortcut tmpCode editItemCode', tmpCode, editItemCode);
  // const key = keys[0].key;
  const type = KeyTypeEnum.MT;
  try {
    const ret = await addMT({
      type,
      code: tmpCode,
      time: inputTime.value,
      keys: keys.map((item: any) => ({ code: item.code, type: item.type })),
      key: tmpKey
    });
    console.log('addMT', ret);
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
    //     type: KeyTypeEnum.MT
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
    window.$message!.success($t('businessCommon.executeSuccess'));
  } catch (e) {
    window.$message!.error($t('businessCommon.addFailPlsUpdate'));
    console.error(e);
  }
}

function handleGroupItemClicked({ base }: { base: GroupItem['base'] }) {
  console.log('handleGroupItemClicked', base);
}
async function handleGroupItemDelete(item: any, idx: number) {
  try {
    console.log('handleGroupItemDelete', item.base.code);
    console.log('handleGroupItemDelete', JSON.stringify(item), idx);
    const ret = await deleteMTByCode({ code: item.base.code });
    console.log('deleteMTByCode', ret);
    // keyboardStore.removeSuperKey(item.base.key, { moduleType: KeyTypeEnum.MT });

    groupList.value.splice(idx, 1);
    removeSuperKey(item.base.key!, { moduleType: KeyTypeEnum.MT });
    window.$message!.success($t('businessCommon.delSuccess'));
  } catch (error) {
    window.$message!.error($t('businessCommon.delFailPlsUpdate'));
    console.error(error);
  }
}
async function handleGroupItemEdit(items: any, idx: number) {
  editItemCode = items.base.code;
  editItem = items;
  inputTime.value = mtList.value[idx].time;
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
    const ret = await resetMTName({ code: editItem.base.code, name: data.name });
    console.log('resetMTName', ret);
    editItem.base.name = data.name;
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
        :desc="$t('supperKey.addClickDown')"
        @click="handleAddClicked"
      />
      <BasicGroupItem
        v-for="(item, idx) in groupList"
        :key="item.base.code"
        :base="item.base"
        :key-list="item.keyList"
        code-preffix="M"
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
      :code-type="KeyTypeEnum.MT"
      :fnc-generate-code="generateGroupCode"
      :need-import-key="true"
      :wide="true"
      keyboard-type="standard"
      :desc="$t('supperKey.setClickDowndown1down2')"
      :edit-item="editItem"
      @create-group="handleGroupCreated"
    >
      <template #extra>
        <div class="flex items-center justify-center">
          <span class="mr-3 text-4 text-[#999999]">按住</span>
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
            placeholder=""
          ></NInputNumber>
          <span class="ml-3 text-4 text-[#999999]">ms</span>
        </div>
      </template>
    </EditTemplate>
    <RenameModal
      :show="showRenameModal"
      :list-edit-index="renameIndex"
      :name="editItem.base.name"
      @update:show="showRenameModal = $event"
      @rename="handleReNameSave"
    />
  </div>
</template>
