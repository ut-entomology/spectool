<script lang="ts">
  import { onMount } from 'svelte';
  import { AppPrefsClient } from '../clients/app_prefs_client';
  import { DatabaseClient } from '../clients/database_client';

  let username: string = '';
  let password: string = '';
  let savingCredentials = false;
  let message: string = '';

  onMount(async () => {
    const prefs = await AppPrefsClient.getPrefs(window);
    savingCredentials = prefs.saveDatabaseCredentials;
    const creds = DatabaseClient.getCredentials(window);
    if (creds !== null) {
      ({ username, password } = creds);
    }
  });

  async function login() {
    // Reload prefs in case they chaned in the interim.
    const prefs = await AppPrefsClient.getPrefs(window);
    prefs.saveDatabaseCredentials = savingCredentials;
    await AppPrefsClient.setPrefs(window, prefs);
    try {
      await DatabaseClient.login(window, { username, password });
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
