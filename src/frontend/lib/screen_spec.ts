import type { SvelteComponent } from 'svelte';

export interface ScreenSpec {
  // Electron also defines 'Screen'
  title: string;
  target: typeof SvelteComponent;
  params: { [key: string]: any };
}
