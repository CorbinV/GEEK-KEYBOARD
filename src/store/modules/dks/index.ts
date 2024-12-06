import { effectScope, onScopeDispose, ref } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';
import { useResttableReactiveFn } from '@/hooks/common/basicFnc';
export interface CapsuleItem {
  color: string;
  currentHeight: number;
  isAboveMask: boolean;
  position: number;
  to: number;
}
export const useDksStore = defineStore(SetupStoreId.DKS, () => {
  const initialHeight = ref(0);
  const [dksGroupList, resetDksGroupList] = useResttableReactiveFn<any>(() => {
    return Array.from({ length: 4 }).map((): CapsuleItem[] => {
      return [
        { color: '#3c8df4', currentHeight: initialHeight.value, isAboveMask: false, position: 0, to: 0 },
        { color: '#3c8df4', currentHeight: initialHeight.value, isAboveMask: false, position: 1, to: 1 },
        { color: '#3c8df4', currentHeight: initialHeight.value, isAboveMask: false, position: 2, to: 2 },
        { color: '#3c8df4', currentHeight: initialHeight.value, isAboveMask: false, position: 3, to: 3 }
      ];
    });
  });
  const scope = effectScope();

  function init() {}

  // watch store
  scope.run(() => {});

  /** On scope dispose */
  onScopeDispose(() => {
    scope.stop();
  });

  // init
  init();

  return { initialHeight, dksGroupList, resetDksGroupList };
});
