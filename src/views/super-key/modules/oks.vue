<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, reactive, ref, toRaw, toRef } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { addOks, deleteOksByCode, getOksList, resetOksName } from '@/api/super-key';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import { $t } from '@/locales';
import { formatLableSub3 } from '@/hooks/common/format';
import emitter, { EventNameEnum } from '@/utils/eventBus';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';

const oksGroupList = ref<any>([]);
const editVisible = ref(false);
const modalTitle = ref($t('supperKey.singleKeyStop'));
const MAC_GORUP_CNT = 8;
// const emit = defineEmits(['key-clicked']);
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey, removeSuperKey } = keyboardStore;
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;

type GroupItem = {
  base: { code: number; type: KeyTypeEnum; name: string; key?: string };
  keyList: any[];
  keyBaseList: any[];
};
let editItem = reactive<GroupItem>({
  base: { code: -1, type: KeyTypeEnum.None, name: '', key: '' },
  keyList: [],
  keyBaseList: []
});

const showRenameModal = ref(false);
const renameIndex = ref(-1);

let isEdit = false;
const editItemCode = 0;

onMounted(() => {
  emitter.on(EventNameEnum.resetKey, (key: string) => {
    console.log(EventNameEnum.resetKey, key);
    if (currentSuperKeyType.value === KeyTypeEnum.OKS) {
      if (key) {
        console.log('oksGroupList', JSON.stringify(oksGroupList.value));
        let index = 0;
        for (const item of oksGroupList.value) {
          const matchingKeyBase = item.keyBaseList.find((keyBase: any) => keyBase.key === key);
          if (matchingKeyBase) {
            console.log('找到了item', JSON.stringify(item), '索引:', index);
            handleGroupItemDelete(item, index);
            break;
          }
          index++;
        }
      }
    }
  });
});

function handleAddClicked() {
  if (oksGroupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning(`最多只能添加${MAC_GORUP_CNT}个组合键`);
    return;
  }
  // if (Object.keys(selectedKeys.value).length === 0) {
  //   window.$message!.info('请选择按键');
  //   return;
  // }
  editItem = { base: { code: -1, type: KeyTypeEnum.None, name: '' }, keyList: [], keyBaseList: [] };
  isEdit = false;
  editVisible.value = true;
}
function updateGroupEffect(key: string, moduleType: KeyTypeEnum, res?: any) {
  if (currentSuperKeyType.value === KeyTypeEnum.OKS) {
    const mtCfg = formatLableSub3(res);
    updateSuperKey(key!, { moduleType, mtCfg });
  } else {
    updateSuperKey(key!, { moduleType });
  }
}
async function updateGroupList() {
  const { oks } = await getOksList();
  console.log('oks', JSON.stringify(oks));
  oksGroupList.value = oks.map(item => {
    const { code, type } = item;
    return {
      base: { code, type },
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
  console.log('handleGroupCreated', { code, keys, name, listDetail });
  try {
    let tmpCode = code;
    if (isEdit) {
      tmpCode = editItemCode;
      editItem.keyBaseList.forEach((listItem: any) => {
        removeSuperKey(listItem.key!, { moduleType: KeyTypeEnum.OKS });
      });
    }
    const type = KeyTypeEnum.OKS;
    await addOks({ type, code: tmpCode, keys });
    updateGroupList();
    // oksGroupList.value.push({
    //   base: {
    //     code,
    //     name
    //   },
    //   keyList: listDetail.map((item: any) => {
    //     return item.detail;
    //   })
    // });
    window.$message!.success($t('businessCommon.delSuccess'));
  } catch (e) {
    window.$message!.error($t('businessCommon.addFailPlsUpdate'));
    console.error(e);
  }
}

function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.OKS } }) {
  console.log('handleGroupItemClicked', base);
  // const { code, type } = base;
  // emit('key-clicked', {
  //   code,
  //   type
  // });
}
async function handleGroupItemDelete(item: any, idx: number) {
  try {
    await deleteOksByCode({ code: item.base.code });
    oksGroupList.value.splice(idx, 1);
    item.keyBaseList.forEach((listItem: any) => {
      removeSuperKey(listItem.key!, { moduleType: KeyTypeEnum.OKS });
    });
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
  if (oksGroupList.value.length === 0) return 0;
  const usedCodes = new Set(oksGroupList.value.map((group: { base: { code: number } }) => group.base.code));
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
    await resetOksName({ code: editItem.base.code, name: data.name });
    editItem.base.name = data.name;
    showRenameModal.value = false;
    oksGroupList.value[renameIndex.value].base.name = data.name;
  } catch (error) {
    console.log('error', error);
  }
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd v-if="oksGroupList.length < 8" icon="add" :desc="$t('supperKey.x1')" @click="handleAddClicked" />
      <BasicGroupItem
        v-for="(item, idx) in oksGroupList"
        :key="item.code"
        :base="item.base"
        :key-list="item.keyList"
        code-preffix="O"
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
      :code-type="KeyTypeEnum.OKS"
      :fnc-generate-code="generateGroupCode"
      :need-import-key="false"
      keyboard-type="base"
      :desc="$t('supperKey.c6')"
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
