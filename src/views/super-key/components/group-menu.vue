<script setup lang="ts">
const popoverStyle = { padding: '0.6rem', width: '100px' };
const emit = defineEmits<{
  (e: 'group-item-rename', groupItem: any, idx: number): void;
  (e: 'group-item-delete', groupItem: any, idx: number): void;
  (e: 'group-item-edit', groupItem: any, idx: number): void;
}>();
type GroupMene = {
  groupItem: any;
  idx: number;
  enableEdit?: boolean;
  enableRename?: boolean;
  fncEnable?: boolean;
};
const props = withDefaults(defineProps<GroupMene>(), {
  fncEnable: true,
  enableEdit: true,
  enableRename: false
});
function handleGroupItemDelete() {
  emit('group-item-delete', props.groupItem, props.idx);
}
function handleGroupItemEdit() {
  emit('group-item-edit', props.groupItem, props.idx);
}
function handleGroupItemRename() {
  emit('group-item-rename', props.groupItem, props.idx);
}
</script>

<template>
  <div class="rounded-md higth-light-bg px-3 hover:cursor-pointer">
    <NPopover :style="popoverStyle" trigger="hover"  to="#popover-portal">
      <template #trigger>
        <div class="py-1 text-c-primary">
          <SvgIcon icon="tabler:dots" />
        </div>
      </template>

      <template v-if="fncEnable">
        <div class="text-[#999]">
          <template v-if="enableEdit">
            <p class="cursor-pointer rounded text-center hover:text-[#3c8df4]" @click="handleGroupItemEdit">
              {{ $t('businessCommon.edit') }}
            </p>
            <NDivider class="!my-2" />
          </template>
          <template v-if="enableRename">
            <p class="cursor-pointer rounded text-center hover:text-[#3c8df4]" @click="handleGroupItemRename">
              {{ $t('businessCommon.rename') }}
            </p>
            <NDivider class="!my-2" />
          </template>
          <p class="cursor-pointer rounded text-center hover:text-[#3c8df4]" @click="handleGroupItemDelete">
            {{ $t('businessCommon.delete') }}
          </p>
        </div>
      </template>
      <p v-else class="text-[#999]">该功能暂未开放，敬请期待</p>
    </NPopover>
  </div>
</template>
