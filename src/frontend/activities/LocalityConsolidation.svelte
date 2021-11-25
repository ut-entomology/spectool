<script lang="ts">
  import { GeographyClient } from '../clients/geography_client';
  import type { GeoEntity } from '../shared/geo_entity';
  import { currentCollectionID } from '../stores/currentCollectionID';
  import { closeActivity } from '../components/ActivityBar.svelte';
  import ActivityInstructions from '../components/ActivityInstructions.svelte';
  import Notice from '../layout/Notice.svelte';
  import BigSpinner from '../components/BigSpinner.svelte';
  import Dialog from '../layout/Dialog.svelte';

  let countries: GeoEntity[] = [];
  let countryID = 0;
  let states: GeoEntity[] = [];
  let stateID = 0;

  async function onChangeCountry() {
    if (countryID == 0) {
      states = [];
    } else {
      states = await GeographyClient.getStatesOf($currentCollectionID, countryID);
    }
    stateID = 0;
  }

  async function preparation() {
    await GeographyClient.loadGeography();
    countries = await GeographyClient.getCountriesOf($currentCollectionID);
    for (let i = 0; i < countries.length; ++i) {
      const country = countries[i];
      if (country.name == 'United States') {
        countries.splice(i, 1);
        countries.unshift(country);
        break;
      }
    }
  }
</script>

{#await preparation()}
  <BigSpinner />
{:then}
  <main>
    <ActivityInstructions>
      Select the geographic regions whose localities for which you'd like to consolidate
      duplicate localities.
    </ActivityInstructions>
    <Dialog title="Consolidate in which region?">
      <form class="row justify-content-center">
        <div class="col-auto">
          <div class="row mb-2">
            <div class="field_name">
              <label for="country" class="col-form-label">Country</label>
            </div>
            <div class="col-auto">
              <select
                id="country"
                name="country"
                bind:value={countryID}
                on:change={onChangeCountry}
              >
                <option value={0}>all countries in collection</option>
                {#each countries as country}
                  <option value={country.id}>{country.name}</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="row mb-3">
            <div class="field_name">
              <label for="state" class="col-form-label">State/Province</label>
            </div>
            <div class="col-auto">
              <select
                id="state"
                name="state"
                bind:value={stateID}
                disabled={states == []}
              >
                {#if countryID == 0}
                  <option value={0}>all states/provinces</option>
                {:else}
                  <option value={0}>all states/provinces in country</option>
                {/if}
                {#each states as state}
                  <option value={state.id}>{state.name}</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="row justify-content-end">
            <div class="col-3">
              <button class="btn btn-major" type="submit">Start</button>
            </div>
          </div>
        </div>
      </form>
    </Dialog>
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
  .field_name {
    width: 9em;
  }
</style>
