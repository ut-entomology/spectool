<script lang="ts">
  import { GeographyClient } from '../clients/geography_client';
  import type { GeoDictionary } from '../shared/specify_data';
  import Notice from '../layout/Notice.svelte';
  import { closeActivity } from '../components/ActivityBar.svelte';
  import BigSpinner from '../components/BigSpinner.svelte';

  let countries: GeoDictionary = {};
  let countryID = 0;
  let stateID = 0;
  let states: GeoDictionary = {};

  async function onChangeCountry() {
    stateID = 0;
    states = countryID == 0 ? {} : await GeographyClient.getStates(countryID);
  }

  async function preparation() {
    await GeographyClient.loadGeography();
    countries = await GeographyClient.getCountries();
  }
</script>

{#await preparation()}
  <BigSpinner />
{:then}
  <main>
    <form>
      <div class="row mb-2 justify-content-center">
        <div class="col-sm-3">
          <label for="country" class="col-form-label">Country</label>
        </div>
        <div class="col-sm-6">
          <select
            id="country"
            name="country"
            bind:value={countryID}
            on:change={onChangeCountry}
          >
            <option value={0}>All Countries</option>
            {#each Object.values(countries) as country}
              <option value={country.id}>{country.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="row mb-3 justify-content-center">
        <div class="col-sm-3">
          <label for="state" class="col-form-label">State/Province</label>
        </div>
        <div class="col-sm-6">
          <select id="state" name="state" bind:value={stateID} disabled={states == {}}>
            <option value={0}>All States/Provinces</option>
            {#each Object.values(states) as state}
              <option value={state.id}>{state.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </form>
  </main>
{:catch err}
  <Notice
    header="Error"
    alert="danger"
    message="Failed to load geography: {err.message}"
    on:close={closeActivity}
  />
{/await}

<style>
</style>
