<script lang="ts" context="module">
  /*
    Displays a modal dialog using Bootstrap's modal javascript.

    Exports `showModal()` and `hideModal()` for showing the identified modal and
    for hiding whichever modal is active. Do not use the `data-bs-*` attributes
    with this component.
  */

  const currentModalStore = writable<any>(null);
  let currentModal: any = null; // a bootstrap modal object

  currentModalStore.subscribe((modal) => {
    currentModal = modal;
  });

  export type ModalOptions = {
    backdrop?: boolean | string;
    keyboard?: boolean;
    focus?: boolean;
  };

  export function showModal(id: string, options?: ModalOptions) {
    if (currentModal !== null) throw Error('Modal already showing');
    options ||= {};
    if (options.backdrop === undefined) {
      options.backdrop = 'static';
    }

    const modal = new bootstrap.Modal(document.getElementById(id), options);
    currentModalStore.set(modal);
    modal.show();
  }

  export function hideModal(afterHideCallback?: () => void) {
    if (currentModal === null) throw Error('No modal to hide');
    currentModal.hide();
    if (afterHideCallback) {
      const modalElement = document.getElementById(currentModal._element.id);
      modalElement!.addEventListener('hidden.bs.modal', function (_event) {
        afterHideCallback();
      });
    }
  }

  function clearCurrentModal() {
    currentModalStore.set(null);
  }
</script>

<script lang="ts">
  import * as bootstrap from 'bootstrap';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  export let id: string;
  let classNames = '';
  export { classNames as class };
  export let fade = false;
  export let maxWidth = '';

  const modalClass = 'modal' + (fade ? ' fade' : '');
  const style = maxWidth ? 'max-width: ' + maxWidth : '';

  onMount(() => {
    // Only clear current modal when it is really hidden, and always do so.
    const modalElement = document.getElementById(id);
    modalElement!.addEventListener('hidden.bs.modal', function (_event) {
      clearCurrentModal();
    });
  });
</script>

<div class={modalClass} {id} tabindex="-1" aria-hidden="true">
  <div class={'modal-dialog ' + classNames} {style}>
    <slot>No content provided</slot>
  </div>
</div>
