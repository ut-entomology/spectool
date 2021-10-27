<script lang="ts">
  import router from 'page';
  import type { SvelteComponent } from 'svelte';

  import { User } from './lib/user';
  import { loggedInUser } from './stores/loggedInUser';
  import HeaderBar from './components/HeaderBar.svelte';
  import MainMenuPage from './pages/MainMenuPage.svelte';
  import FirstNamesPage from './pages/FirstNames.svelte';

  let page: typeof SvelteComponent;
  let params: any;

  $loggedInUser = User.getLoggedInUser();

  router('/', () => (page = MainMenuPage));
  router('/first-names', () => (page = FirstNamesPage));
  router.start();
</script>

<HeaderBar appTitle="UT SpecTool" />

<svelte:component this={page} {params} />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: rgb(255, 202, 132);
  }
</style>
