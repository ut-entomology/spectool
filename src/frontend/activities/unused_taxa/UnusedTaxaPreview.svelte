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
  import type { SvelteComponent } from 'svelte';

  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import BigSpinner from '../../components/BigSpinner.svelte';
  import InteractiveTree from '../../components/InteractiveTree.svelte';
  import {
    InteractiveTreeFlags,
    InteractiveTreeNode
  } from '../../components/InteractiveTree.svelte';
  import StatusMessage from '../../layout/StatusMessage.svelte';
  import { showStatus } from '../../layout/StatusMessage.svelte';
  import { screenStack } from '../../stores/screenStack';

  const DEFAULT_USED_NODE_FLAGS =
    IN_USE_NODE_FLAG | InteractiveTreeFlags.Expandable | InteractiveTreeFlags.Expanded;
  const DEFAULT_UNUSED_NODE_FLAGS = InteractiveTreeFlags.Expandable;

  export let treeRoot: TaxonNode;
  let savedSelectionsTree: TaxonNode;
  let rootChildrenComponents: SvelteComponent[] = [];
  let taxonIDsToPurge: number[] = [];

  function cancel() {
    screenStack.pop((params) => {
      params.treeRoot = savedSelectionsTree;
    });
  }

  function collapseAll() {
    if (treeRoot && treeRoot.children) {
      for (const treeRootChildComponent of rootChildrenComponents) {
        treeRootChildComponent.setExpansion(() => false);
      }
    }
  }

  function expandAll() {
    if (treeRoot && treeRoot.children) {
      for (const treeRootChildComponent of rootChildrenComponents) {
        treeRootChildComponent.setExpansion(() => true);
      }
    }
  }

  function expandToUnusedTaxa() {
    if (treeRoot && treeRoot.children) {
      for (const treeRootChildComponent of rootChildrenComponents) {
        treeRootChildComponent.setExpansion((node: InteractiveTreeNode) => {
          return !!(node.nodeFlags & IN_USE_NODE_FLAG);
        });
      }
    }
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
  <main>
    <ActivityInstructions>
      Confirm that you would like to remove the indicated unused taxa.
    </ActivityInstructions>
    <div class="container-lg">
      <div class="row mt-2 mb-2 justify-content-between">
        <div class="col-auto title">Unused taxa selected for removal</div>
        <div class="col-auto">
          <button class="btn btn-minor" type="button" on:click={cancel}>Cancel</button>
          <button class="btn btn-major" type="button" on:click={purgeTaxa}
            >Purge Taxa</button
          >
        </div>
      </div>
      <div class="row mb-2 justify-content-between">
        <div class="col-auto">
          <button class="btn btn-minor compact" type="button" on:click={collapseAll}
            >Collapse All</button
          >
          <button
            class="btn btn-minor compact"
            type="button"
            on:click={expandToUnusedTaxa}>Expand to Unused Taxa</button
          >
          <button class="btn btn-minor compact" type="button" on:click={expandAll}
            >Expand All</button
          >
        </div>
        <div class="col-auto unused_note">(taxa in <b>bold</b> will be removed)</div>
      </div>
    </div>
    <div class="tree_pane">
      {#if treeRoot.children}
        {#each treeRoot.children as child, i}
          <InteractiveTree bind:this={rootChildrenComponents[i]} tree={child} />
        {/each}
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
    padding: 0.4em 1.5em 0 0;
    font-size: 0.9em;
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
  .tree_pane :global(.bullet) {
    width: 1em;
    padding-left: 0.1em;
    opacity: 0.6;
  }
  .tree_pane :global(.bullet.selectable) {
    padding-left: 0;
    opacity: 1;
  }
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
