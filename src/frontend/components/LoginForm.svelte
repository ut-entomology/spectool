<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  import Input from '../layout/Input.svelte';
  import Modal, { hideModal } from '../layout/Modal.svelte';

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
      password: yup.string().required().label('Password'),
      saving: yup.bool()
    }),
    onSubmit: async (values) => {
      try {
        console.log('Saving?', values.saving);
        await login(values.username, values.password, values.saving);
        // reset prior to next viewing
        handleReset();
        errorMessage = '';
      } catch (err) {
        errorMessage = (err as Error).message;
      }
    }
  });

  async function cancelForm() {
    await hideModal();
    handleReset();
    errorMessage = '';
  }
</script>

<Modal {id} fade maxWidth="400px">
  <div class="dialog">
    <form class="container g-0" on:submit|preventDefault={handleSubmit}>
      <div class="row">
        <h2 class="col">{title}</h2>
      </div>
      <div class="row mb-2 justify-content-center">
        <div class="col-sm-3">
          <label for="username" class="col-form-label">Username</label>
        </div>
        <div class="col-sm-6">
          <Input
            id="username"
            type="text"
            on:change={handleChange}
            on:blur={handleChange}
            bind:value={$form.username}
            error={$errors.username}
          />
        </div>
      </div>
      <div class="row mb-3 justify-content-center">
        <div class="col-sm-3">
          <label for="password" class="col-form-label">Password</label>
        </div>
        <div class="col-sm-6">
          <Input
            id="password"
            type="password"
            on:change={handleChange}
            on:blur={handleChange}
            bind:value={$form.password}
            error={$errors.password}
          />
        </div>
      </div>
      <div class="row justify-content-center">
        <div class="col-auto">
          <div class="form-check">
            <Input
              id="saving"
              role="button"
              type="checkbox"
              on:change={handleChange}
              on:blur={handleChange}
              bind:checked={$form.saving}
            />
            <label class="form-check-label" for="saving">
              Stay logged in on this computer
            </label>
          </div>
        </div>
      </div>
      <div class="row justify-content-evenly g-2">
        <div class="col-6 col-sm-3">
          <button class="btn btn-minor" type="button" on:click={cancelForm}
            >Cancel</button
          >
        </div>
        <div class="col-6 col-sm-3">
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
    margin: 0 0 1rem 0;
    font-weight: bold;
    font-size: 105%;
    text-align: center;
  }

  button {
    width: 100%;
    margin-top: 1rem;
  }

  .error-region {
    margin-top: 1rem;
  }
</style>
