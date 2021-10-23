<script>
  import router from 'page';

  import LoginPage from './pages/Login.svelte';
  import FirstNamesPage from './pages/FirstNames.svelte';
  import { DatabaseClient } from './clients/database_client';
  import { Modals, openModal, closeModal } from 'svelte-modals';
  import Modal from './components/Modal.svelte';

  let page;
  let params;

  router('/', () => (page = FirstNamesPage));
  router('/login', () => (page = LoginPage));
  router.start();

  function logout() {
    DatabaseClient.logout(
      window,
      () => {
        openModal(Modal, { message: 'Logged out' });
      },
      (err) => {
        openModal(Modal, { message: 'Failed to log out' });
      }
    );
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
