import { ref } from 'vue';
export default function useLoading() {
  const isLoading = ref(false);
  let lazyLoadingTimer: any = null;

  const startLoading = () => {
    isLoading.value = true;
  };

  const stopLoading = () => {
    isLoading.value = false;
    if (lazyLoadingTimer) {
      clearTimeout(lazyLoadingTimer);
      lazyLoadingTimer = null;
    }
  };

  const lazyLoading = (duration: number = 300) => {
    startLoading();
    lazyLoadingTimer = setTimeout(() => {
      stopLoading();
    }, duration);
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
    lazyLoading
  };
}
