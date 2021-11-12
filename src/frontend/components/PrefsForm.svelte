<script lang="ts">
  import { getContext } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import * as yup from 'yup';
  import { AppPrefs } from '../shared/app_prefs';
  import { createForm, Form, Input, InputGroup, SetInputValue } from '../layout/forms';
  import { AppPrefsClient } from '../clients/app_prefs_client';
  import { DialogClient } from '../clients/dialog_client';

  const dispatch = createEventDispatcher();
  let errorMessage = '';
  let setDataFolder: SetInputValue;

  const appPrefs = getContext<AppPrefs>('prefs');
  const context = createForm({
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
        console.log('called submit');
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
      await setDataFolder(folderPath);
    }
  }

  async function cancelForm() {}
</script>

<div class="dialog">
  <Form class="container-fluid g-0" style="max-width:40rem; margin: 0 auto" {context}>
    <div class="row mb-2">
      <div class="col-sm-3">
        <label for="databaseHost" class="col-form-label">Database host</label>
      </div>
      <div class="col-sm-9">
        <Input
          id="databaseHost"
          name="databaseHost"
          class="form-control"
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
          name="databasePortStr"
          class="form-control rw-sm-3"
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
          name="databaseName"
          class="form-control rw-sm-6"
          description="Name of the database at the above host and port"
        />
      </div>
    </div>
    <div class="row mb-4">
      <div class="col-sm-3">
        <label for="dataFolder" class="col-form-label">Data Folder</label>
      </div>
      <div class="col-sm-9">
        <InputGroup
          id="dataFolderGroup"
          description="Folder for saved application data"
        >
          <Input
            id="dataFolder"
            name="dataFolder"
            class="form-control"
            bind:setValue={setDataFolder}
          />
          <div class="input-group-btn">
            <button class="btn btn-secondary" type="button" on:click={chooseFolder}
              >Choose</button
            >
          </div>
        </InputGroup>
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
  </Form>
</div>

<style>
  button {
    width: 100%;
  }

  .error-region {
    margin-top: 1rem;
  }
</style>
