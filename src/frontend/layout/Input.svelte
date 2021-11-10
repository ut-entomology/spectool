<script lang="ts" context="module">
  import { writable, Readable, Writable } from 'svelte/store';

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

  export const inputKey = {};

  export function createErrorsStore() {
    const { set, subscribe, update } = writable<{ [key: string]: string }>({});
    return {
      set,
      subscribe,
      error: (id: string, error: string) => {
        update((errors) => {
          if (!error) console.log('clearing error for', id);
          errors[id] = error;
          for (const key in errors) {
            if (errors[key]) return errors;
          }
          return {};
        });
      }
    };
  }

  export function normalizeError(error: string) {
    const requiredOffset = error.indexOf(' is a required field');
    if (requiredOffset > 0) {
      return error.substr(0, requiredOffset) + ' required';
    }
    return error;
  }
</script>

<script lang="ts">
  import { getContext } from 'svelte';

  const { form, errors, handleChange } = getContext<FormContext>(inputKey);

  export let id: string;
  let classAttr: string = '';
  export { classAttr as class };
  let typeAttr: string;
  export { typeAttr as type };
  export let description = '';

  const inputClasses: { [key: string]: string } = {
    checkbox: 'form-check-input',
    text: 'form-control'
  };
  const baseClass = inputClasses[typeAttr] || inputClasses['text'];
  classAttr = classAttr ? baseClass + ' ' + classAttr : baseClass;

  const groupErrors: ReturnType<typeof createErrorsStore> =
    getContext('input-group-errors');
  $: if (groupErrors) {
    groupErrors.error(id, $errors[id]);
  }

  const handleOnKeyUp = (event: Event) => {
    // Ensures that submit button doesn't move when pressed (thereby
    // ignoring the submit) as a result of error messages being removed.
    if ($errors[id]) {
      return handleChange(event);
    }
  };
</script>

<input
  {id}
  name={id}
  class={!groupErrors && $errors[id] ? classAttr + ' is-invalid' : classAttr}
  type={typeAttr}
  value={$form[id]}
  on:change={handleChange}
  on:blur={handleChange}
  on:focus
  on:input
  on:keydown
  on:keypress
  on:keyup={handleOnKeyUp}
  aria-describedby={description ? id + '-form-text' : undefined}
  {...$$restProps}
/>
{#if !groupErrors && $errors[id]}
  <div class="invalid-feedback">{normalizeError($errors[id])}</div>
{/if}
{#if description}
  <div id={id + '-form-text'} class="form-text">{@html description}</div>
{/if}
