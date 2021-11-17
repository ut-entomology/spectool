import type { SvelteComponent } from 'svelte';

export interface AppScreen {
  // Electron also defines 'Screen'
  title: string;
  componentType: typeof SvelteComponent;
  params: { [key: string]: any };
}
