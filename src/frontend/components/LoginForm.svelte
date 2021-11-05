<script lang="ts">
  import Modal, { hideModal } from './Modal.svelte';

  export let id: string;
  export let title = '';
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
</script>

<Modal {id} fade maxWidth="400px">
  <div class="dialog login-dialog">
    <form class="container g-0" on:submit|preventDefault={attemptLogin} novalidate>
      <div class="row">
        <h2 class="col">{title}</h2>
      </div>
      <div class="row mb-2 justify-content-center">
        <div class="col-3">
          <label for="username" class="col-form-label">Username</label>
        </div>
        <div class="col-6">
          <input
            id="username"
            class="form-control"
            type="text"
            bind:value={username}
            required
          />
        </div>
      </div>
      <div class="row mb-2 justify-content-center">
        <div class="col-3">
          <label for="password" class="col-form-label">Password</label>
        </div>
        <div class="col-6">
          <input
            id="password"
            class="form-control"
            bind:value={password}
            type="password"
            required
          />
        </div>
      </div>
      <div class="row justify-content-center">
        <div class="col-auto">
          <label class="col-form-label">
            <input
              id="saving"
              role="button"
              class="form-check-input"
              bind:checked={savingCredentials}
              type="checkbox"
            />
            Stay logged in on this computer
          </label>
        </div>
      </div>
      <div class="row justify-content-center">
        <div class="col-3">
          <button class="btn-minor" type="button" on:click={() => hideModal()}
            >Cancel</button
          >
        </div>
        <div class="col-1" />
        <div class="col-3">
          <button class="btn-major" type="submit">Login</button>
        </div>
      </div>
      <div class="row">
        <div class="col error">
          {message}
        </div>
      </div>
    </form>
  </div>
</Modal>

<style>
  form h2 {
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
