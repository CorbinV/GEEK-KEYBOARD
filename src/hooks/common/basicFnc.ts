import type { Reactive, Ref } from 'vue';
import { reactive, ref } from 'vue';
export function useResttableRefFn<T>(value: () => T): [Ref<T>, () => void] {
  const data = ref(value()) as Ref<T>;
  const reset = () => {
    data.value = value();
  };
  return [data, reset];
}
export function useResttableReactiveFn<T extends object>(value: () => T): [Reactive<T>, () => void] {
  const data = reactive(value()) as Reactive<T>;
  const reset = () => {
    Object.keys(data).forEach(key => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (data as any)[key];
    });
    Object.assign(data, value());
  };
  return [data, reset] as const;
}
