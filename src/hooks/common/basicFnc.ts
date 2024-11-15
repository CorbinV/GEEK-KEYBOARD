import type { Ref } from 'vue';
import { ref } from 'vue';
export function useResttableRefFn<T>(value: () => T): [Ref<T>, () => void] {
  const data = ref(value()) as Ref<T>;
  const reset = () => {
    data.value = value();
  };
  return [data, reset];
}
