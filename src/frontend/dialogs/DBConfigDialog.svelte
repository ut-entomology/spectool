<script lang="ts">
  import { getContext } from 'svelte';
  import * as yup from 'yup';

  import { Context } from '../lib/contexts';
  import { createForm, ContextForm, Input } from '../layout/forms';
  import type { DatabaseConfig } from '../../shared/shared_db_config';
  import { Connection } from '../../shared/shared_connection';
  import { currentConnection } from '../stores/currentConnection';
  import { currentDialog } from '../stores/currentDialog';
  import ModalDialog from '../layout/ModalDialog.svelte';

  export let onSuccess: () => void = () => {};
  let errorMessage = '';

  const databaseConfig = getContext<DatabaseConfig>(Context.DatabaseConfig);
  const context = createForm({
    initialValues: {
      databaseHost: databaseConfig.databaseHost,
      databasePortStr: databaseConfig.databasePort.toString(),
      databaseName: databaseConfig.databaseName
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
      databaseName: yup.string().label('Database name').trim().required()
    }),
    onSubmit: async (values) => {
      try {
        databaseConfig.copyFrom({
          databaseHost: values.databaseHost,
          databasePort: parseInt(values.databasePortStr),
          databaseName: values.databaseName
        });
        await window.apis.dbConfigApi.setConfig(databaseConfig);
        currentConnection.set(
          new Connection(databaseConfig.isReady(), values.databaseName)
        );
        closeForm();
        onSuccess();
      } catch (err: any) {
        errorMessage = err.message;
      }
    }
  });

  function closeForm() {
    currentDialog.set(null);
  }
</script>

<ModalDialog title="Configure the Database Connection">
  <ContextForm class="container-fluid g-0" {context}>
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
    <div class="row justify-content-end">
      <div class="col-3">
        <button class="btn btn-minor" type="button" on:click={closeForm}>Cancel</button>
      </div>
      <div class="col-3">
        <button class="btn btn-major" type="submit">Connect</button>
      </div>
    </div>
    {#if errorMessage}
      <div class="error-region">
        <div class="alert alert-danger" role="alert">{errorMessage}</div>
      </div>
    {/if}
  </ContextForm>
</ModalDialog>

<style>
  button {
    width: 100%;
  }

  .error-region {
    margin-top: 1rem;
  }
</style>
