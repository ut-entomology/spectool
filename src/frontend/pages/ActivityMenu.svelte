<script lang="ts">
  import { activities } from '../lib/activities';
  import { currentActivity } from '../stores/currentActivity';
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
