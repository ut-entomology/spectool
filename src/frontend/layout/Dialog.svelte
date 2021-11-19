<script lang="ts">
  // Intended for use in VariableDialog.

  import Modal from './Modal.svelte';

  export let title: string;
  export let dialogClasses = '';
  export let contentClasses = '';
</script>

<Modal {dialogClasses} {contentClasses}>
  <div class="dialog">
    <div class="row">
      <h2 class="col">{title}</h2>
    </div>
    <slot />
  </div>
</Modal>

<style>
  h2 {
    font-size: 1.1rem;
    text-align: center;
    font-style: italic;
    margin-bottom: 1.5rem;
  }
</style>
