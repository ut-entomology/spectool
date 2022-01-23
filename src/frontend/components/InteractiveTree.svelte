<script lang="ts" context="module">
  export enum InteractiveTreeFlags {
    Expanded = 1 << 0, // whether to show the node's children
    Selected = 1 << 1, // whether the node is selected
    Expandable = 1 << 2, // whether the node is collapsable and expandable
    Selectable = 1 << 3, // whether the node is selectable
    SelectDescendents = 1 << 4 // whether selecting the node selects its descendents
  }

  export interface InteractiveTreeNode {
    nodeFlags: number;
    nodeHTML: string;
    children: InteractiveTreeNode[] | null;
  }
</script>

<script lang="ts">
  import type { SvelteComponent } from 'svelte';

  const EXPANDED_SYMBOL = '&#9660';
  const COLLAPSED_SYMBOL = '&#9654;';
  const NONEXPANDABLE_SYMBOL = '&#x2981;';

  export let tree: InteractiveTreeNode;

  let flags = tree.nodeFlags;
  let childComponents: SvelteComponent[] = [];

  export function setSelection(selected: boolean) {
    if (flags & InteractiveTreeFlags.Selectable) {
      flags = _setSelectionFlag(flags, selected);
      tree.nodeFlags = _setSelectionFlag(tree.nodeFlags, selected);
      if (flags & InteractiveTreeFlags.SelectDescendents) {
        if (flags & InteractiveTreeFlags.Expanded) {
          for (const childComponent of childComponents) {
            childComponent.setSelection(selected);
          }
        } else {
          _setHiddenDescendentSelections(tree, selected);
        }
      }
    }
  }

  function _setHiddenDescendentSelections(
    node: InteractiveTreeNode,
    selected: boolean
  ) {
    if (node.children) {
      for (const child of node.children) {
        child.nodeFlags = _setSelectionFlag(child.nodeFlags, selected);
        _setHiddenDescendentSelections(child, selected);
      }
    }
  }

  function _setSelectionFlag(anyFlags: number, selected: boolean) {
    if (selected) {
      anyFlags |= InteractiveTreeFlags.Selected;
    } else {
      anyFlags &= ~InteractiveTreeFlags.Selected;
    }
    return anyFlags;
  }

  const toggleExpansion = () => {
    if (flags & InteractiveTreeFlags.Expanded) {
      flags &= ~InteractiveTreeFlags.Expanded;
    } else {
      flags |= InteractiveTreeFlags.Expanded;
    }
  };

  const toggleSelection = () => {
    setSelection(!(flags & InteractiveTreeFlags.Selected));
  };
</script>

<div class="tree_node">
  <div class="node_head">
    {#if tree.children && flags & InteractiveTreeFlags.Expandable}<div
        class="selectable bullet"
        on:click={toggleExpansion}
      >
        {@html flags & InteractiveTreeFlags.Expanded
          ? EXPANDED_SYMBOL
          : COLLAPSED_SYMBOL}
      </div>
    {:else}
      <div class="bullet">{@html NONEXPANDABLE_SYMBOL}</div>
    {/if}
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
        {#each tree.children as childNode, i}
          <svelte:self bind:this={childComponents[i]} tree={childNode} />
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
  .tree_node .selectable {
    cursor: pointer;
  }
  .tree_node .node_children {
    visibility: inherit;
  }
</style>
