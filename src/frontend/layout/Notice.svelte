<script lang="ts">
  import { Toast, ToastHeader, ToastBody } from 'sveltestrap';

  export let alert = 'light';
  export let header = 'Notice';
  export let message = '';

  let isOpen = true;

  const closeNotice = () => {
    isOpen = false;
  };
</script>

{#if isOpen}
  <div
    class="p-3 position-fixed top-50 start-50 translate-middle bg-{alert} bg-opacity-75"
  >
    <Toast fade={false} on:close={closeNotice} on:close>
      <ToastHeader class="text-{alert}" toggle={closeNotice}>{header}</ToastHeader>
      <ToastBody>
        {@html message}
      </ToastBody>
    </Toast>
  </div>
{/if}
