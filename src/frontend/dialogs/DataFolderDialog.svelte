<script lang="ts">
  import * as yup from 'yup';

  import { createForm, Form, Input, InputGroup, SetInputValue } from '../layout/forms';
  import { AppPrefs } from '../shared/app_prefs';
  import { AppPrefsClient } from '../clients/app_prefs_client';
  import { DirDialogClient } from '../clients/dir_dialog_client';
  import { currentPrefs } from '../stores/currentPrefs';
  import { currentDialog } from '../stores/currentDialog';
  import Dialog from '../layout/Dialog.svelte';

  export let onSuccess: () => void = () => {};

  let errorMessage = '';
  let setDataFolder: SetInputValue;

  const context = createForm({
    initialValues: {
      dataFolder: $currentPrefs.dataFolder
    },
    validationSchema: yup.object().shape({
      dataFolder: yup.string().label('Data folder').trim().required()
    }),
    onSubmit: async (values) => {
      try {
        const prefs = new AppPrefs();
        prefs.dataFolder = values.dataFolder;
        await AppPrefsClient.setPrefs(prefs);
        $currentPrefs = prefs;
        cancelForm();
        onSuccess();
      } catch (err: any) {
        errorMessage = err.message;
      }
    }
  });

  async function chooseFolder() {
    const folderPath = DirDialogClient.openDirectoryDialog('Choose the data folder');
    if (folderPath) {
      await setDataFolder(folderPath);
    }
  }

  function cancelForm() {
    $currentDialog = null;
  }
</script>

<Dialog title="Set Data Folder" size="md">
  <Form class="container-fluid g-0" {context}>
    <div class="row mb-4 justify-content-center">
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
      {#if $currentPrefs.dataFolder}
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
</Dialog>

<style lang="scss">
  button {
    width: 100%;
  }

  .error-region {
    margin-top: 1rem;
  }
</style>
