<script lang="ts" context="module">
  export const unusedTaxaSelectorSpec = {
    targetName: 'UnusedTaxaSelector',
    params: {} as {
      startingDateStr: string;
      endingDateStr: string;
    }
  };
</script>

<script lang="ts">
  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import { screenStack } from '../../stores/screenStack';

  export let startingDateStr = '';
  export let endingDateStr = '';

  const startingDate = new Date(startingDateStr);
  const endingDate = new Date(endingDateStr);

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function changeDates() {
    screenStack.pop({ startingDateStr, endingDateStr });
  }

  function selectAll() {}

  function deselectAll() {}

  function previewPurge() {}
</script>

<main>
  <ActivityInstructions>
    Select the taxa you would like to purge from the database.
  </ActivityInstructions>
  <div class="container-lg">
    <div class="row mt-2 mb-2 justify-content-between">
      <div class="col-auto title">
        Taxa created <i>{formatDate(startingDate)}</i> - <i>{formatDate(endingDate)}</i>
        <button class="btn btn-minor compact" type="button" on:click={changeDates}
          >Change Dates</button
        >
      </div>
      <div class="col-auto">
        <button class="btn btn-major" type="button" on:click={previewPurge}
          >Preview Purge</button
        >
      </div>
    </div>
    <div class="row mb-2">
      <div class="col-auto">
        <button class="btn btn-minor compact" type="button" on:click={selectAll}
          >Select All</button
        >
        <button class="btn btn-minor compact" type="button" on:click={deselectAll}
          >Deselect All</button
        >
      </div>
    </div>
  </div>
  <div class="tree_pane">Tree goes here</div>
</main>

<style>
  .title {
    font-weight: bold;
  }
  main button {
    margin-left: 0.5em;
  }
</style>
