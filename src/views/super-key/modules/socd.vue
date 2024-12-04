<script setup lang="ts">
import type { Ref } from 'vue';
import { reactive, ref, toRaw, toRef } from 'vue';
import { NSelect } from 'naive-ui';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { addSOCD, deleteSOCDByCode, getSOCDList, resetSOCDName } from '@/api/super-key';
import RenameModal from '@/views/marco/components/RenameModal.vue';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';
import { SOCDTriggerOps } from '../config';
const socdGroupList = ref<any>([]);
const editVisible = ref(false);
const modalTitle = ref('SOCD');
const MAC_GORUP_CNT = 8;
const emit = defineEmits(['key-clicked']);
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey } = keyboardStore;
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;
currentSuperKeyType.value = KeyTypeEnum.SOCD;
// 优先触发
const trigger = ref<number>(0);
const socdList = ref<any>([]);
let editItem = reactive<{
  base: { code: number; type: KeyTypeEnum; name: string };
  keyList: any[];
  keyBaseList: any[];
}>({ base: { code: -1, type: KeyTypeEnum.None, name: '' }, keyList: [], keyBaseList: [] });

const showRenameModal = ref(false);
const renameIndex = ref(-1);

function handleAddClicked() {
  if (socdGroupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning(`最多只能添加${MAC_GORUP_CNT}个组合键`);
    return;
  }
  editItem = { base: { code: -1, type: KeyTypeEnum.None, name: '' }, keyList: [], keyBaseList: [] };
  trigger.value = 0;
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
  const { socd } = await getSOCDList();
  socdList.value = socd;
  socdGroupList.value = socd.map(item => {
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
    await addSOCD({ code, trigger: trigger.value, keys, name });
    socdGroupList.value.push({
      base: {
        code,
        name
      },
      keyList: listDetail.map((item: any) => {
        return item.detail;
      })
    });
    window.$message!.success('添加成功');
  } catch (e) {
    window.$message!.error('添加失败，请更新最新固件后重试');
    console.error(e);
  }
}

function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.SOCD } }) {
  const { code, type } = base;
  emit('key-clicked', {
    code,
    type
  });
}
async function handleGroupItemDelete(item: { code: number }, idx: number) {
  try {
    await deleteSOCDByCode({ code: item.code });
    socdGroupList.value.splice(idx, 1);
    window.$message!.success('删除成功');
  } catch (error) {
    window.$message!.error('删除失败，请更新最新固件后重试');
    console.error(error);
  }
}
async function handleGroupItemEdit(items: any, idx: number) {
  // feat: open edit modal(dialog), and transform data
  console.log('handleGroupItemEdit', items, idx);
  editItem = items;
  trigger.value = socdList.value[idx].trigger;
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
  if (socdGroupList.value.length === 0) return 1;
  const usedCodes = new Set(socdGroupList.value.map((group: { base: { code: number } }) => group.base.code));
  let newCode = 1;
  while (usedCodes.has(newCode)) {
    newCode++;
  }
  return newCode;
}

function handleTrigger(value: number) {
  trigger.value = value;
  console.log('handleTrigger', value);
}

async function handleReNameSave(data: { name: string }) {
  console.log('handleReNameSave', data.name);
  if (data.name === '') return;
  try {
    await resetSOCDName({ code: editItem.base.code, name: data.name });
    editItem.base.name = data.name;
    showRenameModal.value = false;
    socdGroupList.value[renameIndex.value].base.name = data.name;
  } catch (error) {
    console.log('error', error);
  }
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd icon="add" desc="添加SOCD按键" @click="handleAddClicked" />
      <BasicGroupItem
        v-for="(item, idx) in socdGroupList"
        :key="item.code"
        :base="item.base"
        :key-list="item.keyList"
        code-preffix="S"
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
      :code-type="KeyTypeEnum.SOCD"
      :fnc-generate-code="generateGroupCode"
      :need-import-key="false"
      keyboard-type="standard"
      desc="请选择两个按键，当两个按键同时按下时，不会同时触发，将会按照您的设置，优先进行触发，松开后立即恢复另个一按键触发。"
      :edit-item="editItem"
      @create-group="handleGroupCreated"
    >
      <template #header-extra>
        <div class="flex items-center">
          <span class="text-4 text-[#999999]">优先触发</span>
          <NSelect
            v-model:value="trigger"
            class="ml-3 w-45"
            size="large"
            :options="SOCDTriggerOps"
            @update:value="handleTrigger"
          ></NSelect>
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
