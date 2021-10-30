import type { SvelteComponent } from 'svelte';

export interface Activity {
  title: string;
  component: typeof SvelteComponent;
  description: string;
  preClose: () => Promise<boolean>;
}
