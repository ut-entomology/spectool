<script lang="ts" context="module">
  import WindowReport from '../../layout/WindowReport.svelte';
  import AgentReport from './AgentReport.svelte';
  import { openReport } from '../../layout/WindowReport.svelte';

  export const agentSimilaritiesSpec = {
    targetName: 'AgentSimilaritiesMain',
    params: {}
  };
</script>

<main>
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
  <WindowReport />
</main>

<style>
  main {
    margin: 5em 0;
    text-align: center;
  }
</style>
