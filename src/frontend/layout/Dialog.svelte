<script lang="ts">
  // Intended for use in VariableDialog.

  // import { onMount, tick } from 'svelte';
  import { Modal } from 'sveltestrap';

  export let title: string;
  //const isOpen = true;

  // onMount(async () => {
  //   // If the app opens with a modal open, there's no backdrop, so
  //   // wait for the modal component to render with the modal off
  //   // before turning the modal on. I can't include the backdrop
  //   // with each modal because then I get a double backdrop (extra
  //   // dark) on subsequent modals.
  //   await tick();
  //   isOpen = true;
  // });
</script>

<Modal isOpen={true} {title} {...$$restProps}>
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
