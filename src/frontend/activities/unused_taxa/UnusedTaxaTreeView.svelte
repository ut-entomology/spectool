<script lang="ts" context="module">
  import { IN_USE_NODE_FLAG, TaxonNode } from '../../lib/taxon_node';
</script>

<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import InteractiveTree from '../../components/InteractiveTree.svelte';
  import type { InteractiveTreeNode } from '../../components/InteractiveTree.svelte';

  export let title: string;
  export let instructions: string;
  export let note: string;
  export let treeRoot: TaxonNode | null;

  let rootChildrenComponents: SvelteComponent[] = [];

  export function collapseAll() {
    if (treeRoot && treeRoot.children) {
      for (const treeRootChildComponent of rootChildrenComponents) {
        treeRootChildComponent.setExpansion(() => false);
      }
    }
  }

  export function deselectAll() {
    if (treeRoot && treeRoot.children) {
      for (const treeRootChildComponent of rootChildrenComponents) {
        treeRootChildComponent.deselectAll();
      }
    }
  }

  export function expandAll() {
    if (treeRoot && treeRoot.children) {
      for (const treeRootChildComponent of rootChildrenComponents) {
        treeRootChildComponent.setExpansion(() => true);
      }
    }
  }

  export function expandToUnusedTaxa() {
    if (treeRoot && treeRoot.children) {
      for (const treeRootChildComponent of rootChildrenComponents) {
        treeRootChildComponent.setExpansion((node: InteractiveTreeNode) => {
          return !!(node.nodeFlags & IN_USE_NODE_FLAG);
        });
      }
    }
  }

  export function selectAll() {
    if (treeRoot && treeRoot.children) {
      for (const treeRootChildComponent of rootChildrenComponents) {
        treeRootChildComponent.setSelection(true);
      }
    }
  }
</script>

<main>
  <ActivityInstructions>{instructions}</ActivityInstructions>
  <div class="container-lg">
    <div class="row mt-2 mb-2 justify-content-between">
      <div class="col-auto title">
        {@html title}
        <slot name="title-button" />
      </div>
      <div class="col-auto">
        <slot name="main-buttons" />
      </div>
    </div>
    <div class="row mb-2 justify-content-between">
      <div class="col-auto">
        <slot name="tree-buttons" />
      </div>
      <div class="col-auto unused_note">({@html note})</div>
    </div>
  </div>
  <div class="tree_pane">
    {#if !treeRoot || !treeRoot.children}
      No unused taxa found
    {:else}
      {#each treeRoot.children as child, i}
        <InteractiveTree bind:this={rootChildrenComponents[i]} tree={child} />
      {/each}
    {/if}
  </div>
</main>

<style>
  main {
    flex: auto;
    display: flex;
    flex-direction: column;
  }
  main :global(button) {
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
