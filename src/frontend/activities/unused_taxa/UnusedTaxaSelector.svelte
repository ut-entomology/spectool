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
  import type { Taxon, TaxonomicRank } from '../../../backend/api/taxa_api';
  import type { UserInfo } from '../../../backend/api/user_api';
  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import BigSpinner from '../../components/BigSpinner.svelte';
  import ExpandableTree from '../../components/InteractiveTree.svelte';
  import { InteractiveTreeFlags } from '../../components/InteractiveTree.svelte';
  import { screenStack } from '../../stores/screenStack';
  import type { TaxonTree, TaxonNode } from '../../lib/taxa_tree';

  const GENUS_RANK = 180;
  const MIN_SPECIES_RANK = 220;
  const DEFAULT_NODE_FLAGS =
    InteractiveTreeFlags.Expandable |
    InteractiveTreeFlags.Selectable |
    InteractiveTreeFlags.Expanded;

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

  function formatTaxon(
    taxon: Taxon,
    rankMap: Record<number, TaxonomicRank>,
    userMap: Record<number, UserInfo>
  ) {
    let userName = '<i>system</i>';
    if (!isNaN(taxon.CreatedByAgentID)) {
      const user = userMap[taxon.CreatedByAgentID];
      userName = user.LastName;
      if (user.FirstName) {
        userName = `${user.FirstName} ${userName}`;
      }
    }
    let taxonName = taxon.FullName;
    if (taxon.RankID >= MIN_SPECIES_RANK) {
      taxonName = `<i>${taxonName}</i>`;
    } else {
      if (taxon.RankID == GENUS_RANK) {
        taxonName = `<i>${taxonName}</i>`;
      }
      taxonName = `${rankMap[taxon.RankID].Name}: ${taxonName}`;
    }
    return `${taxonName} (${userName} ${taxon.TimestampCreated.toLocaleDateString(
      'en-US'
    )})`;
  }

  async function prepare() {
    // All taxa represented by nodes, indexed by taxon ID
    const nodeByID: Record<number, TaxonNode> = {};
    // Taxa not yet known to be a child of another unused taxon, indexed by taxon ID
    const rootNodeByID: Record<number, TaxonNode> = {};
    // Orphaned child taxa by parent ID, waiting for possible parent taxon.
    const orphanNodesByParentID: Record<number, TaxonNode[]> = {};
    // Tracks the most recent taxon ID
    let lastTaxonID = 0;

    // Load users for showing who created each taxon.
    const userMap = await window.apis.userApi.getAllUsers();

    // Load the taxonomic ranks so we can label the taxa.
    const rankMap = await window.apis.taxaApi.getTaxonomicRanks();

    // Construct the intermediate structures of the taxon trees.

    let batch = unbundleTaxa(
      await window.apis.taxaApi.getBatchOfUnusedTaxa(
        startingDate,
        endingDate,
        lastTaxonID
      )
    );
    while (batch.length > 0) {
      for (const taxon of batch) {
        // Track all nodes by taxon ID.
        const node: TaxonNode = {
          id: taxon.TaxonID,
          nodeFlags: DEFAULT_NODE_FLAGS,
          nodeHTML: formatTaxon(taxon, rankMap, userMap),
          children: null
        };
        nodeByID[node.id] = node;

        // If we already have the taxon's parent, place it under the parent.
        const parentNode = nodeByID[taxon.ParentID];
        if (parentNode) {
          if (parentNode.children === null) {
            parentNode.children = [node];
          } else {
            parentNode.children.push(node);
          }
        }
        // Track taxa for which we don't yet have parents as possible root
        // taxa and as orphans waiting for their parent taxa.
        else {
          rootNodeByID[taxon.TaxonID] = node;
          const orphanNodes = orphanNodesByParentID[taxon.ParentID];
          if (orphanNodes) {
            orphanNodes.push(node);
          } else {
            orphanNodesByParentID[taxon.ParentID] = [node];
          }
        }

        // If the new taxon is a parent of orphans, put the orphans under the
        // parent and remove the orphans as possible root taxa.
        const childNodes = orphanNodesByParentID[taxon.TaxonID];
        if (childNodes) {
          delete orphanNodesByParentID[taxon.TaxonID];
          node.children = childNodes;
          for (const childNode of childNodes) {
            delete rootNodeByID[childNode.id];
          }
        }

        // Track lower bound of next batch of taxa to retrieve.
        lastTaxonID = taxon.TaxonID;
      }

      // Retrieve the next batch of taxa to process.
      batch = unbundleTaxa(
        await window.apis.taxaApi.getBatchOfUnusedTaxa(
          startingDate,
          endingDate,
          lastTaxonID + 1
        )
      );
    }

    // Construct the taxon trees from the intermediate structures.
    for (const rootNode of Object.values(rootNodeByID)) {
      taxonTrees.push({
        containingTaxaHTML: [],
        root: rootNode
      });
    }
  }

  function previewPurge() {}

  function selectAll() {}

  function unbundleTaxa(bundle: string): Taxon[] {
    const TAXON_FIELD_COUNT = 6;
    const values = bundle.split('|');
    const taxa: Taxon[] = [];
    // If the bundle is not empty...
    if (values[0] != '') {
      let i = 0;
      while (i < values.length) {
        let taxon: any = {};
        taxon.TaxonID = parseInt(values[i]);
        taxon.FullName = values[i + 1];
        taxon.RankID = parseInt(values[i + 2]);
        taxon.ParentID = parseInt(values[i + 3]);
        taxon.CreatedByAgentID = parseInt(values[i + 4]);
        taxon.TimestampCreated = new Date(values[i + 5]);
        taxa.push(taxon);
        i += TAXON_FIELD_COUNT;
      }
    }
    return taxa;
  }
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
      {#each taxonTrees as tree}
        <ExpandableTree tree={tree.root} />
      {/each}
    </div>
  </main>
{/await}

<style>
  main {
    flex: auto;
    display: flex;
    flex-direction: column;
  }
  main button {
    margin-left: 0.5em;
  }
  .title {
    font-weight: bold;
  }
  .tree_pane {
    flex-basis: 0px;
    flex-grow: 1;
    font-size: 0.8em;
    overflow: auto;
    scrollbar-width: thin;
    border: solid 1px #666;
  }
  .tree_pane :global(.tree_node) {
    margin-left: 0.8em;
  }
</style>
