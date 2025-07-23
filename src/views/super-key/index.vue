<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import type { Dom, SVGTypeMapping, Svg } from '@svgdotjs/svg.js';
import { SVG } from '@svgdotjs/svg.js';
import tstBgSvg from '@/assets/svg-icon/hp-tst-bg.svg';
import tstBtnsSvg from '@/assets/svg-icon/hp-tst-btns.svg';
import GroupTitle from '@/components/custom/group-title.vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { offKeyPressListener, onKeyPressListener, setTestMode } from '@/api/test';
import type { TestKeyRes } from '@/api/modules/test';

const fetchData = async (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    fetch(url)
      .then(r => resolve(r.text()))
      .catch(e => reject(e));
  });
let ctrlInstance: SVGTypeMapping<Dom> | null = null;

const btnRef = ref();
const bgRef = ref();
function updateBtnView(name: string, staus: 0 | 1) {
  if (!ctrlInstance) {
    return;
  }
  const bgElement = ctrlInstance.findOne(`#TG_${name}_BG`) as Svg;
  if (!bgElement) {
    return;
  }
  let color = '#171717';
  if (staus) {
    color = '#c1c1c1';
  }
  bgElement.fill(color);
}
const keyList = ref<{ id: string; key: string }[]>([]);
const lastKeyList = computed(() => {
  return keyList.value.slice(0, 6);
});
function updateKeyList(name: string, idx?: number) {
  if (idx !== undefined && idx >= 0) {
    keyList.value.splice(idx, 1);
    return;
  }
  keyList.value.unshift({
    id: `${name}-${Date.now()}-${Math.random()}`,
    key: name
  });
  if (keyList.value.length > 10) {
    keyList.value.pop();
  }
}
function listenerKeyPress(data: TestKeyRes) {
  const { ks } = data;
  Object.keys(ks).forEach(key => {
    const element = ks[key];
    if (element.pr) {
      updateKeyList(element.v);
    }
    updateBtnView(key, element.pr);
  });
}
onMounted(async () => {
  Promise.all([fetchData(tstBtnsSvg), fetchData(tstBgSvg)]).then(([btn, bg]) => {
    bgRef.value.innerHTML = bg;
    btnRef.value.innerHTML = btn;
    nextTick(async () => {
      ctrlInstance = SVG(btnRef.value).first();
      await setTestMode({ enable: 1 });
      onKeyPressListener(listenerKeyPress);
    });
  });
});
onUnmounted(async () => {
  await setTestMode({ enable: 0 });
  await offKeyPressListener(listenerKeyPress);
});
</script>

<template>
  <div class="flex flex-row gap-x-36 py-36">
    <div class="relative ml-38 w-3/5">
      <div ref="bgRef" class="svg-top-wrapper absolute left-50% top-0 h-full -translate-x-50%"></div>
      <div ref="btnRef" class="svg-top-wrapper pointer-event-all absolute left-50% top-0 h-full -translate-x-50%"></div>
    </div>
    <div class="p my-4 w-1/5 rounded-xl bg-#171619 px-6 py-4">
      <GroupTitle title="按键测试" :show-bottom-line="false" />
      <div class="ml-8 mt-12 flex flex-col gap-y-4 overflow-clip">
        <SvgIcon
          v-for="info in lastKeyList"
          :key="info.id"
          local-icon="hp-btn-BG"
          :local-icons="[`hp-btn-${info.key}`]"
          class="text-7xl"
        ></SvgIcon>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.svg-top-wrapper {
  ::v-deep(svg) {
    height: 100%;
    object-fit: contain;
  }
}
</style>
