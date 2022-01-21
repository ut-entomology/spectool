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
  import BigSpinner from '../../components/BigSpinner.svelte';
  import SelectableTaxonSubtree from './SelectableTaxonSubtree.svelte';
  import { screenStack } from '../../stores/screenStack';
  import type { TaxonTree, TaxonSubtree } from '../../lib/taxa_tree';

  type Taxon = ReturnType<
    Window['apis']['taxaApi']['getBatchOfUnusedTaxa']
  > extends Promise<infer R>
    ? R extends (infer T)[]
      ? T
      : never
    : never;

  export let startingDateStr = '';
  export let endingDateStr = '';

  const startingDate = new Date(startingDateStr);
  const endingDate = new Date(endingDateStr);

  let taxonTrees: TaxonTree[] = [];

  function changeDates() {
    screenStack.pop({ startingDateStr, endingDateStr });
  }

  function deselectAll() {}

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTaxon(taxon: Taxon) {
    return taxon.Name;
  }

  async function prepare() {
    // All taxa represented by subtrees, indexed by taxon ID
    const subtreeByID: Record<number, TaxonSubtree> = {};
    // Taxa not yet known to be a child of another unused taxon, indexed by taxon ID
    const rootSubtreeByID: Record<number, TaxonSubtree> = {};
    // Orphaned child taxa by parent ID, waiting for possible parent taxon.
    const orphanSubtreesByParentID: Record<number, TaxonSubtree[]> = {};
    // Tracks the most recent taxon ID
    let lastTaxonID = 0;

    // Construct the intermediate structures of the taxon trees.

    let batch = await window.apis.taxaApi.getBatchOfUnusedTaxa(
      startingDate,
      endingDate,
      lastTaxonID
    );
    while (batch.length > 0) {
      for (const taxon of batch) {
        // Track all subtrees by taxon ID.
        const subtree: TaxonSubtree = {
          id: taxon.TaxonID,
          name: taxon.Name,
          rankID: taxon.RankID,
          infoHTML: formatTaxon(taxon),
          children: null
        };
        subtreeByID[subtree.id] = subtree;

        // If we already have the taxon's parent, place it under the parent.
        const parentSubtree = subtreeByID[taxon.ParentID];
        if (parentSubtree) {
          if (parentSubtree.children === null) {
            parentSubtree.children = [subtree];
          } else {
            parentSubtree.children.push(subtree);
          }
        }
        // Track taxa for which we don't yet have parents as possible root
        // taxa and as orphans waiting for their parent taxa.
        else {
          rootSubtreeByID[taxon.TaxonID] = subtree;
          const orphanSubtrees = orphanSubtreesByParentID[taxon.ParentID];
          if (orphanSubtrees) {
            orphanSubtrees.push(subtree);
          } else {
            orphanSubtreesByParentID[taxon.ParentID] = [subtree];
          }
        }

        // If the new taxon is a parent of orphans, put the orphans under the
        // parent and remove the orphans as possible root taxa.
        const childSubtrees = orphanSubtreesByParentID[taxon.TaxonID];
        if (childSubtrees) {
          delete orphanSubtreesByParentID[taxon.TaxonID];
          subtree.children = childSubtrees;
          for (const childSubtree of childSubtrees) {
            delete rootSubtreeByID[childSubtree.id];
          }
        }

        // Track lower bound of next batch of taxa to retrieve.
        lastTaxonID = taxon.TaxonID;
      }

      // Retrieve the next batch of taxa to process.
      batch = await window.apis.taxaApi.getBatchOfUnusedTaxa(
        startingDate,
        endingDate,
        lastTaxonID + 1
      );
    }

    // Construct the taxon trees from the intermediate structures.
    for (const rootSubtree of Object.values(rootSubtreeByID)) {
      taxonTrees.push({
        containingTaxa: [],
        root: rootSubtree
      });
    }
  }

  function previewPurge() {}

  function selectAll() {}
</script>

{#await prepare()}
  <BigSpinner />
{:then}
  <main>
    <ActivityInstructions>
      Select the taxa you would like to purge from the database.
    </ActivityInstructions>
    <div class="container-lg">
      <div class="row mt-2 mb-2 justify-content-between">
        <div class="col-auto title">
          Taxa created <i>{formatDate(startingDate)}</i> -
          <i>{formatDate(endingDate)}</i>
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
    <div class="tree_pane">
      <div class="scrollable_area">
        {#each taxonTrees as tree}
          <SelectableTaxonSubtree subtree={tree.root} />
        {/each}
      </div>
    </div>
  </main>
{/await}

<style>
  main button {
    margin-left: 0.5em;
  }
  .title {
    font-weight: bold;
  }
  main,
  .tree_pane {
    height: 100%;
  }
  .tree_pane {
    font-size: 0.8em;
  }
  .scrollable_area {
    height: 100%;
    overflow: auto;
    scrollbar-width: thin;
  }
</style>
