<script lang="ts" context="module">
  import type { Readable, Writable } from 'svelte/store';

  export type SetInputValue = (value: any) => Promise<void>;

  type Values = { [key: string]: any };
  export type FormContext = {
    form: Writable<Values>;
    errors: Writable<Values>;
    touched: Writable<Values>;
    modified: Readable<Values>;
    isValid: Readable<boolean>;
    isSubmitting: Writable<boolean>;
    isValidating: Writable<boolean>;
    handleReset: () => void;
    handleChange: (event: Event) => any;
    handleSubmit: (event: Event) => any;
  };

  export const formContextKey = {};
</script>

<script lang="ts">
  import { getContext, tick } from 'svelte';
  import { groupErrorsKey, createErrorsStore, normalizeError } from './group_errors';

  const { form, errors, handleChange } = getContext<FormContext>(formContextKey);

  export let id: string | undefined = undefined;
  export let name: string;
  let classAttr: string = '';
  export { classAttr as class };
  let typeAttr: string = 'text';
  export { typeAttr as type };
  export let description = '';
  let element: HTMLInputElement;
  export const setValue: SetInputValue = async (value: any) => {
    switch (typeAttr) {
      case 'checkbox':
        element.checked = value;
        break;
      default:
        element.value = value;
    }
    await tick();
    element.dispatchEvent(new Event('change')); // force re-validation
  };

  const inputClasses: { [key: string]: string } = {
    checkbox: 'form-check-input',
    text: 'form-control'
  };
  const baseClass = inputClasses[typeAttr] || inputClasses['text'];
  classAttr = classAttr ? baseClass + ' ' + classAttr : baseClass;

  if (description && !id) {
    throw Error(`id required for description of Input '${name}'`);
  }

  const handleOnKeyUp = (event: Event) => {
    // Ensures that submit button doesn't move when pressed (thereby
    // ignoring the submit) as a result of error messages being removed.
    if ($errors[name]) {
      return handleChange(event);
    }
  };

  const groupErrors: ReturnType<typeof createErrorsStore> = getContext(groupErrorsKey);
  $: if (groupErrors) {
    groupErrors.error(name, $errors[name]);
  }
</script>

<input
  {id}
  {name}
  class={!groupErrors && $errors[name] ? classAttr + ' is-invalid' : classAttr}
  type={typeAttr}
  value={$form[name]}
  on:change={handleChange}
  on:blur={handleChange}
  on:focus
  on:input
  on:keydown
  on:keypress
  on:keyup={handleOnKeyUp}
  aria-describedby={description ? id + '-form-text' : undefined}
  bind:this={element}
  {...$$restProps}
/>
{#if !groupErrors && $errors[name]}
  <div class="invalid-feedback">{normalizeError($errors[name])}</div>
{/if}
{#if description}
  <div id={id + '-form-text'} class="form-text">{@html description}</div>
{/if}
