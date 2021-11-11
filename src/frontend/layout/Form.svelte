<script lang="ts">
  import { setContext } from 'svelte';
  import { formContextKey, FormContext } from './Input.svelte';

  export let context: FormContext;

  setContext(formContextKey, context);
</script>

<form on:submit={context.handleSubmit} {...$$restProps}>
  <slot />
</form>
