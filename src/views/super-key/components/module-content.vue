<script setup lang="ts">
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import GroupMenu from './group-menu.vue';
import type { SuperKeyStrategy, GroupItem } from '../types';

defineProps<{
  strategy?: SuperKeyStrategy;
  groupList: GroupItem[];
}>();

const emit = defineEmits<{
  'add-clicked': [];
  'item-clicked': [item: GroupItem];
  'item-delete': [item: GroupItem, idx: number];
  'item-edit': [item: GroupItem, idx: number];
  'item-rename': [item: GroupItem, idx: number];
}>();
</script>

<template>
  <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
    <BasicGroupAdd
      v-if="groupList.length < (strategy?.maxGroupCount ?? 8)"
      icon="add"
      :desc="$t('common.add')"
      @click="emit('add-clicked')"
    />
    <BasicGroupItem
      v-for="(item, idx) in groupList"
      :key="item.viewId"
      :base="item.base"
      :key-list="item.keyList"
      :code-preffix="strategy?.codePrefix"
      class="hover:cursor-pointer"
      @click="emit('item-clicked', item)"
    >
      <template #menu>
        <GroupMenu
          :group-item="item"
          :idx="idx"
          :enable-edit="strategy?.enableEdit"
          :enable-rename="strategy?.enableRename"
          @group-item-delete="emit('item-delete', item, idx)"
          @group-item-edit="emit('item-edit', item, idx)"
          @group-item-rename="emit('item-rename', item, idx)"
          @click.stop
        />
      </template>
    </BasicGroupItem>
  </div>
</template>