import { ref } from 'vue';
import keyCodeMapping from './keyCodeMap';

export function useKeyListener() {
  const keyPressed = ref<number>(-1);

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || !event.code) return;
    event.preventDefault();
    keyPressed.value = keyCodeMapping.get(event.code) ?? -1;
  };

  const onKeyListener = () => {
    window.addEventListener('keydown', handleKeydown);
  };

  const offKeyListener = () => {
    window.removeEventListener('keydown', handleKeydown);
  };

  return {
    keyPressed,
    onKeyListener,
    offKeyListener
  };
}
