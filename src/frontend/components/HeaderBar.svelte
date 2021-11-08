<script lang="ts">
  import { showModal, hideModal } from '../layout/Modal.svelte';
  import { flashMessage } from '../layout/ModalFlash.svelte';
  import { showNotice } from '../layout/ModalNotice.svelte';
  import LoginForm from './LoginForm.svelte';
  import { loggedInUser } from '../stores/loggedInUser';
  import { User } from '../lib/user';

  export let appTitle = 'untitled';

  async function login(username: string, password: string, save: boolean) {
    await User.login(username, password, save);
    $loggedInUser = new User(username, save);
    await hideModal();
    flashMessage('You are logged in');
  }

  function logout() {
    User.logout()
      .then(() => {
        $loggedInUser = null;
        flashMessage('You have logged out');
      })
      .catch((err: Error) => {
        showNotice(`Failed to log out: ${err.message}`);
      });
  }
</script>

<LoginForm id="login-form" title="Enter your database credentials" {login} />

<div class="header_bar container-flud g-0">
  <div class="row">
    <div class="col-3 app_title">{appTitle}</div>
    <div class="col-6 logged_in_user">
      {#if $loggedInUser === null}
        <span>not logged in</span>
      {:else}
        {$loggedInUser.username}
        {#if $loggedInUser.saved}
          <span>(saved login)</span>
        {/if}
      {/if}
    </div>
    <div class="col-3 login_logout">
      <div>
        {#if $loggedInUser === null}
          <button
            class="btn btn-major compact"
            on:click={() => showModal('login-form')}
          >
            Login
          </button>
        {:else}
          <button class="btn btn-minor compact" on:click={logout}>Logout</button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @import '../values';

  .header_bar {
    flex: 0;
    width: 100%;
    background-color: $pageBarBackgroundColor;
    color: $pageBarTextColor;
    padding: 0.3rem $horizontalMargin;
  }

  .app_title,
  .logged_in_user,
  .login_logout {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .app_title {
    color: rgb(172, 92, 0);
  }

  .logged_in_user {
    text-align: center;
  }

  .login_logout {
    text-align: right;
  }

  .login_logout .btn {
    // .btn's vertical align messes up vertical centering
    vertical-align: baseline;
  }

  .logged_in_user span {
    font-style: italic;
  }
</style>
