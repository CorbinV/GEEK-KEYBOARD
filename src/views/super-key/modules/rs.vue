<script setup lang="ts">
import type { Ref } from 'vue';
import { reactive, ref, toRaw, toRef } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { addRS, deleteRSByCode, getRSList } from '@/api/super-key';
import EditTemplate from '../components/edit-template.vue';
import GroupMenu from '../components/group-menu.vue';
const rsGroupList = ref<any>([]);
const editVisible = ref(false);
const modalTitle = ref('灵动触发按键');
const MAC_GORUP_CNT = 8;
const emit = defineEmits(['key-clicked']);
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey } = keyboardStore;
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;
currentSuperKeyType.value = KeyTypeEnum.RS;
let editItem = reactive<{
  base: { code: number; type: KeyTypeEnum; name: string };
  keyList: any[];
  keyBaseList: any[];
}>({ base: { code: -1, type: KeyTypeEnum.None, name: '' }, keyList: [], keyBaseList: [] });
function handleAddClicked() {
  if (rsGroupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning(`最多只能添加${MAC_GORUP_CNT}个组合键`);
    return;
  }
  // if (Object.keys(selectedKeys.value).length === 0) {
  //   window.$message!.info('请选择按键');
  //   return;
  // }
  editItem = { base: { code: -1, type: KeyTypeEnum.None, name: '' }, keyList: [], keyBaseList: [] };
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
  const { rs } = await getRSList();
  rsGroupList.value = rs.map(item => {
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
    await addRS({ code, keys, name });
    rsGroupList.value.push({
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

function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.RS } }) {
  const { code, type } = base;
  emit('key-clicked', {
    code,
    type
  });
}
async function handleGroupItemDelete(item: { code: number }, idx: number) {
  try {
    await deleteRSByCode({ code: item.code });
    rsGroupList.value.splice(idx, 1);
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
  editVisible.value = true;
}
async function handleGroupItemRename(items: any, idx: number) {
  // feat: rename group name
  console.log('handleGroupItemRename', items, idx);
}
function generateGroupCode() {
  if (rsGroupList.value.length === 0) return 1;
  const usedCodes = new Set(rsGroupList.value.map((group: { base: { code: number } }) => group.base.code));
  let newCode = 1;
  while (usedCodes.has(newCode)) {
    newCode++;
  }
  return newCode;
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd icon="add" desc="添加灵动触发按键" @click="handleAddClicked" />
      <BasicGroupItem
        v-for="(item, idx) in rsGroupList"
        :key="item.code"
        :base="item.base"
        :key-list="item.keyList"
        code-preffix="R"
        class="hover:cursor-pointer"
        @click="handleGroupItemClicked(item)"
      >
        <template #menu>
          <GroupMenu
            :group-item="item"
            :idx="idx"
            :enable-edit="true"
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
      :code-type="KeyTypeEnum.RS"
      :fnc-generate-code="generateGroupCode"
      :need-import-key="false"
      keyboard-type="standard"
      second-title="监控两个按键，当两个按键同事按下时，触发按压更深的按键"
      desc="*例：设置AB键为RS键，当A键按压比D键更深时，A键触发，抬起A键后，D键将恢复触发"
      :edit-item="editItem"
      @create-group="handleGroupCreated"
    ></EditTemplate>
  </div>
</template>
