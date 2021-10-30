<script lang="ts">
  import { currentActivity } from '../stores/currentActivity';
  import type { Activity } from '../lib/activity';
  import FirstNames from '../activities/FirstNames.svelte';

  const activities: Activity[] = [
    {
      title: 'Query for first names',
      component: FirstNames,
      description: 'Returns all first names for a given last name.',
      preClose: async () => true
    }
  ];
</script>

<nav>
  {#each activities as activity}
    <div class="activity">
      <button on:click={() => ($currentActivity = activity)}>{activity.title}</button>
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
    margin: 2em;
  }

  button {
    font-style: bold;
  }

  .description {
    margin-top: 0.8em;
    margin-left: 1em;
    font-size: 90%;
  }
</style>
