<script lang="ts">
  import { currentDialog } from '../stores/currentDialog';
</script>

{#if $currentDialog !== null}
  <svelte:component this={$currentDialog.target} {...$currentDialog.params} />
{/if}
