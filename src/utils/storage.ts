import { createLocalforage, createStorage } from '@sa/utils';

const storagePrefix = import.meta.env.VITE_STORAGE_PREFIX || '';

export const localStg = createStorage<StorageType.Local>('local', storagePrefix);

export const sessionStg = createStorage<StorageType.Session>('session', storagePrefix);

export const localforage = createLocalforage<StorageType.Local>('local');
export const kbStg = createStorage<any>('local', 'KB_');
export const keyboardforage = createLocalforage<any>('indexedDB', {
  name: 'keyboard',
  storeName: 'keyboard',
  version: 1.0,
  description: 'keyboard'
});
