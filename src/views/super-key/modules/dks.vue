<script setup lang="ts">
import type { Ref } from 'vue';
import { onUnmounted, ref, toRaw, toRef, watchEffect } from 'vue';
import BasicGroupItem from '@/components/custom/basic-group-item.vue';
import BasicGroupAdd from '@/components/custom/basic-group-add.vue';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { KeyTypeEnum } from '@/enum/keyType';
import { addDks, deleteDksByCode, getDksList } from '@/api/super-key';
import { formatLableSub3 } from '@/hooks/common/format';
import DksEdit from '../components/dks-edit.vue';
import GroupMenu from '../components/group-menu.vue';
const oksGroupList = ref<any>([]);
const editVisible = ref(false);
const modalTitle = ref('动态键程按键');
const MAC_GORUP_CNT = 8;
const emit = defineEmits(['key-clicked']);
const keyboardStore = useKeyboardStore();
const { getKeyDetail, updateSuperKey } = keyboardStore;
const currentSuperKeyType = toRef(keyboardStore, 'currentSuperKeyType') as Ref<KeyTypeEnum>;
function useSimulate() {
  const enableSimulate = ref<0 | 1>(0); // enbale simulate
  const simulateStatus = ref<'0' | '1' | '2'>('0');
  const simulateOps = [
    {
      label: '随机',
      value: '1'
    },
    {
      label: '固定',
      value: '2'
    }
  ];
  const simulateDelayTimes = ref({
    v1: 0,
    v2: 0
  });
  watchEffect(() => {
    if (!enableSimulate.value) {
      simulateStatus.value = '0';
    } else {
      simulateStatus.value = '1';
    }
  });
  watchEffect(() => {
    if (simulateStatus.value === '2' && simulateDelayTimes.value.v1) {
      simulateDelayTimes.value.v2 = simulateDelayTimes.value.v1;
    }
  });
  onUnmounted(() => (simulateDelayTimes.value = { v1: 0, v2: 0 }));
  return {
    enableSimulate,
    simulateDelayTimes,
    simulateStatus,
    simulateOps
  };
}
const { enableSimulate, simulateStatus, simulateOps, simulateDelayTimes } = useSimulate();
function handleAddClicked() {
  if (oksGroupList.value.length >= MAC_GORUP_CNT) {
    window.$message!.warning(`最多只能添加${MAC_GORUP_CNT}个`);
    return;
  }
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
  const { shortcuts } = await getDksList();
  oksGroupList.value = shortcuts.map(item => {
    const { code, type, name, simulation, range } = item;
    return {
      base: { code, type, name },
      keyList: item.keys.map(keyBase => {
        const res = getKeyDetail({ code: keyBase.code, type: KeyTypeEnum.Normal });
        updateGroupEffect(keyBase.key!, toRaw(currentSuperKeyType.value), res);
        return {
          ...res,
          range: keyBase.range
        };
      }),
      extra: {
        simulation,
        range
      }
    };
  });
}
updateGroupList();
async function handleGroupCreated({ code, keys, name, range, listDetail }: any) {
  const sendData = {
    code,
    keys,
    name,
    range,
    simulation: Number.parseInt(simulateStatus.value, 10) as 0 | 1 | 2,
    simulationRange:
      Number.parseInt(simulateStatus.value, 10) > 0 ? [simulateDelayTimes.value.v1, simulateDelayTimes.value.v2] : [],
    type: KeyTypeEnum.DKS
  };
  console.log(sendData);
  try {
    await addDks(sendData);
    oksGroupList.value.push({
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

function handleGroupItemClicked({ base }: { base: { code: number; type: KeyTypeEnum.Combo } }) {
  const { code, type } = base;
  emit('key-clicked', {
    code,
    type
  });
}
async function handleGroupItemDelete(item: { code: number }, idx: number) {
  try {
    await deleteDksByCode({ code: item.code });
    // feat: delete releted key info about super key
    oksGroupList.value.splice(idx, 1);
    window.$message!.success('删除成功');
  } catch (error) {
    window.$message!.error('删除失败，请更新最新固件后重试');
    console.error(error);
  }
}
async function handleGroupItemEdit(items: any, idx: number) {
  // feat: open edit modal(dialog), and transform data
  console.log('handleGroupItemEdit', items, idx);
}
async function handleGroupItemRename(items: any, idx: number) {
  // feat: rename group name
  console.log('handleGroupItemRename', items, idx);
}
function generateGroupCode() {
  if (oksGroupList.value.length === 0) return 0;
  const usedCodes = new Set(oksGroupList.value.map((group: { code: number }) => group.code));
  let newCode = 0;
  while (usedCodes.has(newCode)) {
    newCode++;
  }
  console.log('newCode', oksGroupList.value.length, newCode);
  return newCode;
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 mx-auto my-0 gap-x-4 gap-y-8 p-4">
      <BasicGroupAdd v-if="oksGroupList.length < 8" icon="add" desc="添加动态键程按键" @click="handleAddClicked" />
      <BasicGroupItem
        v-for="(item, idx) in oksGroupList"
        :key="item.code"
        :base="item.base"
        :key-list="item.keyList"
        code-preffix="D"
        @click="handleGroupItemClicked(item)"
      >
        <template #menu>
          <GroupMenu
            :group-item="item"
            :idx="idx"
            :enable-edit="false"
            @group-item-delete="handleGroupItemDelete"
            @group-item-edit="handleGroupItemEdit"
            @group-item-rename="handleGroupItemRename"
            @click.stop
          />
        </template>
      </BasicGroupItem>
    </div>

    <DksEdit
      v-model:visible="editVisible"
      v-model:title="modalTitle"
      :code-type="KeyTypeEnum.OKS"
      :fnc-generate-code="generateGroupCode"
      :need-import-key="false"
      keyboard-type="standard"
      @create-group="handleGroupCreated"
    >
      <template #header-extra>
        <div class="flex flex-row items-center text-base text-[#999999]">
          <span class="mr-2">开启仿真：</span>
          <div class="flex flex-row items-center gap-x-6">
            <NSwitch v-model:value="enableSimulate" :checked-value="1" :unchecked-value="0" />
            <div v-if="enableSimulate" class="flex flex-row items-center gap-x-4">
              <span class="">触发:</span>
              <NSelect v-model:value="simulateStatus" :options="simulateOps" style="width: 84px" />
              <template v-if="enableSimulate">
                <NInputNumber v-model:value="simulateDelayTimes.v1" style="width: 64px" :show-button="false">
                  <template #suffix>ms</template>
                </NInputNumber>
                <template v-if="simulateStatus === '1'">
                  <span>-</span>
                  <NInputNumber v-model:value="simulateDelayTimes.v2" style="width: 64px" :show-button="false">
                    <template #suffix>ms</template>
                  </NInputNumber>
                </template>
              </template>
            </div>
          </div>
        </div>
      </template>
    </DksEdit>
  </div>
</template>
