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
    closeModal();
    openModal(ModalMessage, { message: 'You are logged in', millis: 1000 });
  }

  function logout() {
    User.logout()
      .then(() => {
        $loggedInUser = null;
        openModal(ModalMessage, { message: 'You logged out', millis: 1000 });
      })
      .catch((err: Error) => {
        openModal(ModalMessage, {
          message: `Failed to log out: ${err.message}`
        });
      });
  }

  function openLoginForm() {
    openModal(LoginForm, { login, title: 'Enter your database credentials' });
  }
</script>

<div class="header_bar">
  <div class="content">
    <div class="app_title">{appTitle}</div>
    <div class="login_logout">
      {#if $loggedInUser === null}
        <a href={'#'} on:click={openLoginForm}>Login</a>
      {:else}
        <a href={'#'} on:click={logout}>Logout</a>
      {/if}
    </div>
    <div class="logged_in_user">
      {#if $loggedInUser === null}
        <span>not logged in</span>
      {:else}
        {$loggedInUser.username}
        {#if $loggedInUser.saved}
          <span>(saved login)</span>
        {/if}
      {/if}
    </div>
  </div>
</div>

<Modals>
  <div slot="backdrop" class="backdrop" />
</Modals>

<style>
  .header_bar {
    width: 100%;
    background-color: white;
    padding: 0.6em 0;
    border-bottom: 3px solid rgba(49, 177, 49, 0.74);
  }

  .header_bar .content {
    position: relative;
    margin: 0 0.4em;
    text-align: center;
  }

  .app_title {
    position: absolute;
    left: 0px;
    color: darkred;
  }

  .login_logout {
    position: absolute;
    right: 0px;
  }

  .logged_in_user span {
    font-style: italic;
    color: #999;
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
