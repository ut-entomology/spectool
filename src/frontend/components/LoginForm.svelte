<script lang="ts">
  /*
    Displays the modal dialog using Sveltestrap. Cannot user Bootstrap's modal
    JavaScript with svelte-forms-lib because the latter assumes that the form
    is constructed for each viewing, whereas the former only constructs the
    modal once and hides and displays it. The problem was that initial values
    were only ever used on the first opening of the modal form.
  */

  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  import { Modal } from 'sveltestrap';
  import Input from '../layout/Input.svelte';
  import Form from '../layout/Form.svelte';

  export let isOpen: boolean;
  export let toggle: () => void;
  export let title = '';
  export let login: (
    username: string,
    password: string,
    save: boolean
  ) => Promise<void>;

  let errorMessage = '';

  const context = createForm({
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
        await login(values.username, values.password, values.saving);
      } catch (err) {
        errorMessage = (err as Error).message;
      }
    }
  });
</script>

<Modal {isOpen} contentClassName="login-form-content">
  <div class="dialog">
    <Form class="container g-0" {context}>
      <div class="row">
        <h2 class="col">{title}</h2>
      </div>
      <div class="row mb-2 justify-content-center">
        <div class="col-sm-3">
          <label for="username" class="col-form-label">Username</label>
        </div>
        <div class="col-sm-6">
          <Input id="username" type="text" />
        </div>
      </div>
      <div class="row mb-3 justify-content-center">
        <div class="col-sm-3">
          <label for="password" class="col-form-label">Password</label>
        </div>
        <div class="col-sm-6">
          <Input id="password" type="password" />
        </div>
      </div>
      <div class="row justify-content-center">
        <div class="col-auto">
          <div class="form-check">
            <Input id="saving" role="button" type="checkbox" />
            <label class="form-check-label" for="saving">
              Stay logged in on this computer
            </label>
          </div>
        </div>
      </div>
      <div class="row justify-content-evenly g-2">
        <div class="col-6 col-sm-3">
          <button class="btn btn-minor" type="button" on:click={toggle}>Cancel</button>
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
    </Form>
  </div>
</Modal>

<style>
  :global(.login-form-content) {
    margin: 0 auto;
    max-width: 24rem;
  }

  h2 {
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
