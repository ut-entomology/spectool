<script lang="ts">
  let classNames: string;
  export { classNames as class };
  export let value = '';
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
  class={error ? classNames + ' is-invalid' : classNames}
  on:blur
  on:change
  on:focus
  on:input
  on:keydown
  on:keypress
  on:keyup
  bind:value
/>
<div class="invalid-feedback">{errorMessage(error)}</div>
