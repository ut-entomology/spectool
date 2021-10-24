<script lang="ts">
  import { DatabaseClient } from '../clients/database_client';

  let username: string = '';
  let password: string = '';
  let message: string = '';

  const creds = DatabaseClient.getCredentials(window);
  if (creds !== null) {
    ({ username, password } = creds);
  }

  function login() {
    DatabaseClient.login(
      window,
      { username, password },
      () => {
        message = 'Success';
      },
      (err) => {
        message = err.message;
      }
    );
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
