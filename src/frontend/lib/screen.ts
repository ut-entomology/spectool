import type { SvelteComponent } from 'svelte';

export interface Screen {
  title: string;
  componentType: typeof SvelteComponent;
  params: { [key: string]: any };
}
