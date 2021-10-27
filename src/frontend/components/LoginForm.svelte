<script lang="ts">
  import ModalPopup from './ModalPopup.svelte';
  import { closeModal } from 'svelte-modals';

  export let title = '';
  export let isOpen: boolean;
  export let login: (
    username: string,
    password: string,
    save: boolean
  ) => Promise<void>;

  let username = '';
  let password = '';
  let savingCredentials = false;
  let message = '';

  async function attemptLogin() {
    try {
      await login(username, password, savingCredentials);
    } catch (err) {
      message = (err as Error).message;
    }
  }

  function cancel() {
    closeModal();
  }
</script>

<ModalPopup {isOpen}>
  <div class="contents">
    <div class="title">{title}</div>
    <label>
      username:
      <input bind:value={username} />
    </label>
    <label>
      password:
      <input bind:value={password} type="password" />
    </label>
    <p>
      <label>
        <input bind:checked={savingCredentials} type="checkbox" />
        stay logged in on this computer
      </label>
    </p>

    <p class="actions">
      <button on:click={cancel}> Cancel </button>
      <button on:click={attemptLogin}> Login </button>
    </p>

    <p class="error">{message}</p>
  </div>
</ModalPopup>

<style>
  .contents {
    width: 400px;
    border-radius: 8px;
    padding: 1.5em;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: auto;
  }

  .title {
    margin-bottom: 1em;
    font-weight: bold;
  }

  p {
    margin: 0.5em 0;
  }

  .actions {
    display: flex;
    justify-content: center;
  }

  button {
    margin: 0 2em;
  }

  .error {
    color: red;
    text-align: center;
  }
</style>
