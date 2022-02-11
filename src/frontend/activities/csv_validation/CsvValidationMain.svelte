<script lang="ts" context="module">
  export const csvValidationSpec = {
    targetName: 'CsvValidationMain',
    params: {}
  };
</script>

<script lang="ts">
  import { onDestroy } from 'svelte';
  import * as yup from 'yup';

  import { openReport } from '../../lib/reports';
  import {
    createForm,
    ContextForm,
    Input,
    InputGroup,
    SetInputValue
  } from '../../layout/forms';
  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import Notice from '../../layout/Notice.svelte';
  import StatusMessage from '../../layout/StatusMessage.svelte';
  import AgentReport from '../agent_similarities/AgentReport.svelte';
  import { closeActivity } from '../../components/ActivityBar.svelte';
  import { currentDirectory } from '../../stores/currentDirectory';
  import { showStatus } from '../../layout/StatusMessage.svelte';

  const DIRECTORY_REGEX = /^(.*)[\/\\]/;

  export let chosenCsvFile: string | null = null;

  let headerJsonFile: string;
  let loadedCsvFile: string | null = null;
  let setCsvFile: SetInputValue;
  let errorMessage = '';

  const context = createForm({
    initialValues: {
      csvFile: $currentDirectory
    },
    validationSchema: yup.object().shape({
      csvFile: yup.string().label('CSV file').trim().required()
    }),
    onSubmit: async (values) => {
      try {
        chosenCsvFile = values.csvFile;
        const match = chosenCsvFile.match(DIRECTORY_REGEX);
        currentDirectory.set(match ? match[1] : '');
        showStatus('Loading CSV file...');
        await window.apis.specimenSetApi.openSpecimenSet(headerJsonFile, chosenCsvFile);
        showStatus(null);
        loadedCsvFile = chosenCsvFile;
      } catch (err: any) {
        errorMessage = err.message;
      }
    }
  });

  async function prepare() {
    headerJsonFile = await window.apis.specimenSetApi.getHeaderJSONPath();
  }

  async function chooseFile() {
    chosenCsvFile = await window.apis.dialogApi.openFileDialog('Choose the CSV file', [
      'csv'
    ]);
    if (chosenCsvFile) {
      await setCsvFile(chosenCsvFile);
    }
  }

  onDestroy(() => window.apis.specimenSetApi.closeSpecimenSet());
</script>

{#await prepare() then}
  <main>
    <ActivityInstructions>
      Select the CSV file that you would like to validate prior to uploading to Specify.
    </ActivityInstructions>
    <ContextForm class="container-md mt-2 mb-2 justify-content-center" {context}>
      <div class="row mb-2 justify-content-center">
        <div class="col-auto">
          <label for="csvFile" class="col-form-label">CSV File</label>
        </div>
        <div class="col">
          <InputGroup id="csvFilerGroup">
            <Input
              id="csvFile"
              name="csvFile"
              class="form-control"
              bind:setValue={setCsvFile}
            />
            <div class="input-group-btn">
              <button class="btn btn-secondary" type="button" on:click={chooseFile}
                >{chosenCsvFile ? 'Change' : 'Choose'}</button
              >
            </div>
          </InputGroup>
        </div>
      </div>
      <div class="row justify-content-end">
        <div class="col-3">
          <button class="btn btn-major" type="submit"
            >{chosenCsvFile !== null && chosenCsvFile == loadedCsvFile
              ? 'Reload'
              : 'Load'}</button
          >
        </div>
      </div>
      {#if errorMessage}
        <div class="error-region">
          <div class="alert alert-danger" role="alert">{errorMessage}</div>
        </div>
      {/if}
      {#if chosenCsvFile == loadedCsvFile}
        <div class="csv_reports">
          <div class="title">Available Reports</div>
          <div class="container-md">
            <div class="row mb-2">
              <div class="col-3 group_header">Agent Reports</div>
              <div class="col-9">
                <button
                  class="btn btn-minor"
                  on:click={() =>
                    openReport(AgentReport, {
                      includeCsvAgents: true,
                      includeSpecifyAgents: true,
                      trustSpecifyAgents: true
                    })}
                >
                  Check CSV agent names against trusted Specify agent names
                </button>
              </div>
            </div>
            <div class="row mb-2">
              <div class="col-3" />
              <div class="col-9">
                <button
                  class="btn btn-minor"
                  on:click={() =>
                    openReport(AgentReport, {
                      includeCsvAgents: true,
                      includeSpecifyAgents: true,
                      trustSpecifyAgents: false
                    })}
                >
                  Check Specify agent names against trusted CSV agent names
                </button>
              </div>
            </div>
            <div class="row mb-2">
              <div class="col-3" />
              <div class="col-9">
                <button
                  class="btn btn-minor"
                  on:click={() =>
                    openReport(AgentReport, {
                      includeCsvAgents: true,
                      includeSpecifyAgents: false
                    })}
                >
                  Check CSV agent names against one another
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </ContextForm>
    <StatusMessage />
  </main>
{:catch err}
  <Notice
    header="Error"
    alert="danger"
    message="Failed to load 'csv-headers.json': {err.message}"
    on:close={closeActivity}
  />
{/await}

<style>
  .title {
    font-size: 1.3em;
    text-align: center;
    margin: 2em 0;
  }
  .group_header {
    font-weight: bold;
  }
</style>
