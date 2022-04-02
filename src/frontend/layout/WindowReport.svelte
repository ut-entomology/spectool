<script lang="ts" context="module">
  // TODO: This is app-specific and so doesn't belong in layout.

  import type { SvelteComponent } from 'svelte';
  import { writable } from 'svelte/store';

  const DEFAULT_WINDOW_WIDTH = 820;
  const DEFAULT_WINDOW_HEIGHT = 820;

  export interface ReportCallbacks {
    showStatus: (message: string) => void;
    showReport: (windowName: string, style?: string) => void;
    failReport: (err: Error) => void;
  }

  interface ReportData {
    component: typeof SvelteComponent;
    params: any;
  }

  export class ReportNoticeError extends Error {
    constructor(message: string) {
      super(message);
    }
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

  const pageHeader = `
    <div style="text-align: right; margin: 5px 20px 0 0">
      <button onclick="window.print()" style="">Print</button>
    </div>
    <style type="text/css">
      @media print { body { -webkit-print-color-adjust: exact; } }
    </style>\n`;

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
      awaitRendering(style ? pageHeader + style : pageHeader);
    } else {
      failReport(Error('Failed to open window'));
    }
  }

  function failReport(err: Error) {
    reportStore.set(null);
    showNotice(
      err.message,
      err instanceof ReportNoticeError ? 'NOTICE' : 'ERROR',
      err instanceof ReportNoticeError ? 'warning' : 'danger'
    );
  }

  const callbacks: ReportCallbacks = { showStatus, showReport, failReport };

  function awaitRendering(head: string) {
    setTimeout(() => {
      let html = element.innerHTML;
      if (html) {
        html = `${head}\n\n${html}`;
        reportWindow!.document.body.innerHTML = html;
        reportStore.set(null);
        reportWindow = null;
        statusMessages = [];
      } else {
        awaitRendering(head);
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
