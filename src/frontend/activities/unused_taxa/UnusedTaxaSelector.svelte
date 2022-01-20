<script lang="ts">
  import ActivityInstructions from '../../components/ActivityInstructions.svelte';

  let startingDate: Date;
  let endingDate: Date;

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function changeDates() {}

  function selectAll() {}

  function deselectAll() {}

  function previewPurge() {}
</script>

<main>
  <ActivityInstructions>
    Select the taxa you would like to purge from the database.
  </ActivityInstructions>
  <div class="container-lg">
    <div class="row mt-2 mb-2">
      <div class="col-auto">
        Taxa created {formatDate(startingDate)} - {formatDate(endingDate)}
      </div>
      <div class="col-auto">
        <button class="btn btn-minor" type="button" on:click={changeDates}
          >Change Dates</button
        >
      </div>
    </div>
    <div class="row mb-2 justify-content-between">
      <div class="col-auto">
        <button class="btn btn-minor" type="button" on:click={selectAll}
          >Select All</button
        >
        <button class="btn btn-minor" type="button" on:click={deselectAll}
          >Deselect All</button
        >
      </div>
      <div class="col-auto">
        <button class="btn btn-major" type="button" on:click={previewPurge}
          >Preview Purge</button
        >
      </div>
    </div>
  </div>
  <div class="tree_pane">Tree goes here</div>
</main>
