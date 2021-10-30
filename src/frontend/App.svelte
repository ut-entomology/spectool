<script lang="ts">
  import { User } from './lib/user';
  import { loggedInUser } from './stores/loggedInUser';
  import { currentActivity } from './stores/currentActivity';
  import HeaderBar from './components/HeaderBar.svelte';
  import ActivityBar from './components/ActivityBar.svelte';
  import ActivityMenu from './activities/ActivityMenu.svelte';
  import StatusBar from './components/StatusBar.svelte';

  $loggedInUser = User.getLoggedInUser();
</script>

<HeaderBar appTitle="UT SpecTool" />

<div class="content">
  {#if $currentActivity}
    <ActivityBar title={$currentActivity.title} preClose={$currentActivity.preClose} />
    <svelte:component this={$currentActivity.component} />
  {:else}
    <ActivityBar title="Activities" />
    <ActivityMenu />
  {/if}
</div>

<StatusBar />

<style lang="scss">
  @import './global.scss';

  :global(body) {
    margin: 0;
    padding: 0;
    display: flex;
    flex-flow: column nowrap;
  }

  :global(button) {
    background-color: rgba(255, 215, 140, 0.938);
    color: black;
    border: none;
    border-radius: 5px;
    padding: 0.3em 0.5em;
    border: 1px solid rgba(255, 215, 140, 0.938);
  }

  :global(button.primary) {
    background-color: rgba(255, 191, 72, 0.938);
  }

  :global(button.inconspicuous) {
    background-color: #ccc;
    padding: 0.1em 0.5em;
  }

  :global(button:hover) {
    border: 1px solid #999;
    cursor: pointer;
  }

  :global(.content) {
    flex: auto;
    margin: 0 $horizontalMargin;
  }
</style>
