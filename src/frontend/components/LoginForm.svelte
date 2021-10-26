<script lang="ts">
  import { closeModal } from 'svelte-modals';

  export let isOpen: boolean;
  export let login: (
    username: string,
    password: string,
    save: boolean
  ) => Promise<void>;

  let username: string = '';
  let password: string = '';
  let savingCredentials = false;
  let message = '';

  async function attemptLogin() {
    try {
      await login(username, password, savingCredentials);
      closeModal();
    } catch (err) {
      message = (err as Error).message;
    }
  }

  function cancel() {
    closeModal();
  }
</script>

{#if isOpen}
  <div role="dialog" class="modal">
    <div class="contents">
      <label>
        username:
        <input bind:value={username} />
      </label>
      <label>
        password:
        <input bind:value={password} type="password" />
      </label>
      <label>
        <input bind:checked={savingCredentials} type="checkbox" />
        Stay logged in on this computer
      </label>

      <div class="actions">
        <button on:click={cancel}> Cancel </button>
        <button on:click={attemptLogin}> Login </button>
      </div>

      <p>{message}</p>
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
    width: 50em;
    border-radius: 6px;
    padding: 1em;
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
