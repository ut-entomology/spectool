<script lang="ts">
  import { Button } from 'sveltestrap';
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
        openModal(ModalMessage, { message: 'You have logged out', millis: 1000 });
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
        <Button outline color="primary" on:click={openLoginForm}>Login</Button>
      {:else}
        <Button on:click={logout}>Logout</Button>
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

<style lang="scss">
  @import '../global.scss';

  .header_bar {
    flex: 0;
    width: 100%;
    background-color: $pageBarBackgroundColor;
    color: $pageBarTextColor;
    padding: 0.3em 0;
  }

  .header_bar .content {
    position: relative;
    margin: 0 $horizontalMargin;
    text-align: center;
  }

  .app_title {
    padding: 0.3em 0;
    position: absolute;
    left: 0px;
    color: rgb(172, 92, 0);
  }

  .login_logout {
    position: absolute;
    right: 0px;
    font-size: 0.9em;
  }

  .login_logout .inconspicuous {
    margin-top: 0.15em;
  }

  .logged_in_user {
    padding: 0.3em 0;
  }

  .logged_in_user span {
    font-style: italic;
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
