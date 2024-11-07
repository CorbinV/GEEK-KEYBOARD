import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

export type AreaAttrType = {
  coords: number[];
  [key: string]: any;
};
export interface AreaAttrTypeWithCoords extends Omit<AreaAttrType, 'coords'> {
  coords: string;
}
/**
 * @param ops
 * @param {boolean} ops.enableDebounce -[optional] - enable debounce
 * @param {number} ops.debounceWait -[optional] - debounce wait time(unit: ms)
 * @description: update area attrs date
 */
export function useImageMapAdjuster(ops?: { enableDebounce?: boolean; debounceWait?: number }) {
  const areasList = ref<AreaAttrTypeWithCoords[]>([]);

  function adjustAreasCore(img: HTMLImageElement, originalAreas: AreaAttrType[]) {
    if (!img) return;

    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    const currentWidth = img.width;
    const currentHeight = img.height;

    const widthRatio = currentWidth / originalWidth;
    const heightRatio = currentHeight / originalHeight;

    areasList.value = originalAreas.map(area => {
      const adjustedCoords = area.coords
        .map((coord, index) => (index % 2 === 0 ? coord * widthRatio : coord * heightRatio))
        .join(',');
      return {
        ...area,
        coords: adjustedCoords
      };
    });
  }
  const adjustAreasFn = ops?.enableDebounce ? useDebounceFn(adjustAreasCore, ops.debounceWait ?? 500) : adjustAreasCore;
  return { areasList, adjustAreasFn };
}
