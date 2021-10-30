<script lang="ts">
  import router from 'page';
  import type { SvelteComponent } from 'svelte';

  import { User } from './lib/user';
  import { loggedInUser } from './stores/loggedInUser';
  import HeaderBar from './components/HeaderBar.svelte';
  import ActivitiesPage from './pages/ActivitiesPage.svelte';
  import FirstNamesPage from './pages/FirstNames.svelte';
  import StatusBar from './components/StatusBar.svelte';

  let page: typeof SvelteComponent;
  let params: any;

  $loggedInUser = User.getLoggedInUser();

  router('/', () => (page = ActivitiesPage));
  router('/first-names', () => (page = FirstNamesPage));
  router.start();
</script>

<HeaderBar appTitle="UT SpecTool" />

<div class="content">
  <svelte:component this={page} {params} />
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
