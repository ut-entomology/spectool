import type { SvelteComponent } from 'svelte';
import { openWindow } from 'svelte-window-system';

const DEFAULT_REPORT_WIDTH = 1024;
const DEFAULT_REPORT_HEIGHT = 900;

export function openReport(component: typeof SvelteComponent, params: any) {
  openWindow(
    component,
    {
      width: DEFAULT_REPORT_WIDTH,
      height: DEFAULT_REPORT_HEIGHT
    },
    params
  );
}
