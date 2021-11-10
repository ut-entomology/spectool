<script lang="ts">
  import { setContext } from 'svelte';
  import { inputKey, FormContext } from './Input.svelte';

  export let context: FormContext;

  setContext(inputKey, context);

  const submit = (event: Event) => {
    console.log('telling lib to submit');
    context.handleSubmit(event);
  };
</script>

<form on:submit={submit} {...$$restProps}>
  <slot />
</form>
