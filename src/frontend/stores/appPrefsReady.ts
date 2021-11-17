import { writable } from 'svelte/store';

export const appPrefsReady = writable<boolean>(false);
