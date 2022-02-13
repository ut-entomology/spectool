<script lang="ts" context="module">
  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import WindowReport from '../../layout/WindowReport.svelte';
  import AgentReport from './AgentReport.svelte';
  import { openReport } from '../../layout/WindowReport.svelte';

  export const agentSimilaritiesSpec = {
    targetName: 'AgentSimilaritiesMain',
    params: {}
  };
</script>

<main>
  <ActivityInstructions>
    Click the button to generate or re-generate a report of similarities among agent
    names in Specify.
  </ActivityInstructions>
  <div class="button">
    <button
      class="btn btn-major"
      on:click={() =>
        openReport(AgentReport, {
          includeCsvAgents: false,
          includeSpecifyAgents: true
        })}
    >
      Generate report
    </button>
  </div>
  <WindowReport />
</main>

<style>
  .button {
    margin: 5em 0;
    text-align: center;
  }
</style>
