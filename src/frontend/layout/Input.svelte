<script lang="ts" context="module">
  export function normalizeError(error: string) {
    const requiredOffset = error.indexOf(' is a required field');
    if (requiredOffset > 0) {
      return error.substr(0, requiredOffset) + ' required';
    }
    return error;
  }
</script>

<script lang="ts">
  let classNames: string = '';
  export { classNames as class };
  export let id: string;
  let typeAttr: string;
  export { typeAttr as type };
  export let value = '';
  export let checked = false;
  export let description = '';
  export let error = '';

  let baseClass: string;
  switch (typeAttr) {
    case 'checkbox':
      baseClass = 'form-check-input';
      break;
    default:
      baseClass = 'form-control';
  }
  const classes = classNames ? baseClass + ' ' + classNames : baseClass;
</script>

<input
  {id}
  class={error ? classes + ' is-invalid' : classes}
  type={typeAttr}
  {value}
  {checked}
  on:blur
  on:change
  on:focus
  on:input
  on:keydown
  on:keypress
  on:keyup
  aria-describedby={description ? id + '-form-text' : undefined}
  {...$$restProps}
/>
{#if error}
  <div class="invalid-feedback">{normalizeError(error)}</div>
{/if}
{#if description}
  <div id={id + '-form-text'} class="form-text">{@html description}</div>
{/if}
