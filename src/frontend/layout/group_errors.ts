import { writable } from 'svelte/store';

export const groupErrorsKey = {};

export function createErrorsStore() {
  const { set, subscribe, update } = writable<{ [key: string]: string }>({});
  return {
    set,
    subscribe,
    error: (name: string, error: string) => {
      update((errors) => {
        errors[name] = error;
        for (const key in errors) {
          if (errors[key]) return errors;
        }
        return {};
      });
    }
  };
}

export function normalizeError(error: string) {
  const requiredOffset = error.indexOf(' is a required field');
  if (requiredOffset > 0) {
    return error.substr(0, requiredOffset) + ' required';
  }
  return error;
}
