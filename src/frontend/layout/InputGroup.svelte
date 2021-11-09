<script lang="ts">
  import { normalizeError } from './Input.svelte';

  export let id: string;
  export let description = '';
  export let error = '';
</script>

<div
  class={error ? 'input-group is-invalid' : 'input-group'}
  aria-describedby={description ? id + '-form-text' : undefined}
>
  <slot />
</div>
{#if error}
  <div class="invalid-feedback">{normalizeError(error)}</div>
{/if}
{#if description}
  <div id={id + '-form-text'} class="form-text">{@html description}</div>
{/if}
