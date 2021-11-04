<script lang="ts" context="module">
  import { writable } from 'svelte/store';
  import { showModal, hideModal } from './Modal.svelte';

  const MODAL_ID = 'reusable_flash_modal';
  const messageStore = writable<string>('');

  export function flashMessage(message: string, millis = 1250) {
    messageStore.set(message);
    showModal(MODAL_ID);
    setTimeout(() => hideModal(), millis);
  }
</script>

<script lang="ts">
  import Modal from './Modal.svelte';

  let classNames = '';
  export { classNames as class };
  export let fade = false;
  export let maxWidth = '';
</script>

<Modal id={MODAL_ID} class={classNames} {fade} {maxWidth}>
  <div class="modal-flash">
    {$messageStore}
  </div>
</Modal>
