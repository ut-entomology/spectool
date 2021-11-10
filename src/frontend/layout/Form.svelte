<script lang="ts">
  import { setContext } from 'svelte';
  import { inputKey, FormContext } from './Input.svelte';

  export let context: FormContext;

  setContext(inputKey, context);
</script>

<form on:submit={context.handleSubmit} {...$$restProps}>
  <slot />
</form>
