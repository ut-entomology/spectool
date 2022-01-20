<script lang="ts">
  import type { Activity } from '../lib/activity';
  import { openActivity } from './ActivityBar.svelte';
  import * as prereqs from '../lib/prereqs.svelte';
  import { unusedTaxaScreenSpec } from '../activities/unused_taxa/UnusedTaxaMain.svelte';
  import { localityConsolidationScreenSpec } from '../activities/locality_consolidation/LocalityConsolidationMain.svelte';

  const activities: Activity[] = [
    {
      screenSpec: unusedTaxaScreenSpec,
      description:
        'Selectively remove unused taxa created within a particular range of dates.',
      requiresLogin: true,
      prerequisites: [
        prereqs.databaseConfigPrereq,
        prereqs.connectionPrereq,
        prereqs.userLoginPrereq
      ]
    },
    {
      screenSpec: localityConsolidationScreenSpec,
      description: 'Find and merge different entries for the same localities.',
      requiresLogin: true,
      prerequisites: [
        prereqs.databaseConfigPrereq,
        prereqs.connectionPrereq,
        prereqs.dataFolderPrereq,
        prereqs.userLoginPrereq
      ]
    }
  ];
</script>

<nav>
  {#each activities as activity}
    <div class="activity">
      <button class="btn btn-minor" on:click={() => openActivity(activity)}>
        {activity.screenSpec.title}
      </button>
      <div class="description">{activity.description}</div>
    </div>
  {/each}
</nav>

<style>
  nav {
    display: flex;
    flex-flow: column wrap;
    justify-items: center;
    align-items: center;
  }

  .activity {
    width: 350px;
    margin: 2rem;
  }

  .description {
    margin-top: 0.5rem;
    margin-left: 1rem;
    font-size: 90%;
  }
</style>
