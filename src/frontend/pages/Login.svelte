<script lang="ts">
  import { loggedInUser } from '../stores/loggedInUser';
  import { User } from '../lib/user';

  let username: string = '';
  let password: string = '';
  let savingCredentials = false;
  let message: string = '';

  const initialUser = $loggedInUser;
  if (initialUser) {
    username = initialUser.username;
  }

  async function login() {
    try {
      await User.login(username, password, savingCredentials);
      $loggedInUser = new User(username, savingCredentials);
      message = 'Success';
    } catch (err) {
      message = (err as Error).message;
    }
  }
</script>

<main>
  <label>
    username:
    <input bind:value={username} />
  </label>
  <label>
    password:
    <input bind:value={password} type="password" />
  </label>
  <label>
    <input bind:checked={savingCredentials} type="checkbox" />
    Stay logged in on this computer
  </label>

  <button on:click={login}>Login</button>

  <p>{message}</p>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
