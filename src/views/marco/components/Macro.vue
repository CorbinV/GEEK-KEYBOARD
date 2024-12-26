<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { delMacro, getMacroCfg, getMacros, setMacro, setMacroName } from '@/api/macroApi';
import type { Macro, MacroCfg } from '@/api/modules/macro';
import { useMacroStore } from '@/store/modules/macro';
import { MacroType } from '../composables/macroType';
import MacroList from './MacroList.vue';
import RenameModal from './RenameModal.vue';
import MacroModal from './MacroModal.vue';

const message = useMessage();
const { newMacroCode, initMacroCfg, saveUIKey } = useMacroStore();

const emit = defineEmits(['key-clicked']);
const props = defineProps<{ edit: boolean }>();
function handleListItem(item: Macro) {
  emit('key-clicked', { code: item.code, type: item.type });
}

// 宏列表
const macros = reactive<{ macro: Macro[] }>({ macro: [] });
// 添加或编辑的宏
let macro: Macro = { type: 6, code: -1, name: '' };
// 0-添加宏 1-编辑宏
let editType = 0;
// 宏列表编辑索引
const listEditIndex = ref(-1);
// 宏编辑弹窗
const showModal = ref(false);
// 宏重命名弹窗
const showRenameModal = ref(false);

onMounted(async () => {
  initData();
});

// 初始化数据
async function initData() {
  try {
    const macrosList = await getMacros();
    macros.macro = macrosList.macro.slice(0, 7);
  } catch (error) {
    console.log('error', error);
    message.error('获取宏列表失败', {
      duration: 1000
    });
  }
}

// 宏列表操作菜单
function handleMacrosMenu(key: string | number, item: Macro) {
  listEditIndex.value = macros.macro.indexOf(item);
  macro = item;
  switch (key) {
    case MacroType.MenuOptionKey.Edit: {
      handleMacroEdit(item);
      break;
    }
    case MacroType.MenuOptionKey.ReName: {
      handleReName();
      break;
    }
    case MacroType.MenuOptionKey.Delete: {
      handleMacroDelete();
      break;
    }
    default:
      break;
  }
}

// 添加宏按键
function handleNewMacro() {
  listEditIndex.value = newMacroCode(macros);
  editType = 0;
  macro = {
    type: 6,
    code: listEditIndex.value,
    name: `M${listEditIndex.value + 1}`
  };
  const macroCfg: MacroCfg = {
    attr: {
      type: 6,
      code: macro.code,
      name: macro.name,
      trigger: 0,
      triggerDelay: 1,
      loop: 1,
      delay: [1, 1],
      stopType: 0
    },
    keys: []
  };
  initMacroCfg(macroCfg);
  showModal.value = true;
}

// 编辑宏按键
async function handleMacroEdit(item: Macro) {
  editType = 1;
  macro = item;
  try {
    const macroCfg = await getMacroCfg({ type: macro.type, code: macro.code });
    initMacroCfg(macroCfg);
    showModal.value = true;
  } catch (error) {
    console.log('error', error);
  }
}
// 重命名弹窗
function handleReName() {
  showRenameModal.value = true;
}

// 重命名保存
async function handleReNameSave(data: { name: string }) {
  if (data.name === '' || listEditIndex.value === -1) return;
  try {
    await setMacroName({ type: macro.type, code: macro.code, name: macro.name });
    macro.name = data.name;
    macros.macro[listEditIndex.value].name = macro.name;
    showRenameModal.value = false;
    message.success('重命名成功', {
      duration: 1000
    });
  } catch (error) {
    console.log('error', error);
    message.success('重命名失败', {
      duration: 1000
    });
  }
}

// 删除宏
async function handleMacroDelete() {
  if (listEditIndex.value === -1) return;
  try {
    await delMacro({ code: macros.macro[listEditIndex.value].code });
    macros.macro.splice(listEditIndex.value, 1);
    message.success('删除成功', {
      duration: 1000
    });
  } catch (error) {
    console.log('error', error);
    message.error('删除失败', {
      duration: 1000
    });
  }
}

// 保存宏配置
async function handleSave() {
  console.log('handleSave');
  const result: MacroCfg | undefined = saveUIKey();
  console.log('result', JSON.stringify(result));
  if (result) {
    try {
      console.log('开始保存');
      await setMacro({ attr: result.attr, keys: result.keys });
      macros.macro.splice(listEditIndex.value, editType, macro);
      showModal.value = false;
      message.success('保存成功', {
        duration: 1000
      });
    } catch (error) {
      console.log('error', error);
      message.error('保存失败', {
        duration: 1000
      });
    }
  } else {
    message.error('保存失败', {
      duration: 1000
    });
  }
}
</script>

<template>
  <MacroList
    :edit="props.edit"
    :macros="macros"
    @new-macro="handleNewMacro"
    @list-item="handleListItem"
    @macros-menu="handleMacrosMenu"
  />

  <RenameModal
    :show="showRenameModal"
    :name="macro.name"
    @update:show="showRenameModal = $event"
    @rename="handleReNameSave"
  />

  <MacroModal
    :show="showModal"
    :macro="macro"
    :list-edit-index="listEditIndex"
    :edit-type="editType"
    @update:show="showModal = $event"
    @save="handleSave"
  />
</template>

<style scoped></style>
