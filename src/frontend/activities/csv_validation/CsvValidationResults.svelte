<script lang="ts" context="module">
  export const csvValidationResultsSpec = {
    targetName: 'CsvValidationResults',
    params: {} as {
      headerJsonFile: string;
      csvFile: string;
    }
  };
</script>

<script lang="ts">
  import { onDestroy } from 'svelte';

  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import AgentValidationReport from './AgentValidationReport.svelte';
  import Notice from '../../layout/Notice.svelte';
  import { closeActivity } from '../../components/ActivityBar.svelte';

  export let headerJsonFile: string;
  export let csvFile: string;

  enum ReportType {
    None,
    Agents
  }

  const reports = [
    { type: ReportType.Agents, name: 'Collectors and Determiners Report' }
  ];

  let reportType: ReportType = ReportType.None;

  async function prepare() {
    await window.apis.specimenSetApi.openSpecimenSet(headerJsonFile, csvFile);
  }

  onDestroy(() => window.apis.specimenSetApi.closeSpecimenSet());
</script>

{#await prepare() then}
  <main>
    <ActivityInstructions>
      Use the drop-down list to select among the available validation reports.
    </ActivityInstructions>
    <div class="report_selector">
      <select id="report" name="report" bind:value={reportType}>
        <option disabled selected value={ReportType.None}>Select a report</option>
        {#each reports as report}
          <option value={report.type}>{report.name}</option>
        {/each}
      </select>
    </div>
    <div class="scroll_pane">
      {#if reportType == ReportType.None}
        Please select a report.
      {:else if reportType == ReportType.Agents}
        <AgentValidationReport />
      {/if}
    </div>
  </main>
{:catch err}
  <Notice
    header="Error"
    alert="danger"
    message="Failed to load CSV file: {err.message}"
    on:close={closeActivity}
  />
{/await}

<style>
  main {
    flex: auto;
    display: flex;
    flex-direction: column;
  }
  .report_selector {
    text-align: right;
    margin: 0 1.5rem 0.5rem 0;
  }
</style>
