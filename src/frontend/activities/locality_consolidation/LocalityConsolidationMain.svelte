<script lang="ts" context="module">
  export const localityConsolidationSpec = {
    targetName: 'LocalityConsolidationMain',
    params: {}
  };
</script>

<script lang="ts">
  import { SPECIFY_USA, Region } from '../../../shared/shared_geography';
  import { currentCollectionID } from '../../stores/currentCollectionID';
  import { closeActivity } from '../../components/ActivityBar.svelte';
  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import Notice from '../../layout/Notice.svelte';
  import BigSpinner from '../../components/BigSpinner.svelte';
  import Dialog from '../../layout/Dialog.svelte';

  let countries: Region[] = [];
  let countryID = 0;
  let states: Region[] = [];
  let stateID = 0;

  async function onChangeCountry() {
    if (countryID == 0) {
      states = [];
    } else {
      states = await window.apis.geographyApi.getStatesOf(
        $currentCollectionID,
        countryID
      );
    }
    stateID = 0;
  }

  async function prepare() {
    await window.apis.geographyApi.loadGeography();
    countries = await window.apis.geographyApi.getCountriesOf($currentCollectionID);
    for (let i = 0; i < countries.length; ++i) {
      const country = countries[i];
      if (country.name == SPECIFY_USA) {
        countries.splice(i, 1);
        countries.unshift(country);
        break;
      }
    }
  }
</script>

{#await prepare()}
  <BigSpinner />
{:then}
  <main>
    <ActivityInstructions>
      Select the geographic regions whose localities for which you'd like to consolidate
      duplicate localities.
    </ActivityInstructions>
    <Dialog class="mt-4" title="Consolidate in which region?">
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
                disabled={states.length == 0}
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
