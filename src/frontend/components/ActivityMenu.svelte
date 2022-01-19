<script lang="ts">
  import type { Activity } from '../lib/activity';
  import { openActivity } from './ActivityBar.svelte';
  import * as prereqs from '../lib/prereqs.svelte';

  const activities: Activity[] = [
    {
      title: 'Remove Unused Taxa',
      targetName: 'UnusedTaxaActivity',
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
      title: 'Consolidate Localities',
      targetName: 'LocalityConsolidationActivity',
      description: 'Find and merge different entries for the same localities.',
      requiresLogin: true,
      prerequisites: [
        prereqs.databaseConfigPrereq,
        prereqs.connectionPrereq,
        prereqs.dataFolderPrereq,
        prereqs.userLoginPrereq
      ]
    },
    {
      title: 'Query for First Names',
      targetName: 'FirstNamesActivity',
      description: 'Returns all first names for a given last name.',
      requiresLogin: false,
      prerequisites: [
        prereqs.databaseConfigPrereq,
        prereqs.connectionPrereq,
        prereqs.userLoginPrereq
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
