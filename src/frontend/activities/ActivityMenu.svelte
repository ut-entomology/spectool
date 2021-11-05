<script lang="ts">
  import 'bootstrap';
  import { screenStack } from '../stores/screenStack';
  import type { Activity } from '../lib/activity';
  import FirstNames from '../activities/FirstNames.svelte';

  const activities: Activity[] = [
    {
      title: 'Query for first names',
      componentType: FirstNames,
      description: 'Returns all first names for a given last name.'
    }
  ];

  function openActivity(activity: Activity) {
    screenStack.push({
      title: activity.title,
      componentType: activity.componentType,
      params: []
    });
  }
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
    margin: 2em;
  }

  .description {
    margin-top: 0.5em;
    margin-left: 1em;
    font-size: 90%;
  }
</style>
