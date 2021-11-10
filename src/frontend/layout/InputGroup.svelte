<script lang="ts">
  import { setContext } from 'svelte';
  import { createErrorsStore, normalizeError } from './Input.svelte';

  export let id: string;
  export let description = '';

  const errorsStore = createErrorsStore();
  setContext('input-group-errors', errorsStore);
  let errors: {};
  errorsStore.subscribe((value) => {
    errors = value;
  });

  function errorMessages(errors: any) {
    let messages = '';
    for (const key in errors) {
      const error = errors[key];
      if (error) {
        if (messages) messages += '<br/>';
        messages += normalizeError(error);
      }
    }
    return messages;
  }
</script>

<div
  class={errors != {} ? 'input-group is-invalid' : 'input-group'}
  aria-describedby={description ? id + '-form-text' : undefined}
>
  <slot />
</div>
{#if errors != {}}
  <div class="invalid-feedback">{errorMessages(errors)}</div>
{/if}
{#if description}
  <div id={id + '-form-text'} class="form-text">{@html description}</div>
{/if}
