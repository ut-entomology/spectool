<script lang="ts" context="module">
  import { writable } from 'svelte/store';
  import { ModalOptions, showModal, hideModal } from '../layout/Modal.svelte';

  const MODAL_ID = 'global_notice_modal';
  const messageStore = writable<string>('');
  const buttonTextStore = writable<string | null>(null);

  export function showNotice(
    message: string,
    buttonText: string = 'OK',
    options?: ModalOptions
  ) {
    messageStore.set(message);
    buttonTextStore.set(buttonText);
    showModal(MODAL_ID, options);
  }
</script>

<script lang="ts">
  import Modal from '../layout/Modal.svelte';

  let classNames = '';
  export { classNames as class };
  export let fade = false;
  export let maxWidth = '';
</script>

<Modal id={MODAL_ID} class={classNames} {fade} {maxWidth}>
  <div class="modal-notice">
    {$messageStore}
    <div>
      <button type="button" class="btn-major" on:click={() => hideModal()}
        >{$buttonTextStore}</button
      >
    </div>
  </div>
</Modal>
