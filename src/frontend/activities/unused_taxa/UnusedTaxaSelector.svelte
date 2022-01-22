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
  import { onMount } from 'svelte';

  import type { BaseTaxon, Taxon, TaxonomicRank } from '../../../backend/api/taxa_api';
  import type { UserInfo } from '../../../backend/api/user_api';
  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import BigSpinner from '../../components/BigSpinner.svelte';
  import InteractiveTree from '../../components/InteractiveTree.svelte';
  import { InteractiveTreeFlags } from '../../components/InteractiveTree.svelte';
  import StatusMessage from '../../layout/StatusMessage.svelte';
  import { showStatus } from '../../layout/StatusMessage.svelte';
  import { screenStack } from '../../stores/screenStack';
  import type { TaxonNode } from '../../lib/taxon_node';

  const GENUS_RANK = 180;
  const MIN_SPECIES_RANK = 220;
  const IN_USE_NODE_FLAG = 1 << 14;
  const CONTAINS_UNUSED_TAXA_FLAG = 1 << 15;
  const DEFAULT_USED_NODE_FLAGS =
    InteractiveTreeFlags.Selectable | InteractiveTreeFlags.Expanded | IN_USE_NODE_FLAG;
  const DEFAULT_UNUSED_NODE_FLAGS =
    InteractiveTreeFlags.Expandable | InteractiveTreeFlags.Selectable;

  export let startingDateStr = '';
  export let endingDateStr = '';

  const startingDate = new Date(startingDateStr);
  const endingDate = new Date(endingDateStr);

  let treeRoot: TaxonNode | null;

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

  function formatTaxonName(taxon: BaseTaxon, rankMap: Record<number, TaxonomicRank>) {
    let taxonName = taxon.FullName;
    if (taxon.RankID >= MIN_SPECIES_RANK) {
      return `<i>${taxonName}</i>`;
    }
    if (taxon.RankID == GENUS_RANK) {
      taxonName = `<i>${taxonName}</i>`;
    }
    return `${rankMap[taxon.RankID].Name}: ${taxonName}`;
  }

  function formatUnusedTaxon(
    taxon: Taxon,
    rankMap: Record<number, TaxonomicRank>,
    userMap: Record<number, UserInfo>
  ) {
    const taxonName = formatTaxonName(taxon, rankMap);
    let userName = '<i>system</i>';
    if (!isNaN(taxon.CreatedByAgentID)) {
      const user = userMap[taxon.CreatedByAgentID];
      userName = user.LastName;
      if (user.FirstName) {
        userName = `${user.FirstName} ${userName}`;
      }
    }
    return `<span>${taxonName}</span> (${userName} ${taxon.TimestampCreated.toLocaleDateString(
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
    showStatus('Loading user information...');
    const userMap = await window.apis.userApi.getAllUsers();
    // Load the taxonomic ranks so we can label the taxa.
    showStatus('Loading taxonomic ranks...');
    const rankMap = await window.apis.taxaApi.getTaxonomicRanks();

    // Adds a taxon's node to the intermediate structures used to create the tree.
    function __addTaxonNode(taxon: BaseTaxon, node: TaxonNode) {
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
        if (!isNaN(taxon.ParentID)) {
          const orphanNodes = orphanNodesByParentID[taxon.ParentID];
          if (orphanNodes) {
            orphanNodes.push(node);
          } else {
            orphanNodesByParentID[taxon.ParentID] = [node];
          }
        }
      }

      // If the new taxon is a parent of orphans, put the orphans under the
      // parent and remove the orphans as possible root taxa. Bubble up whether
      // the node contains any unused taxa.
      const childNodes = orphanNodesByParentID[taxon.TaxonID];
      if (childNodes) {
        delete orphanNodesByParentID[taxon.TaxonID];
        node.children = childNodes;
        for (const childNode of childNodes) {
          if (__containsUnusedTaxa(childNode)) {
            node.nodeFlags |= CONTAINS_UNUSED_TAXA_FLAG;
          }
          delete rootNodeByID[childNode.id];
        }
      }
    }

    // Indicates whether a node is unused or contains unused taxa.
    function __containsUnusedTaxa(node: TaxonNode): boolean {
      return (
        !(node.nodeFlags & IN_USE_NODE_FLAG) ||
        !!(node.nodeFlags & CONTAINS_UNUSED_TAXA_FLAG)
      );
    }

    // Construct the intermediate structures of the taxon trees.

    let batchCount = 1;
    showStatus(`Loading unused taxa (batch ${batchCount})...`);
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
          nodeFlags: DEFAULT_UNUSED_NODE_FLAGS,
          nodeHTML: formatUnusedTaxon(taxon, rankMap, userMap),
          children: null
        };
        nodeByID[node.id] = node;

        // Incorporate the taxon's node into intermediate structures.
        __addTaxonNode(taxon, node);

        // Track lower bound of next batch of taxa to retrieve.
        lastTaxonID = taxon.TaxonID;
      }

      // Retrieve the next batch of taxa to process.
      showStatus(`Loading unused taxa (batch ${++batchCount})...`);
      batch = unbundleTaxa(
        await window.apis.taxaApi.getBatchOfUnusedTaxa(
          startingDate,
          endingDate,
          lastTaxonID + 1
        )
      );
    }

    // Get the ancestors of unused taxa (may include unused taxa that are
    // ancestors of other unused taxa, may include duplicates). Use them
    // to incorporate all unused taxa into a single navigable tree. That is,
    // there should only be a single tree left in rootNodeByID.
    showStatus('Loading ancestor taxa of unused taxa...');
    let ancestors = await window.apis.taxaApi.getAncestorsOfUnusedTaxa(
      startingDate,
      endingDate
    );
    ancestors = ancestors.concat(await window.apis.taxaApi.getOrdersAndHigher());
    for (const taxon of ancestors) {
      const node: TaxonNode = {
        id: taxon.TaxonID,
        nodeFlags: DEFAULT_USED_NODE_FLAGS,
        nodeHTML: formatTaxonName(taxon, rankMap),
        children: null
      };
      // don't replace an unused taxon node with a used taxon node
      if (nodeByID[node.id] === undefined) {
        nodeByID[node.id] = node;
        __addTaxonNode(taxon, node);
      }
    }
    treeRoot = Object.values(rootNodeByID)[0];

    // Remove all taxa not containing at least one unused taxon.
    showStatus('Cleaning up data...');
    function __removeUnusedTaxa(node: TaxonNode) {
      if (node.children) {
        const keptChildren: TaxonNode[] = [];
        for (const child of node.children) {
          if (__containsUnusedTaxa(child)) {
            keptChildren.push(child);
            __removeUnusedTaxa(child);
          }
        }
        if (node.children.length > 0) {
          node.children = keptChildren;
        } else {
          node.children = null;
        }
      }
    }
    __removeUnusedTaxa(treeRoot);
    if (!treeRoot.children || treeRoot.children.length == 0) {
      treeRoot = null;
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

  onMount(() => showStatus(null));
</script>

{#await prepare()}
  <BigSpinner centered={true} />
  <StatusMessage />
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
      <div class="row mb-2 justify-content-between">
        <div class="col-auto">
          <button class="btn btn-minor compact" type="button" on:click={selectAll}
            >Select All</button
          >
          <button class="btn btn-minor compact" type="button" on:click={deselectAll}
            >Deselect All</button
          >
        </div>
        <div class="col-auto unused_note">(Unused taxa are in <b>bold</b>.)</div>
      </div>
    </div>
    <div class="tree_pane">
      {#if treeRoot == null}
        <i>No unused taxa found</i>
      {:else}
        <InteractiveTree tree={treeRoot} />
      {/if}
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
  .unused_note {
    padding-right: 1.5em;
  }
  .tree_pane {
    flex-basis: 0px;
    flex-grow: 1;
    font-size: 0.9em;
    overflow: auto;
    scrollbar-width: thin;
    border: solid 1px #666;
  }
  .tree_pane :global(.tree_node) {
    margin: 0.3em 0 0 1.5em;
  }
  .tree_pane :global(.expander),
  .tree_pane :global(input) {
    margin-right: 0.3em;
  }
  .tree_pane :global(.checkbox) {
    vertical-align: middle;
  }
  .tree_pane :global(span) {
    font-weight: bold;
  }
</style>
