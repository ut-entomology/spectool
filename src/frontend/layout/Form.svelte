<script lang="ts">
  import { setContext } from 'svelte';
  import { inputKey, FormContext } from './Input.svelte';

  export let context: FormContext;

  export function resetForm(initialValues: { [key: string]: any }) {
    for (const id of initialValues) {
      const elem = document.getElementById(id);
      if (elem!.type == 'text') {
      }
    }
  }

  setContext(inputKey, context);
</script>

<form on:submit={context.handleSubmit} {...$$restProps}>
  <slot />
</form>
