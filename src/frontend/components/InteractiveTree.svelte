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

  export let tree: InteractiveTreeNode;

  let flags = tree.nodeFlags;
  let children: SvelteComponent[] = [];

  if (!(flags & InteractiveTreeFlags.Expandable)) {
    flags &= ~InteractiveTreeFlags.Expanded;
  }
  if (!(flags & InteractiveTreeFlags.Selectable)) {
    flags &= ~InteractiveTreeFlags.Selected;
  }
  tree.nodeFlags = flags;

  export function setExpansion(expanded: boolean) {
    if (flags & InteractiveTreeFlags.Expandable) {
      if (expanded) {
        flags |= InteractiveTreeFlags.Expanded;
      } else {
        flags &= ~InteractiveTreeFlags.Expanded;
      }
      tree.nodeFlags = flags;
    }
  }

  export function setSelection(selected: boolean) {
    if (flags & InteractiveTreeFlags.Selectable) {
      if (selected) {
        flags |= InteractiveTreeFlags.Selected;
      } else {
        flags &= ~InteractiveTreeFlags.Selected;
      }
      tree.nodeFlags = flags;
    }
    for (const child of children) {
      child.setSelection(selected);
    }
  }
</script>

<div class="tree_node">
  <div class="node_html">{@html tree.nodeHTML}</div>
  {#if flags & InteractiveTreeFlags.Expanded}
    {#if tree.children}
      <div class="node_children">
        {#each tree.children as child, i}
          <svelte:self bind:this={children[i]} tree={child} />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style global>
  .tree_node {
    visibility: inherit;
  }
  .node_html {
    visibility: inherit;
  }
  .node_children {
    visibility: inherit;
  }
</style>
