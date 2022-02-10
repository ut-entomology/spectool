<script lang="ts" context="module">
  import { openReport } from '../../lib/reports';
  import AgentReport from './AgentReport.svelte';

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
        includeSpecifyAgents: false
      })}
  >
    Open/refresh report of Specify agent names
  </button>
</main>

<style>
  main {
    margin: 5em 0;
    text-align: center;
  }
</style>
