<script setup lang="ts">
import type { Dom, SVGTypeMapping, Svg } from '@svgdotjs/svg.js';
import { SVG } from '@svgdotjs/svg.js';
import { nextTick, onMounted, ref, toRefs, watch } from 'vue';
import controlBgSvg from '@/assets/svg-icon/hp-ctrl-bg.svg';
import controlBtnSvg from '@/assets/svg-icon/hp-ctrl-btn.svg';
import { useKeyboardStore } from '@/store/modules/keyboard';
import { setKeyInfo } from '@/api/key';
type ControlProps = {
  updateBtn?: string;
};
const props = withDefaults(defineProps<ControlProps>(), {
  updateBtn: ''
});
const keyboardStore = useKeyboardStore();
const { keyLayerInfo, activeKeyLayer } = toRefs(keyboardStore);
const { layoutMap } = keyboardStore.kbCfg;
const fetchData = async (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    fetch(url)
      .then(r => resolve(r.text()))
      .catch(e => reject(e));
  });
const genSymbolId = (icon: string) => {
  const { VITE_ICON_LOCAL_PREFIX: prefix } = import.meta.env;
  return `${prefix}-hp-source_BTN_${icon}`;
};
let ctrlInstance: SVGTypeMapping<Dom> | null = null;

const activeBtn = ref('');
watch(
  () => props.updateBtn,
  name => {
    if (!name) {
      return;
    }
    updateBtnView(name);
  }
);
async function updateBtnEffect(key: string, val: string) {
  let res: [boolean, any] = [true, ''];
  try {
    const send = {
      cfg: keyLayerInfo.value.configIndex,
      layer: keyLayerInfo.value.layerIndex,
      k: key,
      v: val
    };
    await setKeyInfo(send);
    const oldV = activeKeyLayer.value.keys[key]?.v || 'err';
    keyboardStore.pushState({
      oldVal: { ...send, v: oldV },
      newVal: send
    });
  } catch (error) {
    window?.$message!.error('按键修改失败');
    res = [false, error];
  }
  return res;
}
function updateIcon(iconKey: string, layoutKey: string, ctx: Svg) {
  ctx.clear();
  const iconName = genSymbolId(iconKey);
  const { pos } = layoutMap.get(layoutKey)!;
  const element = ctx.use(iconName);
  const nBbox = element.bbox();
  const x = pos[0] - nBbox.cx;
  const y = pos[1] - nBbox.cy;
  element.move(x, y).front();
  element.scale(1.12);
  if (iconName !== 'NULL') {
    element.fill('#a6a6a6');
  }
}
async function updateBtnByParent(key: string, value: string) {
  if (!ctrlInstance || !activeBtn.value) {
    return;
  }
  const ctx = ctrlInstance.findOne(`#${key}_CTX`) as Svg;
  if (!ctx) {
    return;
  }
  await setKeyInfo({
    cfg: keyLayerInfo.value.configIndex,
    layer: keyLayerInfo.value.layerIndex,
    k: key,
    v: value
  });
  let tKey = key;
  if (activeBtn.value === 'G_UP' && key === 'UP') {
    tKey = 'UP_LIGHT';
  }
  updateIcon(value, tKey, ctx);
}
async function updateBtnView(key: string) {
  if (!ctrlInstance || !activeBtn.value) {
    return;
  }
  const ctx = ctrlInstance.findOne(`#${activeBtn.value}_CTX`) as Svg;
  if (!ctx) {
    return;
  }
  const btn = activeBtn.value.split('_').pop()!;
  const [res, errMsg] = await updateBtnEffect(btn, props.updateBtn);
  if (!res) {
    window?.$log?.error(errMsg);
    return;
  }
  // ctx.clear();
  let tKey = key;
  if (activeBtn.value === 'G_UP' && key === 'UP') {
    tKey = 'UP_LIGHT';
  }
  updateIcon(tKey, btn, ctx);
}
const btnRef = ref();
const bgRef = ref();
function initCtx() {
  if (!ctrlInstance) {
    return;
  }
  // 基于获取的参数配置，替换掉原图片中 ctx
  Array.from(layoutMap.keys()).forEach(key => {
    // ks
    const ctx = ctrlInstance!.findOne(`#G_${key}_CTX`) as Svg;
    // ctx.clear();

    let tKey = key;
    if (key === 'UP') {
      tKey = 'UP_LIGHT';
    }
    updateIcon(tKey, key, ctx);
    // const { pos } = layoutMap.get(key)!;
    // const iconName = genSymbolId(tKey);
    // const element = ctx.use(iconName);
    // const nBbox = element.bbox();
    // const x = pos[0] - nBbox.cx;
    // const y = pos[1] - nBbox.cy;
    // element.move(x, y);
    // element.scale(1.12);
    // // .fill('#a6a6a6');
    // if (key !== 'NULL') {
    //   element.fill('#a6a6a6');
    // }
  });
}
function initWatch() {
  watch(
    () => activeKeyLayer.value.xxx,
    val => {
      if (!ctrlInstance) {
        return;
      }
      // update btn view
      const keys = Object.keys(val.keys);
      keys.forEach(key => {
        const ctx = ctrlInstance!.findOne(`#G_${key}_CTX`) as Svg;
        if (!ctx) {
          return;
        }
        const btnVal = val.keys[key].v as string;
        let tKey = key;
        if (key === 'UP') {
          tKey = 'UP_LIGHT';
        }
        updateIcon(tKey, btnVal, ctx);
      });
    }
  );
}
onMounted(async () => {
  Promise.all([fetchData(controlBtnSvg), fetchData(controlBgSvg)]).then(([btn, bg]) => {
    bgRef.value.innerHTML = bg;
    btnRef.value.innerHTML = btn;
    nextTick(() => {
      ctrlInstance = SVG(btnRef.value).first();
      ctrlInstance.on('click', event => {
        const targetElement = (event.target as Element).closest('[data-name]');
        if (targetElement) {
          const btnName = (targetElement as SVGAElement).dataset.name;
          if (btnName === activeBtn.value) {
            activeBtn.value = '';
            const ctx = ctrlInstance!.findOne(`#${btnName}_BORDER`) as Svg;
            if (!ctx) {
              return;
            }
            ctx.fill('#424242');
            return;
          }
          const lastActiveBtn = activeBtn.value;
          activeBtn.value = btnName!;
          if (lastActiveBtn) {
            const ctx = ctrlInstance!.findOne(`#${lastActiveBtn}_BORDER`) as Svg;
            if (!ctx) {
              return;
            }
            ctx.fill('#424242');
          }
          const ctx1 = ctrlInstance!.findOne(`#${btnName}_BORDER`) as Svg;
          if (!ctx1) {
            return;
          }
          ctx1.fill('#e64324');
        }
      });
      initCtx();
      initWatch();
    });
  });
});
defineExpose({
  updateBtnByParent
});
</script>

<template>
  <div class="relative">
    <div ref="bgRef" class="absolute left-0 top-0"></div>
    <div ref="btnRef" class="pointer-event-all absolute left-0 top-0"></div>
  </div>
</template>

<style lang="scss" scoped>
.svg-top-wrapper {
  svg {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
