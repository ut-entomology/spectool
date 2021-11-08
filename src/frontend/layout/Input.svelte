<script lang="ts">
  let classNames: string;
  export { classNames as class };
  export let id: string;
  export let value = '';
  export let description = '';
  export let error = '';

  function errorMessage(error: string) {
    const requiredOffset = error.indexOf(' is a required field');
    if (requiredOffset > 0) {
      return error.substr(0, requiredOffset) + ' required';
    }
    return error;
  }
</script>

<input
  {...$$restProps}
  {id}
  class={error ? classNames + ' is-invalid' : classNames}
  on:blur
  on:change
  on:focus
  on:input
  on:keydown
  on:keypress
  on:keyup
  bind:value
  aria-describedby={description ? id + '-form-text' : undefined}
/>
<div class="invalid-feedback">{errorMessage(error)}</div>
{#if description}
  <div id={id + '-form-text'} class="form-text">{@html description}</div>
{/if}
