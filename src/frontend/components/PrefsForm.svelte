<script lang="ts">
  import { getContext, tick } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  import { AppPrefs } from '../shared/app_prefs';
  import Input from '../layout/Input.svelte';
  import { AppPrefsClient } from '../clients/app_prefs_client';
  import { DialogClient } from '../clients/dialog_client';

  const dispatch = createEventDispatcher();
  let errorMessage = '';

  const appPrefs = getContext<AppPrefs>('prefs');
  const { form, errors, handleChange, handleSubmit } = createForm({
    initialValues: {
      dataFolder: appPrefs.dataFolder,
      databaseHost: appPrefs.databaseHost,
      databasePortStr: appPrefs.databasePort.toString(),
      databaseName: appPrefs.databaseName
    },
    validationSchema: yup.object().shape({
      databaseHost: yup
        .string()
        .label('Database host')
        .trim()
        .transform((value, _) => {
          // This transformation does not affect the input value,
          // but is necessary to satisfy the YUP URL schema.
          return value.startsWith('//') ? value : '//' + value;
        })
        .url()
        .required()
        .test(
          'is-host',
          'Invalid host name',
          (hostName) => !!hostName && !hostName.includes('?') && !hostName.includes('#')
        ),
      databasePortStr: yup
        .number()
        .label('Database port')
        .required()
        .positive()
        .integer(),
      databaseName: yup.string().label('Database name').trim().required(),
      dataFolder: yup.string().label('Data folder').trim().required()
    }),
    onSubmit: async (formPrefs) => {
      try {
        const newPrefs = new AppPrefs();
        newPrefs.dataFolder = formPrefs.dataFolder;
        newPrefs.databaseHost = formPrefs.databaseHost;
        newPrefs.databasePort = parseInt(formPrefs.databasePortStr);
        newPrefs.databaseName = formPrefs.databaseName;
        await AppPrefsClient.setPrefs(window, newPrefs);
        appPrefs.copyFrom(newPrefs);
        dispatch('submit');
      } catch (err: any) {
        errorMessage = err.message;
      }
    }
  });

  async function chooseFolder() {
    const folderPath = DialogClient.openDirectoryDialog(
      window,
      'Choose the data folder'
    );
    if (folderPath) {
      $form.dataFolder = folderPath;
      // Force re-validation
      await tick();
      document.getElementById('dataFolder')!.dispatchEvent(new Event('change'));
    }
  }

  async function cancelForm() {}
</script>

<div class="dialog">
  <form
    class="container-fluid g-0"
    style="max-width:40rem; margin: 0 auto"
    on:submit|preventDefault={handleSubmit}
  >
    <div class="row mb-2">
      <div class="col-sm-3">
        <label for="databaseHost" class="col-form-label">Database host</label>
      </div>
      <div class="col-sm-9">
        <Input
          id="databaseHost"
          class="form-control"
          type="text"
          on:change={handleChange}
          on:blur={handleChange}
          bind:value={$form.databaseHost}
          error={$errors.databaseHost}
          description="URL of database (e.g. <b>subdomain.domain.com</b>)"
        />
      </div>
    </div>
    <div class="row mb-3 justify-content-start">
      <div class="col-sm-3">
        <label for="databasePortStr" class="col-form-label">Database port</label>
      </div>
      <div class="col-sm-9">
        <Input
          id="databasePortStr"
          class="form-control rw-sm-3"
          type="string"
          on:change={handleChange}
          on:blur={handleChange}
          bind:value={$form.databasePortStr}
          error={$errors.databasePortStr}
          description="Server port (usually 3306)"
        />
      </div>
    </div>
    <div class="row mb-3 justify-content-start">
      <div class="col-sm-3">
        <label for="databaseName" class="col-form-label">Database name</label>
      </div>
      <div class="col-sm-9">
        <Input
          id="databaseName"
          class="form-control rw-sm-6"
          type="text"
          on:change={handleChange}
          on:blur={handleChange}
          bind:value={$form.databaseName}
          error={$errors.databaseName}
          description="Name of the database at the above host and port"
        />
      </div>
    </div>
    <div class="row mb-4">
      <div class="col-sm-3">
        <label for="dataFolder" class="col-form-label">Data Folder</label>
      </div>
      <div class="col-sm-9">
        <div class={$errors.dataFolder ? 'input-group is-invalid' : 'input-group'}>
          <Input
            id="dataFolder"
            class="form-control"
            type="text"
            on:change={handleChange}
            on:blur={handleChange}
            bind:value={$form.dataFolder}
            aria-describedby="dataFolder-form-text"
          />
          <div class="input-group-btn">
            <button class="btn btn-secondary" type="button" on:click={chooseFolder}
              >Choose</button
            >
          </div>
        </div>
        <div class="invalid-feedback">{$errors.dataFolder}</div>
        <div id="dataFolder-form-text" class="form-text">
          Folder for saved application data
        </div>
      </div>
    </div>
    <div class="row justify-content-end">
      {#if appPrefs.dataFolder}
        <div class="col-3">
          <button class="btn btn-minor" type="button" on:click={cancelForm}
            >Cancel</button
          >
        </div>
      {/if}
      <div class="col-3">
        <button class="btn btn-major" type="submit">Submit</button>
      </div>
    </div>
    {#if errorMessage}
      <div class="error-region">
        <div class="alert alert-danger" role="alert">{errorMessage}</div>
      </div>
    {/if}
  </form>
</div>

<style>
  button {
    width: 100%;
  }

  .error-region {
    margin-top: 1rem;
  }
</style>
