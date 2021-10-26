<script lang="ts">
  import router from 'page';
  import type { SvelteComponent } from 'svelte';

  import { User } from './lib/user';
  import { loggedInUser } from './stores/loggedInUser';
  import HeaderBar from './components/HeaderBar.svelte';
  import FirstNamesPage from './pages/FirstNames.svelte';

  let page: typeof SvelteComponent;
  let params: any;

  $loggedInUser = User.getLoggedInUser();

  router('/', () => (page = FirstNamesPage));
  router.start();
</script>

<HeaderBar appTitle="UT SpecTool" />
<nav>
  <a href="/">First Names</a>
</nav>

<svelte:component this={page} {params} />
