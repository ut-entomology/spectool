<script lang="ts">
  import router from 'page';
  import type { SvelteComponent } from 'svelte';
  import { Modals, openModal, closeModal } from 'svelte-modals';

  import LoginPage from './pages/Login.svelte';
  import FirstNamesPage from './pages/FirstNames.svelte';
  import Modal from './components/modal.svelte';
  import { loggedInUser } from './stores/loggedInUser';
  import { User } from './lib/user';

  let page: typeof SvelteComponent;
  let params: any;

  router('/', () => (page = FirstNamesPage));
  router('/login', () => (page = LoginPage));
  router.start();

  $loggedInUser = User.getLoggedInUser();

  function logout() {
    User.logout()
      .then(() => {
        $loggedInUser = null;
        openModal(Modal, { message: 'Logged out' });
      })
      .catch((err: Error) => {
        openModal(Modal, {
          message: `Failed to log out: ${err.message}`
        });
      });
  }
</script>

<nav>
  <a href="/">First Names</a>
  <a href="/login">Login</a>
  <a href={'#'} on:click={logout}>Logout</a>
</nav>

<svelte:component this={page} {params} />

<Modals>
  <div slot="backdrop" class="backdrop" on:click={closeModal} />
</Modals>

<style>
  .backdrop {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.5);
  }
</style>
