<script lang="ts" context="module">
  import {
    IN_USE_NODE_FLAG,
    TaxonNode,
    duplicateTaxonNode
  } from '../../lib/taxon_node';

  export const unusedTaxaPreviewSpec = {
    targetName: 'UnusedTaxaPreview',
    params: {} as {
      treeRoot: TaxonNode;
    }
  };
</script>

<script lang="ts">
  import BigSpinner from '../../components/BigSpinner.svelte';
  import { InteractiveTreeFlags } from '../../components/InteractiveTree.svelte';
  import UnusedTaxaTreeView from './UnusedTaxaTreeView.svelte';
  import StatusMessage from '../../layout/StatusMessage.svelte';
  import { showStatus } from '../../layout/StatusMessage.svelte';
  import { screenStack } from '../../stores/screenStack';

  const DEFAULT_USED_NODE_FLAGS =
    IN_USE_NODE_FLAG | InteractiveTreeFlags.Expandable | InteractiveTreeFlags.Expanded;
  const DEFAULT_UNUSED_NODE_FLAGS = InteractiveTreeFlags.Expandable;

  export let treeRoot: TaxonNode;

  let treeView: UnusedTaxaTreeView;
  let savedSelectionsTree: TaxonNode;
  let taxonIDsToPurge: number[] = [];

  function cancel() {
    screenStack.pop((params) => {
      params.treeRoot = savedSelectionsTree;
    });
  }

  async function prepare() {
    return new Promise<void>((resolve) => {
      showStatus('Preparing selected unused taxa...');
      savedSelectionsTree = duplicateTaxonNode(treeRoot);
      _pruneUnselectedTaxa(treeRoot);
      resolve();
    });
  }

  async function purgeTaxa() {}

  function _pruneUnselectedTaxa(node: TaxonNode): boolean {
    const selected =
      !!(node.nodeFlags & InteractiveTreeFlags.Selected) &&
      !(node.nodeFlags & IN_USE_NODE_FLAG);
    if (selected) {
      taxonIDsToPurge.push(node.id);
    }
    if (node.children) {
      const childrenHavingSelections: TaxonNode[] = [];
      for (const child of node.children) {
        if (!_pruneUnselectedTaxa(child)) {
          childrenHavingSelections.push(child);
        }
      }
      if (childrenHavingSelections.length == 0) {
        node.children = null;
      } else {
        node.children = childrenHavingSelections;
      }
    }
    node.nodeFlags = selected ? DEFAULT_UNUSED_NODE_FLAGS : DEFAULT_USED_NODE_FLAGS;
    return !(selected || node.children);
  }
</script>

{#await prepare()}
  <StatusMessage />
  <BigSpinner centered={true} />
{:then}
  <UnusedTaxaTreeView
    bind:this={treeView}
    title="Unused taxa selected for removal"
    instructions="Confirm that you would like to remove the indicated unused taxa."
    note="taxa in <b>bold</b> will be removed"
    {treeRoot}
  >
    <span slot="main-buttons">
      <button class="btn btn-minor" type="button" on:click={cancel}>Cancel</button>
      <button class="btn btn-major" type="button" on:click={purgeTaxa}
        >Purge Taxa</button
      >
    </span>
    <span slot="tree-buttons">
      <button
        class="btn btn-minor compact"
        type="button"
        on:click={treeView.collapseAll}>Collapse All</button
      >
      <button
        class="btn btn-minor compact"
        type="button"
        on:click={treeView.expandToUnusedTaxa}>Expand to Unused Taxa</button
      >
      <button class="btn btn-minor compact" type="button" on:click={treeView.expandAll}
        >Expand All</button
      >
    </span>
  </UnusedTaxaTreeView>
{/await}
