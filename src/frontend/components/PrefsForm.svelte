<script lang="ts">
  import { getContext, setContext } from 'svelte';
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  import { AppPrefs } from '../shared/app_prefs';
  import Input from '../layout/Input.svelte';
  import { AppPrefsClient } from '../clients/app_prefs_client';

  let errorMessage = '';

  const initialPrefs = getContext<AppPrefs>('prefs');
  const { form, errors, handleChange, handleSubmit } = createForm({
    initialValues: {
      dataFolder: initialPrefs.dataFolder,
      databaseHost: initialPrefs.databaseHost,
      databasePortStr: initialPrefs.databasePort.toString(),
      databaseName: initialPrefs.databaseName
    },
    validationSchema: yup.object().shape({
      databaseHost: yup
        .string()
        .label('Database host')
        .trim()
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
        const prefs = new AppPrefs();
        prefs.dataFolder = formPrefs.dataFolder;
        prefs.databaseHost = formPrefs.databaseHost;
        prefs.databasePort = parseInt(formPrefs.databasePortStr);
        prefs.databaseName = formPrefs.databaseName;
        await AppPrefsClient.setPrefs(window, prefs);
        setContext('prefs', prefs);
      } catch (err: any) {
        errorMessage = err.message;
      }
    }
  });

  async function cancelForm() {}
</script>

<div class="dialog">
  <form class="container g-0" on:submit|preventDefault={handleSubmit}>
    <div class="row mb-2">
      <div class="col-sm-3">
        <label for="database-host" class="col-form-label">Database host</label>
      </div>
      <div class="col-sm-9">
        <Input
          id="database-host"
          class="form-control"
          type="text"
          on:change={handleChange}
          on:blur={handleChange}
          bind:value={$form.databaseHost}
          error={$errors.databaseHost}
          description="URL of database in the form <b>//databasename.domain.com</b>"
        />
      </div>
    </div>
    <div class="row mb-3 justify-content-start">
      <div class="col-sm-3">
        <label for="database-port-str" class="col-form-label">Database port</label>
      </div>
      <div class="col-sm-9">
        <Input
          id="database-port-str"
          class="form-control rw-sm-3"
          type="string"
          on:change={handleChange}
          on:blur={handleChange}
          bind:value={$form.databasePortStr}
          error={$errors.databasePortStr}
          description="Server port as specified by the admin (usually 3306)"
        />
      </div>
    </div>
    <div class="row mb-3 justify-content-start">
      <div class="col-sm-3">
        <label for="database-name" class="col-form-label">Database name</label>
      </div>
      <div class="col-sm-9">
        <Input
          id="database-name"
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
    <div class="row mb-3">
      <div class="col-sm-3">
        <label for="data-folder" class="col-form-label">Data Folder</label>
      </div>
      <div class="col-sm-9">
        <Input
          id="data-folder"
          class="form-control"
          type="text"
          on:change={handleChange}
          on:blur={handleChange}
          bind:value={$form.dataFolder}
          error={$errors.dataFolder}
          description="Folder for saved application data"
        />
      </div>
    </div>
    <div class="row justify-content-center">
      <div class="col-3">
        <button class="btn btn-minor" type="button" on:click={cancelForm}>Cancel</button
        >
      </div>
      <div class="col-1" />
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
    margin-top: 1rem;
  }

  .error-region {
    margin-top: 1rem;
  }
</style>
