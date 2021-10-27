<script lang="ts">
  export let isOpen = false;
</script>

{#if isOpen}
  <div role="dialog" class="modal">
    <slot>Not provided</slot>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
  }
</style>
