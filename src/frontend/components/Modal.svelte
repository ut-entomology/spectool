<script>
  import { closeModal } from 'svelte-modals';

  export let isOpen;
  export let message;
</script>

{#if isOpen}
  <div role="dialog" class="modal">
    <div class="contents">
      <p>{message}</p>
      <div class="actions">
        <button on:click={closeModal}>OK</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    /* allow click-through to backdrop */
    pointer-events: none;
  }

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
