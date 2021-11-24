<script lang="ts">
  import { currentDialog } from '../stores/currentDialog';
  import { toSvelteTarget } from '../util/svelte_targets.svelte';
</script>

{#if $currentDialog !== null}
  <svelte:component
    this={toSvelteTarget($currentDialog.targetName)}
    {...$currentDialog.params}
  />
{/if}
