<script lang="ts">
  import type { TaxonSubtree } from '../../lib/taxa_tree';

  export let subtree: TaxonSubtree;
</script>

<div class="subtree">
  <div class="taxon">{subtree.infoHTML}</div>
  {#if subtree.children}
    {#each subtree.children as child}
      <svelte:self subtree={child} />
    {/each}
  {/if}
</div>

<style>
  .subtree {
    margin-left: 0.8em;
  }
</style>
