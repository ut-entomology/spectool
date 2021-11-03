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
    <div class="container g-0">
      <div class="row">
        <div class="title col">{title}</div>
      </div>
      <div class="row justify-content-center">
        <div class="col-3">
          <label for="username">Username</label>
        </div>
        <div class="col-6">
          <input id="username" type="text" bind:value={username} />
        </div>
      </div>
      <div class="row space justify-content-center">
        <div class="col-3">
          <label for="password">Password</label>
        </div>
        <div class="col-6">
          <input id="password" bind:value={password} type="password" />
        </div>
      </div>
      <div class="row space justify-content-center">
        <div class="col-auto">
          <label>
            <input id="saving" bind:checked={savingCredentials} type="checkbox" />
            stay logged in on this computer
          </label>
        </div>
      </div>
      <div class="row justify-content-center">
        <div class="col-3">
          <button class="btn-minor" on:click={cancel}>Cancel</button>
        </div>
        <div class="col-1" />
        <div class="col-3">
          <button class="btn-major" on:click={attemptLogin}>Login</button>
        </div>
      </div>
      <div class="row">
        <div class="col error">
          {message}
        </div>
      </div>
    </div>
  </div>
</ModalPopup>

<style>
  .contents {
    width: 400px;
    border-radius: 8px;
    background: white;
    pointer-events: auto;
  }

  .space {
    margin-top: 0.5em;
  }

  .title {
    margin: 1em;
    font-weight: bold;
    font-size: 105%;
    text-align: center;
  }

  input[type='text'],
  input[type='password'] {
    width: 100%;
  }

  input[type='checkbox'] {
    margin-right: 0.5em;
  }

  button {
    margin-top: 1.5em;
    width: 100%;
  }

  .error {
    color: red;
    text-align: center;
    padding: 1.5em;
  }
</style>
