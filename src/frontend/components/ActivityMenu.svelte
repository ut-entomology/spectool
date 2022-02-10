<script lang="ts">
  import type { Activity } from '../lib/activity';
  import { openActivity } from './ActivityBar.svelte';
  import * as prereqs from '../lib/prereqs.svelte';
  import { agentSimilaritiesSpec } from '../activities/agent_similarities/AgentSimilaritiesMain.svelte';
  import { csvValidationSpec } from '../activities/csv_validation/CsvValidationMain.svelte';
  import { unusedTaxaSpec } from '../activities/unused_taxa/UnusedTaxaMain.svelte';
  import { localityConsolidationSpec } from '../activities/locality_consolidation/LocalityConsolidationMain.svelte';

  const activities: Activity[] = [
    {
      title: 'Report Agent Name Similarities',
      screenSpec: agentSimilaritiesSpec,
      description: 'Check Specify agent names for similarity with one another.',
      requiresLogin: true,
      prerequisites: [
        prereqs.databaseConfigPrereq,
        prereqs.connectionPrereq,
        prereqs.userLoginPrereq
      ]
    },
    {
      title: 'Validate Specimen CSV',
      screenSpec: csvValidationSpec,
      description:
        'Validate a CSV of specimen records intended for uploading to Specify.',
      requiresLogin: true,
      prerequisites: [
        prereqs.databaseConfigPrereq,
        prereqs.connectionPrereq,
        prereqs.dataFolderPrereq, // provides CSV header equivalences
        prereqs.userLoginPrereq
      ]
    },
    {
      title: 'Consolidate Localities',
      screenSpec: localityConsolidationSpec,
      description: 'Find and merge different entries for the same localities.',
      requiresLogin: true,
      prerequisites: [
        prereqs.databaseConfigPrereq,
        prereqs.connectionPrereq,
        prereqs.dataFolderPrereq, // stores knowledge and caches intermediate data
        prereqs.userLoginPrereq,
        prereqs.managerPrereq
      ]
    },
    {
      title: 'Purge Unused Taxa',
      screenSpec: unusedTaxaSpec,
      description:
        'Selectively remove unused taxa created within a particular range of dates.',
      requiresLogin: true,
      prerequisites: [
        prereqs.databaseConfigPrereq,
        prereqs.connectionPrereq,
        prereqs.userLoginPrereq,
        prereqs.managerPrereq
      ]
    }
  ];
</script>

<nav>
  {#each activities as activity}
    <div class="activity">
      <button class="btn btn-minor" on:click={() => openActivity(activity)}>
        {activity.title}
      </button>
      <div class="description">{activity.description}</div>
    </div>
  {/each}
</nav>

<style>
  nav {
    display: flex;
    flex-flow: column wrap;
  }

  .activity {
    width: 350px;
    margin: 2rem 0 0 2rem;
  }

  .description {
    margin-top: 0.5rem;
    margin-left: 1rem;
    font-size: 90%;
  }
</style>
