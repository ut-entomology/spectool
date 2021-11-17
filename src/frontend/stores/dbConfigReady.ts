import { writable } from 'svelte/store';

export const databaseConfigReady = writable<boolean>(false);
