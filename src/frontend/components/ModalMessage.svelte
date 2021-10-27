<script lang="ts">
  import ModalPopup from './ModalPopup.svelte';
  import { closeModal } from 'svelte-modals';

  export let isOpen: boolean;
  export let millis = 0;
  export let message: string;

  $: if (isOpen) {
    setTimeout(() => closeModal(), millis);
  }
</script>

<ModalPopup {isOpen}>
  <div class="contents">
    <p>{message}</p>
    {#if millis == 0}
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
