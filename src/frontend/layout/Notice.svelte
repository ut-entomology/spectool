<script lang="ts" context="module">
  import { writable } from 'svelte/store';

  interface Notice {
    message: string;
    header: string;
    alert: string;
  }

  const noticeStore = writable<Notice | null>(null);

  export function showNotice(
    message: string,
    header: string = 'Notice',
    alert: string = 'light'
  ) {
    noticeStore.set({ message, header, alert });
  }
</script>

<script lang="ts">
  import { Toast, ToastHeader, ToastBody } from 'sveltestrap';

  const closeNotice = () => {
    noticeStore.set(null);
  };
</script>

{#if $noticeStore}
  <div
    class="p-3 position-fixed top-50 start-50 translate-middle bg-{$noticeStore.alert} bg-opacity-75"
  >
    <Toast fade={false} on:close={closeNotice}>
      <ToastHeader class="text-{$noticeStore.alert}" toggle={closeNotice}
        >{$noticeStore.header}</ToastHeader
      >
      <ToastBody>
        {@html $noticeStore.message}
      </ToastBody>
    </Toast>
  </div>
{/if}
