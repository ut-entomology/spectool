<script lang="ts">
  import { FirstNamesClient } from '../clients/first_names_client';

  let lastName: string = '';
  let names: string[] = [];
  let message: string = '';

  async function getFirstNames() {
    FirstNamesClient.getFirstNames(lastName)
      .then((firstNames) => {
        message = '';
        names = firstNames!;
      })
      .catch((err) => {
        names = [];
        message = err.message;
      });
  }
</script>

<main>
  <label>
    last name:
    <input bind:value={lastName} />
  </label>

  <button class="btn btn-primary" on:click={getFirstNames}>Get First Names</button>

  <ul>
    {#each names as name}
      <li>{name}</li>
    {/each}
  </ul>

  <p>{message}</p>
</main>

<style>
  main {
    text-align: center;
    padding: 1rem;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
