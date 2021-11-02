<script lang="ts">
  import { User } from './lib/user';
  import { loggedInUser } from './stores/loggedInUser';
  import { screenStack } from './stores/screenStack';
  import HeaderBar from './components/HeaderBar.svelte';
  import ActivityBar from './components/ActivityBar.svelte';
  import ActivityMenu from './activities/ActivityMenu.svelte';
  import StatusBar from './components/StatusBar.svelte';

  $loggedInUser = User.getLoggedInUser();
  screenStack.push({
    title: 'Activities',
    componentType: ActivityMenu,
    params: {}
  });

  function currentScreen() {
    return $screenStack[$screenStack.length - 1];
  }
</script>

<HeaderBar appTitle="UT SpecTool" />

<div class="content">
  <ActivityBar />
  <svelte:component this={currentScreen().componentType} {...currentScreen().params} />
</div>

<StatusBar />

<style lang="scss">
  @import './values';

  :global {
    @import '../../node_modules/bootstrap/scss/bootstrap';

    body {
      box-sizing: content-box;
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0;
    }

    button.compact {
      padding: 0.1em 0.5em;
    }
  }

  .content {
    flex: auto;
    margin: 0 $horizontalMargin;
  }
</style>
