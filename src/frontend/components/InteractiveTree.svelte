<script lang="ts" context="module">
  export enum InteractiveTreeFlags {
    Expanded = 1 << 0, // whether to show the node's children
    Selected = 1 << 1, // whether the node is selected
    Expandable = 1 << 2, // whether the node is collapsable and expandable
    Selectable = 1 << 3 // whether the node is selectable
  }

  export interface InteractiveTreeNode {
    nodeFlags: number;
    nodeHTML: string;
    children: InteractiveTreeNode[] | null;
  }
</script>

<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  const UNEXPANDED_SYMBOL = '&#9654;';
  const EXPANDED_SYMBOL = '&#9660';

  export let tree: InteractiveTreeNode;

  let flags = tree.nodeFlags;
  let childComponents: SvelteComponent[] = [];

  function setSelection(selected: boolean) {
    if (flags & InteractiveTreeFlags.Selectable) {
      if (selected) {
        flags |= InteractiveTreeFlags.Selected;
      } else {
        flags &= ~InteractiveTreeFlags.Selected;
      }
      tree.nodeFlags = flags;
    }
    for (const childComponent of childComponents) {
      childComponent.setSelection(selected);
    }
  }

  const toggleExpansion = () => {
    flags ^= InteractiveTreeFlags.Expanded;
  };

  const toggleSelection = () => {
    setSelection(!!(flags ^ InteractiveTreeFlags.Selected));
  };
</script>

<div class="tree_node">
  <div class="node_head">
    {#if tree.children && flags & InteractiveTreeFlags.Expandable}<div
        class="expander"
        on:click={toggleExpansion}
      >
        {@html flags & InteractiveTreeFlags.Expanded
          ? EXPANDED_SYMBOL
          : UNEXPANDED_SYMBOL}
      </div>{/if}
    {#if flags & InteractiveTreeFlags.Selectable}<div class="checkbox">
        <input
          type="checkbox"
          checked={!!(flags & InteractiveTreeFlags.Selected)}
          on:change={toggleSelection}
        />
      </div>
      <div class="selectable" on:click={toggleSelection}>{@html tree.nodeHTML}</div>
    {:else}
      <div>{@html tree.nodeHTML}</div>
    {/if}
  </div>
  {#if flags & InteractiveTreeFlags.Expanded}
    {#if tree.children}
      <div class="node_children">
        {#each tree.children as child, i}
          <svelte:self bind:this={childComponents[i]} tree={child} />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style global>
  .tree_node {
    visibility: inherit;
  }
  .tree_node .node_head div {
    display: inline-block;
  }
  .tree_node .expander,
  .tree_node .selectable {
    cursor: pointer;
  }
  .tree_node .node_children {
    visibility: inherit;
  }
</style>
