<script lang="ts" context="module">
  import type { User } from '../lib/user';
  import type { Activity } from '../lib/activity';
  import { loggedInUser } from '../stores/loggedInUser';
  import { screenStack } from '../stores/screenStack';
  import { currentActivity } from '../stores/currentActivity';
  import { showNotice } from '../layout/DynamicNotice.svelte';

  let currentUser: User | null = null;
  loggedInUser.subscribe((user) => {
    currentUser = user;
  });

  export function openActivity(activity: Activity) {
    if (!activity.requiresLogin || currentUser !== null) {
      screenStack.push({
        title: activity.title,
        componentType: activity.componentType,
        params: []
      });
      currentActivity.set(activity);
    } else {
      showNotice('Please login before using this activity.', 'NOTICE', 'warning');
    }
  }

  export function closeActivity() {
    screenStack.reset();
  }
</script>

<script lang="ts">
  $: if ($loggedInUser === null && $currentActivity && $currentActivity.requiresLogin) {
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
