<script lang="ts" context="module">
  import type { Activity } from '../lib/activity';
  import * as prereqs from '../lib/prereqs.svelte';
  import { currentUser } from '../stores/currentUser';
  import { screenStack } from '../stores/screenStack';
  import { currentActivity } from '../stores/currentActivity';

  export function openActivity(activity: Activity) {
    prereqs.satisfyAll(activity.prerequisites, () => {
      screenStack.push({
        title: activity.title,
        target: activity.target,
        params: []
      });
      currentActivity.set(activity);
    });
  }

  export function closeActivity() {
    screenStack.reset();
  }
</script>

<script lang="ts">
  $: if ($currentUser === null && $currentActivity && $currentActivity.requiresLogin) {
    closeActivity();
  }
</script>

<div class="activity_bar">
  {#if $screenStack.length == 1}
    <div class="title">{$screenStack[0].title}</div>
  {:else}
    <div class="title">{$screenStack[1].title}</div>
    <button class="btn btn-minor compact" on:click={closeActivity}>Close</button>
  {/if}
</div>

<style>
  .activity_bar {
    display: flex;
    font-size: 110%;
    margin: 0.4rem 0;
  }

  .activity_bar div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-right: 0.5rem;
  }
</style>
