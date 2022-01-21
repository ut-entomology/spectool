<script lang="ts" context="module">
  export enum InteractiveTreeFlags {
    ExpandedFlag = 1 << 0, // whether to show the node's children
    SelectedFlag = 1 << 1, // whether the node is selected
    ExpandableFlag = 1 << 2, // whether the node is collapsable and expandable
    SelectableFlag = 1 << 3 // whether the node is selectable
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

  if (!(flags & InteractiveTreeFlags.SelectableFlag)) {
    flags &= ~InteractiveTreeFlags.ExpandedFlag;
  }
  if (!(flags & InteractiveTreeFlags.ExpandableFlag)) {
    flags &= ~InteractiveTreeFlags.SelectedFlag;
  }

  export function select() {
    if (flags & InteractiveTreeFlags.SelectableFlag) {
      flags |= InteractiveTreeFlags.SelectedFlag;
    }
    for (const child of children) {
      child.select();
    }
  }
</script>

<div class="tree_node">
  <div class="node_html">{tree.nodeHTML}</div>
  {#if flags & InteractiveTreeFlags.ExpandedFlag}
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
