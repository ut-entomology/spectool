<script lang="ts" context="module">
  export const csvValidationSpec = {
    targetName: 'CsvValidationMain',
    params: {}
  };
</script>

<script lang="ts">
  import { SvelteComponent, onDestroy } from 'svelte';

  import { InputGroup } from '../../layout/forms';
  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import WindowReport from '../../layout/WindowReport.svelte';
  import AgentReport from '../agent_similarities/AgentReport.svelte';
  import { currentDirectory } from '../../stores/currentDirectory';
  import { flashMessage } from '../../layout/VariableFlash.svelte';
  import { openReport } from '../../layout/WindowReport.svelte';

  const DIRECTORY_REGEX = /^(.*)[\/\\]/;

  let csvFile = '';

  async function chooseFile() {
    csvFile =
      (await window.apis.dialogApi.openFileDialog('Choose the CSV file', ['csv'])) ||
      '';
  }

  function openCsvReport(component: typeof SvelteComponent, params: any) {
    if (csvFile.trim() == '') {
      flashMessage('Please select a CSV file', 'warning');
    } else {
      const match = csvFile.match(DIRECTORY_REGEX);
      currentDirectory.set(match ? match[1] : '');
      openReport(component, params);
    }
  }

  onDestroy(() => window.apis.specimenSetApi.closeSpecimenSet());
</script>

<main>
  <ActivityInstructions>
    Select the CSV file that you would like to validate prior to uploading to Specify.
  </ActivityInstructions>
  <div class="container-md mt-2 mb-2 justify-content-center">
    <div class="row mb-2 justify-content-center">
      <div class="col-auto">
        <label for="csvFileInput" class="col-form-label">CSV File</label>
      </div>
      <div class="col">
        <InputGroup id="csvFilerGroup">
          <input id="csvFileInput" class="form-control" bind:value={csvFile} />
          <div class="input-group-btn">
            <button class="btn btn-secondary" type="button" on:click={chooseFile}
              >{csvFile == '' ? 'Choose' : 'Change'}</button
            >
          </div>
        </InputGroup>
      </div>
    </div>
    <div class="csv_reports">
      <div class="title">Available Reports</div>
      <div class="container-md">
        <div class="row mb-2">
          <div class="col-3 group_header">Agent Reports</div>
          <div class="col-9">
            <button
              class="btn btn-minor"
              on:click={() =>
                openCsvReport(AgentReport, {
                  csvFile,
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
                openCsvReport(AgentReport, {
                  csvFile,
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
                openCsvReport(AgentReport, {
                  csvFile,
                  includeSpecifyAgents: false
                })}
            >
              Check CSV agent names against one another
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <WindowReport />
</main>

<style>
  .title {
    font-size: 1.3em;
    text-align: center;
    margin: 2em 0 1em 0;
  }
  .group_header {
    font-weight: bold;
  }
</style>
