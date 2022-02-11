<script lang="ts" context="module">
  import type { SvelteComponent } from 'svelte';
  import { writable } from 'svelte/store';

  const DEFAULT_WINDOW_WIDTH = 820;
  const DEFAULT_WINDOW_HEIGHT = 820;

  export interface ReportCallbacks {
    showStatus: (message: string) => void;
    showReport: (windowName: string, style?: string) => void;
    failReport: (message: string) => void;
  }

  interface ReportData {
    component: typeof SvelteComponent;
    params: any;
  }

  const reportStore = writable<ReportData | null>(null);

  export function openReport(component: typeof SvelteComponent, params: any) {
    reportStore.set({ component, params });
  }
</script>

<script lang="ts">
  import { showNotice } from './VariableNotice.svelte';
  import Modal from './Modal.svelte';

  let statusMessages: string[] = [];
  let reportWindow: Window | null = null;
  let element: any;

  function showStatus(message: string) {
    statusMessages = [...statusMessages, message];
  }

  function showReport(windowName: string, style?: string) {
    reportWindow = window.open(
      '',
      windowName,
      `width=${DEFAULT_WINDOW_WIDTH},height=${DEFAULT_WINDOW_HEIGHT},status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
    if (reportWindow) {
      awaitRendering(style);
    } else {
      failReport('Failed to open window');
    }
  }

  function failReport(message: string) {
    reportStore.set(null);
    showNotice(message, 'ERROR', 'danger');
  }

  const callbacks: ReportCallbacks = { showStatus, showReport, failReport };

  function awaitRendering(style?: string) {
    setTimeout(() => {
      let html = element.innerHTML;
      if (html) {
        if (style) {
          html = `${style}\n\n${html}`;
        }
        reportWindow!.document.body.innerHTML = html;
        reportStore.set(null);
        reportWindow = null;
        statusMessages = [];
      } else {
        awaitRendering();
      }
    }, 500);
  }
</script>

{#if $reportStore}
  <Modal contentClasses="window_report_status">
    <div class="header">Generating Report</div>
    <div class="messages">
      {#each statusMessages as message}
        <div class="status">{message}</div>
      {/each}
    </div>
  </Modal>
  <div bind:this={element} style="display:none">
    <svelte:component
      this={$reportStore.component}
      {...$reportStore.params}
      {callbacks}
    />
  </div>
{/if}

<style>
  :global(.window_report_status) {
    text-align: center;
    padding: 1em;
  }
  .header {
    font-size: 1.2em;
    font-weight: bold;
    margin-bottom: 1em;
  }
  .status {
    margin-bottom: 0.5em;
    text-align: left;
  }
</style>
