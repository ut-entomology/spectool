import { Writable, writable } from 'svelte/store';

type NonFunctionProperties<T> = {
  [p in keyof T]: T[p] extends Function ? never : T[p];
};

export function createStore<T>(
  key: string,
  initialValue: T,
  reconstruct?: (obj: NonFunctionProperties<T>) => T
): Writable<T> {
  const inDevMode = localStorage.getItem('app_mode')?.startsWith('dev');
  if (inDevMode) {
    const setLocalStorage = (value: T) => {
      if (value === undefined) {
        throw Error("Can't set local store to undefined");
      }
      localStorage.setItem(key, JSON.stringify(value));
    };

    const localValueJSON = localStorage.getItem(key);
    if (localValueJSON) {
      const localValue = JSON.parse(localValueJSON);
      initialValue = reconstruct ? reconstruct(localValue) : localValue;
    } else {
      setLocalStorage(initialValue);
    }

    const svelteStore = writable(initialValue);
    svelteStore.subscribe((value) => setLocalStorage(value));

    return svelteStore;
  }
  return writable(initialValue);
}
