<script lang="ts">
  import { closeModal } from 'svelte-modals';
  import ModalPopup from './ModalPopup.svelte';

  const enum Mode {
    flash, // flash a message for a number of milliseconds
    busy, // show a message while busy, with option to cancel
    ack // wait for user to acknowledge message
  }
  const MAX_BRIEF_DELAY_MILLIS = 1000;

  export let isOpen: boolean;
  export let millis = 0;
  export let message: string;
  export let cancel: (() => void) | null = null;

  let mode = Mode.ack;
  let isBrief = true;

  if (cancel) {
    mode = Mode.busy;
    millis = millis || MAX_BRIEF_DELAY_MILLIS;
  } else if (millis > 0) {
    mode = Mode.flash;
  }

  function open() {
    if (mode == Mode.busy) {
      setTimeout(() => {
        isBrief = false;
      }, millis);
    } else if (mode == Mode.flash) {
      setTimeout(() => closeModal(), millis);
    }
  }

  function requestCancel() {
    closeModal();
    if (cancel) cancel();
  }

  $: if (isOpen) open(); // call non-reactive block
</script>

<ModalPopup {isOpen}>
  <div class="contents">
    <p>{message}</p>
    {#if !isBrief}
      <button on:click={requestCancel}>Cancel</button>
    {:else if millis == 0}
      <div class="actions">
        <button on:click={closeModal}>OK</button>
      </div>
    {/if}
  </div>
</ModalPopup>

<style>
  .contents {
    min-width: 240px;
    border-radius: 6px;
    padding: 16px;
    background: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: auto;
  }

  p {
    text-align: center;
    margin-top: 16px;
  }

  .actions {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
</style>
