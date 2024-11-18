import { useDeviceStore } from '@/store/modules/device';
const store = useDeviceStore();
const requestClient = store.getDeviceClient();
export default requestClient;
export { requestClient };
