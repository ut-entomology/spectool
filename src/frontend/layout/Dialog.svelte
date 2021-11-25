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
