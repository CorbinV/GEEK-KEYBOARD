<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, toRefs, watch } from 'vue';
import { useDeviceStore } from '@/store/modules/device';
import { enableFct, offFctKeyListener, onFctKeyListener, setFctLight } from '@/api/factory';
import type { FctKeyRes } from '@/api/modules/test';
const deviceStore = useDeviceStore();
const { isConnected } = toRefs(deviceStore);
const initSw = () => {
  const originSwitchList = [
    {
      key: 'H',
      label: 'HOME'
    },
    {
      key: 'TP',
      label: 'TP'
    },
    {
      key: 'SEL',
      label: 'SEL'
    },
    {
      key: 'M7',
      label: 'L3'
    },
    {
      key: 'M8',
      label: 'R3'
    },
    {
      key: 'ST',
      label: 'START'
    },
    {
      key: 'PC',
      label: 'PC'
    },
    {
      key: 'NS',
      label: 'NS'
    },
    {
      key: 'LK',
      label: 'LOCK',
      icon: 'lock'
    },
    {
      key: 'UNLK',
      label: 'UNLOCK',
      icon: 'unlock'
    },
    {
      key: 'VS',
      label: 'VS',
      icon: 'vs-layer'
    },
    {
      key: 'GL1',
      label: 'GL1',
      icon: 'game-layer-1'
    },
    {
      key: 'GL2',
      label: 'GL2',
      icon: 'game-layer-2'
    }
  ];
  return originSwitchList.map(item => {
    return {
      ...item,
      value: false,
      pr: false
    };
  });
};
const initBtn = () => {
  const originBtnList = [
    'M1',
    'M2',
    'M3',
    'M4',
    'RB',
    'LB',
    'RT',
    'LT',
    'A',
    'B',
    'X',
    'Y',
    'UP',
    'DOWN',
    'LEFT',
    'RIGHT',
    'L3',
    'R3'
  ];
  return originBtnList.map(item => {
    return {
      key: item,
      label: item,
      value: false,
      pr: false
    };
  });
};
const switchList = reactive(initSw());
const btnList = reactive(initBtn());
const maxTestKey = switchList.length + btnList.length;
const passTested = computed(() => {
  let testedCount = maxTestKey;
  const swStatus = switchList.every(item => {
    if (item.value) {
      testedCount--;
    }
    return item.value;
  });
  const btnStatus = btnList.every(item => {
    if (item.value) {
      testedCount--;
    }
    return item.value;
  });
  return {
    status: swStatus && btnStatus,
    process: `${testedCount}/${maxTestKey}`
  };
});
const baseDeviceConfig = [
  {
    usagePage: 0xff80,
    vendorId: 0x4353,
    productId: 0x800c
  },
  {
    usagePage: 0xff80,
    vendorId: 0x054c,
    productId: 0x05c5
  },
  {
    usagePage: 0xff80,
    vendorId: 0x057e,
    productId: 0x2009
  }
];
async function handleConnect() {
  try {
    const devices = await navigator!.hid.requestDevice({
      filters: baseDeviceConfig
    })!;

    if (devices.length > 0) {
      deviceStore.connect([devices[0]], {
        usagePage: 0xff80,
        vendorId: devices[0].vendorId,
        productId: devices[0].productId
      });
    } else {
      window.$message!.error('No device found');
    }
  } catch (error) {
    console.error('Error connecting to device:', error);
    window.$message!.error('Failed to connect to device');
  }
}
async function handleDisconnect() {
  try {
    await enableFct({ enable: 0 });
    await deviceStore.disconnect();
  } catch (error) {
    console.error('Error disconnecting from device:', error);
    window.$message!.error('Failed to disconnect from device');
  }
}
function decodeFctMsg(data: FctKeyRes) {
  const { sw, ks } = data;
  Object.keys(sw).forEach(key => {
    const swItem = switchList.find(item => item.key === key);
    if (swItem) {
      swItem.value = Boolean(sw[key].v);
    }
  });
  Object.keys(ks).forEach(key => {
    const btnItem = btnList.find(item => item.key === key);
    if (btnItem) {
      btnItem.value = Boolean(ks[key].v);
      btnItem.pr = Boolean(ks[key].pr);
    }
  });
}
watch(isConnected, async val => {
  if (val) {
    await enableFct({ enable: 1 });
    await setFctLight({ r: 255, g: 255, b: 255 });
    onFctKeyListener(decodeFctMsg);
  } else {
    offFctKeyListener(decodeFctMsg);
  }
});
watch(
  () => passTested.value.status,
  val => {
    if (val) {
      window.$message!.success('测试通过，设备已自动断开');
      enableFct({ enable: 0 }).then(() => {
        deviceStore.disconnect();
      });
    }
  }
);

});
</script>

<template>
  <div class="h-full w-full flex flex-row bg-#ffffff px-6 py-8 text-white">
    <div class="w-1/5">
      <NButton size="large">Connect</NButton>
      <div>
        <p class="text-xl">
          <span class="mr-4">Status:</span>
          <span v-if="passTested" class="text-#7ada00">Passed</span>
          <span v-else class="text-#ff3d00">Failed</span>
        </p>
      </div>
    </div>
    <div class="flex-1">
      <div>
        <p>switch button</p>
        <div class="flex flex-row flex-wrap gap-x-12 gap-y-6">
          <div
            v-for="sw in switchList"
            :key="sw.key"
            class="h-16 w-32 flex items-center justify-center border-1 border-#000000 rounded-xl bg-#171717 text-center text-xl"
            :class="{
              'bg-#7ada00': sw.value && !sw.pr,
              'bg-#ffd850': sw.pr
            }"
          >
            <SvgIcon v-if="sw?.icon" :local-icon="sw.icon" class="text-3xl"></SvgIcon>
            <span v-else>{{ sw.label }}</span>
          </div>
        </div>
      </div>
      <div>
        <p>base button</p>
        <div class="flex flex-row flex-wrap gap-x-12 gap-y-6">
          <div
            v-for="btn in btnList"
            :key="btn.key"
            class="h-16 w-32 flex items-center justify-center border-1 border-#000000 rounded-xl bg-#171717 text-center text-xl"
          >
            <span>{{ btn.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
