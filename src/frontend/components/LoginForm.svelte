<script lang="ts">
  import Modal, { hideModal } from './Modal.svelte';
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';

  export let id: string;
  export let title = '';
  export let login: (
    username: string,
    password: string,
    save: boolean
  ) => Promise<void>;

  let errorMessage = '';

  const { form, errors, handleChange, handleSubmit, handleReset } = createForm({
    initialValues: {
      username: '',
      password: '',
      saving: false
    },
    validationSchema: yup.object().shape({
      username: yup.string().required().label('Username'),
      password: yup.string().required().label('Password')
    }),
    onSubmit: async (values) => {
      try {
        await login(values.username, values.password, values.saving);
        // reset prior to next viewing
        handleReset();
        errorMessage = '';
      } catch (err) {
        errorMessage = (err as Error).message;
      }
    }
  });

  function formControlClass(error: string): string {
    return 'form-control' + (error ? ' is-invalid' : '');
  }

  async function cancelForm() {
    await hideModal();
    handleReset();
    errorMessage = '';
  }
</script>

<Modal {id} fade maxWidth="400px">
  <div class="dialog login-dialog">
    <form class="container g-0" on:submit|preventDefault={handleSubmit}>
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
            class={formControlClass($errors.username)}
            type="text"
            on:change={handleChange}
            on:blur={handleChange}
            bind:value={$form.username}
          />
          {#if $errors.username}
            <div class="invalid-feedback">Required</div>
          {/if}
        </div>
      </div>
      <div class="row mb-3 justify-content-center">
        <div class="col-3">
          <label for="password" class="col-form-label">Password</label>
        </div>
        <div class="col-6">
          <input
            id="password"
            class={formControlClass($errors.password)}
            type="password"
            on:change={handleChange}
            on:blur={handleChange}
            bind:value={$form.password}
          />
          <div class="invalid-feedback">Required</div>
        </div>
      </div>
      <div class="row justify-content-center">
        <div class="col-auto">
          <div class="form-check">
            <input
              id="saving"
              role="button"
              class="form-check-input"
              bind:checked={$form.saving}
              type="checkbox"
            />
            <label class="form-check-label" for="saving">
              Stay logged in on this computer
            </label>
          </div>
        </div>
      </div>
      <div class="row justify-content-center">
        <div class="col-3">
          <button class="btn btn-minor" type="button" on:click={cancelForm}
            >Cancel</button
          >
        </div>
        <div class="col-1" />
        <div class="col-3">
          <button class="btn btn-major" type="submit">Login</button>
        </div>
      </div>
      {#if errorMessage}
        <div class="error-region">
          <div class="alert alert-danger" role="alert">{errorMessage}</div>
        </div>
      {/if}
    </form>
  </div>
</Modal>

<style>
  form h2 {
    margin: 0 0 1em 0;
    font-weight: bold;
    font-size: 105%;
    text-align: center;
  }

  button {
    width: 100%;
    margin-top: 1em;
  }

  .error-region {
    margin-top: 1em;
  }
</style>
