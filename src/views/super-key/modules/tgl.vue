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
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';
const tglGroupList = ref<any>([]);
const editVisible = ref(false);
const modalTitle = ref($t('businessCommon.switchSwitch'));
const MAC_GORUP_CNT = 8;
const emit = defineEmits(['key-clicked']);
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey } = keyboardStore;
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;
currentSuperKeyType.value = KeyTypeEnum.TGL;
let editItem = reactive<{
  base: { code: number; type: KeyTypeEnum; name: string };
  keyList: any[];
  keyBaseList: any[];
}>({ base: { code: -1, type: KeyTypeEnum.None, name: '' }, keyList: [], keyBaseList: [] });

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
    window.$message!.info($t('supperKey.plsSelectKey'));
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
  if (tglGroupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning($t('supperKey.keyBinedOtherFunc', { total: MAC_GORUP_CNT }));
    return;
  }
  editVisible.value = true;
}
function updateGroupEffect(key: string, moduleType: KeyTypeEnum, res?: any) {
  if (currentSuperKeyType.value === KeyTypeEnum.MT) {
    const formatLable = (obj: any) => {
      if (obj.type !== 'str') return obj;

      const label = obj.label.trim() as string;

      if (label.includes(' ')) {
        const formatted = label
          .split(' ')
          .filter(word => word.length > 0)
          .map(word => word[0])
          .join('');
        return { ...obj, label: formatted };
      }
      const formatted = label.length > 2 ? label.slice(0, 2) : label;
      return { ...obj, label: formatted };
    };
    const mtCfg = formatLable(res);
    updateSuperKey(key!, { moduleType, mtCfg });
  } else {
    updateSuperKey(key!, { moduleType });
  }
}
async function updateGroupList() {
  const { tgl } = await getTGLList();
  tglGroupList.value = tgl.map(item => {
    const { code, type, name } = item;
    return {
      base: { code, type, name },
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
    await addTGL({ code, keys, name });
    tglGroupList.value.push({
      base: {
        code,
        name
      },
      keyList: listDetail.map((item: any) => {
        return item.detail;
      })
    });
    window.$message!.success($t('businessCommon.delSuccess'));
  } catch (e) {
    window.$message!.error($t('businessCommon.addFailPlsUpdate'));
    console.error(e);
  }
}

function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.TGL } }) {
  const { code, type } = base;
  emit('key-clicked', {
    code,
    type
  });
}
async function handleGroupItemDelete(item: { code: number }, idx: number) {
  try {
    await deleteTGLByCode({ code: item.code });
    tglGroupList.value.splice(idx, 1);
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
  if (tglGroupList.value.length === 0) return 1;
  const usedCodes = new Set(tglGroupList.value.map((group: { base: { code: number } }) => group.base.code));
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
    await resetTGLName({ code: editItem.base.code, name: data.name });
    editItem.base.name = data.name;
    showRenameModal.value = false;
    tglGroupList.value[renameIndex.value].base.name = data.name;
  } catch (error) {
    console.log('error', error);
  }
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd icon="add" :desc="$t('businessCommon.addSwtich')" @click="handleAddClicked" />
      <BasicGroupItem
        v-for="(item, idx) in tglGroupList"
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
      :code-type="KeyTypeEnum.TGL"
      :fnc-generate-code="generateGroupCode"
      :need-import-key="true"
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
