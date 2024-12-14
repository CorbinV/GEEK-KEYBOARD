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
  const generateBaseItem = (idx: number) => {
    return { color: '#3c8df4', currentHeight: initialHeight.value, isAboveMask: false, position: idx, to: idx };
  };
  const generateGroupItem = () => {
    return Array.from({ length: 4 }).map((_, idx) => {
      return generateBaseItem(idx);
    });
  };
  const [dksGroupList, resetDksGroupList] = useResttableReactiveFn<any>(() => {
    return Array.from({ length: 4 }).map((): CapsuleItem[] => {
      return generateGroupItem();
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

  return { initialHeight, dksGroupList, resetDksGroupList, generateGroupItem };
});
