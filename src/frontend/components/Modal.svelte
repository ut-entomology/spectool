<script lang="ts" context="module">
  /*
    Displays a modal dialog using Bootstrap's modal javascript. Only supports
    one modal at a time, as is the case with Bootstrap anyway.

    Exports `showModal()` and `hideModal()` for showing the identified modal and
    for hiding whichever modal is active. Do not use Bootstrap's `data-bs-*`
    attributes with this component.
  */

  const currentModalIDStore = writable<string | null>(null);
  let currentModalID: string | null = null;

  currentModalIDStore.subscribe((modalID) => {
    currentModalID = modalID;
  });

  export type ModalOptions = {
    // defined by Bootstrap
    backdrop?: boolean | string;
    keyboard?: boolean;
    focus?: boolean;
  };

  export function showModal(id: string, options?: ModalOptions): Promise<void> {
    if (currentModalID !== null) throw Error('Modal already showing');
    options ||= {};
    if (options.backdrop === undefined) {
      options.backdrop = 'static';
    }

    return new Promise((resolve, reject) => {
      try {
        const modalElement = document.getElementById(id);
        const modal = new bootstrap.Modal(modalElement, options);
        currentModalIDStore.set(id);
        modalElement!.addEventListener('shown.bs.modal', function (_event) {
          resolve();
        });
        modal.show();
      } catch (err) {
        reject(err);
      }
    });
  }

  export function hideModal(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (currentModalID === null) throw Error('No modal to hide');
        const modalElement = document.getElementById(currentModalID);
        modalElement!.addEventListener('hidden.bs.modal', function (_event) {
          // Can't be sure the originally queued callback will run first.
          currentModalIDStore.set(null);
          // The caller can open another modal at this point, if desired.
          resolve();
        });
        bootstrap.Modal.getInstance(modalElement).hide();
      } catch (err) {
        reject(err);
      }
    });
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

  onMount(() => {
    // Only clear current modal when it is really hidden, and always do so.
    const modalElement = document.getElementById(id);
    modalElement!.addEventListener('hidden.bs.modal', function (_event) {
      currentModalIDStore.set(null);
    });
  });
</script>

<div {id} class={'modal' + (fade ? ' fade' : '')} tabindex="-1" aria-hidden="true">
  <div class={'modal-dialog ' + classNames}>
    {#if maxWidth}
      <div style={'margin: 0 auto; max-width: ' + maxWidth}>
        <slot>No content provided</slot>
      </div>
    {:else}
      <slot>No content provided</slot>
    {/if}
  </div>
</div>
