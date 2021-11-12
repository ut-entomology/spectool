<script lang="ts">
  import { GeographyClient } from '../clients/geography_client';
  import type { GeoDictionary } from '../shared/specify_data';

  const countries = GeographyClient.getCountries(window);
  let countryID = 0;
  let states: GeoDictionary = {};

  const populateStates = (_event: Event) => {
    states = GeographyClient.getStates(window, countryID);
  };
</script>

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
          on:change={populateStates}
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
        <select id="state" name="state" disabled={states == {}}>
          <option value={0}>All States/Provinces</option>
          {#each Object.values(states) as state}
            <option value={state.id}>{state.name}</option>
          {/each}
        </select>
      </div>
    </div>
  </form>
</main>

<style>
</style>
