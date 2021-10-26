<script lang="ts">
  import { Modals, openModal, closeModal } from 'svelte-modals';
  import LoginForm from './LoginForm.svelte';
  import ModalMessage from './ModalMessage.svelte';

  import { loggedInUser } from '../stores/loggedInUser';
  import { User } from '../lib/user';

  export let appTitle = 'untitled';

  async function login(username: string, password: string, save: boolean) {
    await User.login(username, password, save);
    $loggedInUser = new User(username, save);
    openModal(ModalMessage, { message: 'You are now logged in.' });
  }

  function logout() {
    User.logout()
      .then(() => {
        $loggedInUser = null;
        openModal(ModalMessage, { message: 'Logged out' });
      })
      .catch((err: Error) => {
        openModal(ModalMessage, {
          message: `Failed to log out: ${err.message}`
        });
      });
  }

  function openLoginForm() {
    openModal(LoginForm, { login });
  }
</script>

<div class="header_bar">
  <div class="app_title">{appTitle}</div>
  {#if $loggedInUser === null}
    not logged in
  {:else}
    <div class="logged_in_user">
      {$loggedInUser.username}
      {#if $loggedInUser.saved}
        <span>(saved login)</span>
      {/if}
    </div>
  {/if}
  <div class="login_logout">
    {#if $loggedInUser === null}
      <a href={'#'} on:click={openLoginForm}>Login</a>
    {:else}
      <a href={'#'} on:click={logout}>Logout</a>
    {/if}
  </div>
</div>

<Modals>
  <div slot="backdrop" class="backdrop" on:click={closeModal} />
</Modals>

<style>
  .header_bar {
    display: flex;
    margin: 8px 0;
  }

  .header_bar div {
    flex: 1;
  }

  .logged_in_user span {
    font-style: italic;
  }

  .login_logout {
    text-align: right;
  }

  .backdrop {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.5);
  }
</style>
