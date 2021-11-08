import { writable } from 'svelte/store';

export const appDisabled = writable<boolean>(false);
