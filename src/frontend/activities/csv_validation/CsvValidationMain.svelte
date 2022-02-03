<script lang="ts" context="module">
  export const csvValidationSpec = {
    targetName: 'CsvValidationMain',
    params: {}
  };
</script>

<script lang="ts">
  import { SvelteComponent, onDestroy } from 'svelte';
  import * as yup from 'yup';
  import { openWindow } from 'svelte-window-system';

  import {
    createForm,
    ContextForm,
    Input,
    InputGroup,
    SetInputValue
  } from '../../layout/forms';
  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import Notice from '../../layout/Notice.svelte';
  import AgentReport from './AgentReport.svelte';
  import { closeActivity } from '../../components/ActivityBar.svelte';
  import { currentDirectory } from '../../stores/currentDirectory';

  const DEFAULT_REPORT_WIDTH = 1024;
  const DEFAULT_REPORT_HEIGHT = 900;

  const DIRECTORY_REGEX = /^(.*)[\/\\]/;

  export let csvFile: string | null = null;

  interface ReportDef {
    title: string;
    component: typeof SvelteComponent;
  }
  const reports: ReportDef[] = [
    { title: 'Collectors and Determiners Report', component: AgentReport }
  ];

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
        csvFile = values.csvFile;
        const match = csvFile.match(DIRECTORY_REGEX);
        currentDirectory.set(match ? match[1] : '');
        await window.apis.specimenSetApi.openSpecimenSet(headerJsonFile, csvFile);
        loadedCsvFile = csvFile;
      } catch (err: any) {
        errorMessage = err.message;
      }
    }
  });

  async function prepare() {
    headerJsonFile = await window.apis.specimenSetApi.getHeaderJSONPath();
  }

  async function chooseFile() {
    csvFile = await window.apis.dialogApi.openFileDialog('Choose the CSV file', [
      'csv'
    ]);
    if (csvFile) {
      await setCsvFile(csvFile);
    }
  }

  function openReport(report: ReportDef) {
    openWindow(report.component, {
      width: DEFAULT_REPORT_WIDTH,
      height: DEFAULT_REPORT_HEIGHT
    });
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
                >{csvFile ? 'Change' : 'Choose'}</button
              >
            </div>
          </InputGroup>
        </div>
      </div>
      <div class="row justify-content-end">
        <div class="col-3">
          <button class="btn btn-major" type="submit"
            >{csvFile !== null && csvFile == loadedCsvFile ? 'Reload' : 'Load'}</button
          >
        </div>
      </div>
      {#if errorMessage}
        <div class="error-region">
          <div class="alert alert-danger" role="alert">{errorMessage}</div>
        </div>
      {/if}
      {#if loadedCsvFile !== null}
        {#each reports as report}
          <button class="btn btn-minor" on:click={() => openReport(report)}>
            Open {report.title}
          </button>
        {/each}
      {/if}
    </ContextForm>
  </main>
{:catch err}
  <Notice
    header="Error"
    alert="danger"
    message="Failed to load 'csv-headers.json': {err.message}"
    on:close={closeActivity}
  />
{/await}
