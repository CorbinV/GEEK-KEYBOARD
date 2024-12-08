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
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';
type GroupItem = {
  base: { code: number; type: KeyTypeEnum; name: string; key?: string };
  keyList: any[];
  keyBaseList: any[];
};
const mtGroupList = ref<GroupItem[]>([]);
const editVisible = ref(false);
const modalTitle = ref('单击/按住');
const MAC_GORUP_CNT = 8;
const emit = defineEmits(['key-clicked']);
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey, removeSuperKey } = keyboardStore;
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;
currentSuperKeyType.value = KeyTypeEnum.MT;
// 按住时间
const inputTime = ref(100);
const mtList = ref<any>([]);
let editItem = reactive<GroupItem>({
  base: { code: -1, type: KeyTypeEnum.None, name: '', key: '' },
  keyList: [],
  keyBaseList: []
});
const { selectedKeys } = toRefs(keyboardStore);
const kbCfg = toRef(keyboardStore, 'kbCfg');

let keyId = '';
const showRenameModal = ref(false);
const renameIndex = ref(-1);

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
  const superKey = kbCfg.value.superKeyMap[keyId];
  if (keyId === '') {
    window.$message!.info($t('supperKey.keyBinedDKSFunc'));
    return;
  }
  if (superKey?.dks) {
    window.$message!.info($t('supperKey.keyBinedDKSFunc'));
    return;
  }
  if (superKey?.sp) {
    window.$message!.info($t('supperKey.keyBinedOtherFunc'));
    return;
  }
  if (mtGroupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning($t('supperKey.maxAddCombinKey', { total: MAC_GORUP_CNT }));
    return;
  }
  inputTime.value = 100;
  editVisible.value = true;
}
function updateGroupEffect(key: string, moduleType: KeyTypeEnum, res?: any) {
  if (currentSuperKeyType.value === KeyTypeEnum.MT) {
    const mtCfg = formatLableSub3(res);
    updateSuperKey(key!, { moduleType, mtCfg });
  } else {
    updateSuperKey(key!, { moduleType });
  }
}
async function updateGroupList() {
  const { mt } = await getMTList();
  mtList.value = mt;
  mtGroupList.value = mt.map(item => {
    const { code, type, name, key } = item;
    return {
      base: { code, type, name, key },
      keyList: item.keys.map(keyBase => {
        const res = getKeyDetail({ code: keyBase.code, type: keyBase.type });
        updateGroupEffect(key!, toRaw(currentSuperKeyType.value), res);
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
    await addMT({
      code,
      time: inputTime.value,
      keys: keys.map((item: any) => ({ code: item.code, type: item.type })),
      name
    });
    mtGroupList.value.push({
      base: {
        code,
        name,
        key: keys[0].key,
        type: KeyTypeEnum.MT
      },
      keyList: listDetail.map((item: any) => {
        return item.detail;
      }),
      keyBaseList: keys.map((keyBase: any) => {
        return keyBase;
      })
    });

    const res = getKeyDetail({ code: keys[1].code, type: keys[1].type });
    updateGroupEffect(keys[0].key!, toRaw(currentSuperKeyType.value), res);
    window.$message!.success($t('businessCommon.executeSuccess'));
  } catch (e) {
    window.$message!.error($t('businessCommon.addFailPlsUpdate'));
    console.error(e);
  }
}

function handleGroupItemClicked({ base }: { base: GroupItem['base'] }) {
  const { code, type } = base;
  emit('key-clicked', {
    code,
    type
  });
}
async function handleGroupItemDelete(item: GroupItem, idx: number) {
  try {
    await deleteMTByCode({ code: item.base.code });
    mtGroupList.value.splice(idx, 1);
    removeSuperKey(item.base.key!, { moduleType: KeyTypeEnum.MT });
    window.$message!.success($t('businessCommon.delSuccess'));
  } catch (error) {
    window.$message!.error($t('businessCommon.delFailPlsUpdate'));
    console.error(error);
  }
}
async function handleGroupItemEdit(items: any, idx: number) {
  editItem = items;
  inputTime.value = mtList.value[idx].time;
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
  if (mtGroupList.value.length === 0) return 1;
  const usedCodes = new Set(mtGroupList.value.map((group: { base: { code: number } }) => group.base.code));
  let newCode = 1;
  while (usedCodes.has(newCode)) {
    newCode++;
  }
  return newCode;
}
async function handleReNameSave(data: { name: string }) {
  console.log('handleReNameSave', data.name);
  if (data.name === '') return;
  try {
    await resetMTName({ code: editItem.base.code, name: data.name });
    editItem.base.name = data.name;
    showRenameModal.value = false;
    mtGroupList.value[renameIndex.value].base.name = data.name;
  } catch (error) {
    console.log('error', error);
  }
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd icon="add" :desc="$t('supperKey.addClickDown')" @click="handleAddClicked" />
      <BasicGroupItem
        v-for="(item, idx) in mtGroupList"
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
            :enable-rename="true"
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
