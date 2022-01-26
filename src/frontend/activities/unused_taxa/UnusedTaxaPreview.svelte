<script lang="ts" context="module">
  import {
    IN_USE_NODE_FLAG,
    COLLECTED_LEAF_FLAG,
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
  import { flashMessage } from '../../layout/VariableFlash.svelte';
  import { showNotice } from '../../layout/VariableNotice.svelte';
  import ConfirmationRequest from '../../layout/ConfirmationRequest.svelte';

  // const DELETION_BATCH_SIZE = 1000;

  const DEFAULT_USED_NODE_FLAGS =
    IN_USE_NODE_FLAG | InteractiveTreeFlags.Expandable | InteractiveTreeFlags.Expanded;
  const DEFAULT_UNUSED_NODE_FLAGS = InteractiveTreeFlags.Expandable;

  export let treeRoot: TaxonNode;

  let treeView: UnusedTaxaTreeView;
  let savedSelectionsTree: TaxonNode;
  let selectionCount = 0;
  let requestConfirmation = false;

  function cancelPage() {
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

  async function purgeTaxa() {
    requestConfirmation = true;
  }

  async function confirmPurge() {
    try {
      requestConfirmation = false;
      let count = 0;
      let taxonIDs: number[];
      do {
        taxonIDs = [];
        _collectLeafTaxa(taxonIDs, treeRoot);
        if (taxonIDs.length > 0) {
          await window.apis.taxaApi.removeTaxonIDs(taxonIDs);
          count += taxonIDs.length;
        }
      } while (taxonIDs.length > 0);
      await flashMessage(`Removed ${count} taxa`);
      screenStack.reset();
    } catch (err: any) {
      showNotice(err.message, 'ERROR', 'danger');
    }
  }

  async function cancelPurge() {
    requestConfirmation = false;
    await flashMessage('Canceled purge');
  }

  function _collectLeafTaxa(taxonIDs: number[], node: TaxonNode) {
    let isLeaf = true;
    if (node.children) {
      for (const child of node.children) {
        if (!(child.nodeFlags & COLLECTED_LEAF_FLAG)) {
          _collectLeafTaxa(taxonIDs, child);
          isLeaf = false;
        }
      }
    }
    if (isLeaf) {
      if (!(node.nodeFlags & IN_USE_NODE_FLAG)) {
        taxonIDs.push(node.id);
      }
      node.nodeFlags |= COLLECTED_LEAF_FLAG;
    }
  }

  function _pruneUnselectedTaxa(node: TaxonNode): boolean {
    const selected =
      !!(node.nodeFlags & InteractiveTreeFlags.Selected) &&
      !(node.nodeFlags & IN_USE_NODE_FLAG);
    if (selected) {
      ++selectionCount;
    } else {
      node.nodeHTML = node.nodeHTML.replace('<span>', '').replace('</span>', '');
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
    instructions="Confirm that you would like to remove the indicated unused taxa, shown in <b>bold</b>."
    note="{selectionCount} taxa in <b>bold</b> will be removed"
    {treeRoot}
  >
    <span slot="main-buttons">
      <button class="btn btn-minor" type="button" on:click={cancelPage}>Cancel</button>
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

  {#if requestConfirmation}
    <ConfirmationRequest
      message="Permanently delete the {selectionCount} selected taxa?"
      okayButton="Delete"
      onOkay={confirmPurge}
      onCancel={cancelPurge}
    />
  {/if}
{/await}
