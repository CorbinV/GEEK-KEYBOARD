<script setup lang="ts">
import { ref } from 'vue';
import imageSrc from '@/assets/img/standard-keyboard.png';
import { useImageMapAdjuster } from '@/hooks/business/useImageMapAdjuster';
import originalAreas from '@/assets/files/standard-keyboard.json';
const emit = defineEmits(['key-clicked']);
const { areasList, adjustAreasFn } = useImageMapAdjuster({
  enableDebounce: true,
  debounceWait: 1000
});
const KeyboardImgRef = ref<HTMLImageElement>();
const onImageLoad = () => {
  const img = KeyboardImgRef.value;
  if (!img) return;
  adjustAreasFn(KeyboardImgRef.value!, originalAreas);
};
function handleKeyClicked(e: Event) {
  const target = e.target as HTMLElement;
  const key = target.dataset.key;
  const code = target.dataset.code;
  console.log('key:', key, 'code:', code);
  if (key) {
    emit('key-clicked', [key, code]);
  }
}
defineExpose({});
</script>

<template>
  <div class="relative">
    <img
      ref="KeyboardImgRef"
      :src="imageSrc"
      usemap="#image-map"
      alt="Keyboard"
      class="responsive-image"
      @load="onImageLoad"
    />
    <map name="image-map" @click.prevent="handleKeyClicked">
      <area
        v-for="area in areasList"
        :key="area.code"
        :shape="area.shape"
        :coords="area.coords"
        :data-key="area.key"
        :data-code="area.code"
      />
    </map>
  </div>
</template>
