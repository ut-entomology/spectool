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

  export function resetInputs(rootID: string, initialValues?: any) {
    const inputGroupElem = document.getElementById(rootID);
    const inputElems = inputGroupElem!.querySelectorAll('input, select, textarea');
    inputElems!.forEach((elem) => {
      const inputElem = elem as HTMLInputElement;
      let newValue: any = '';
      if (inputElem.id && initialValues && initialValues[inputElem.id]) {
        newValue = initialValues[inputElem.id];
      }
      if (inputElem.type == 'checkbox') {
        inputElem.checked = newValue === true;
      } else {
        inputElem.value = newValue;
      }
    });
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

  let classes: string = '';
  export { classes as class };
  export let id: string;
  let typeAttr: string;
  export { typeAttr as type };
  export let description = '';

  let baseClass: string;
  let checked: any = undefined;
  let value: any = undefined;
  switch (typeAttr) {
    case 'checkbox':
      baseClass = 'form-check-input';
      checked = $form[id]; // for initial value only
      break;
    default:
      baseClass = 'form-control';
      value = $form[id]; // for initial value only
  }
  classes = classes ? baseClass + ' ' + classes : baseClass;

  const groupErrors: ReturnType<typeof createErrorsStore> =
    getContext('input-group-errors');
  $: if (groupErrors) {
    groupErrors.error(id, $errors[id]);
  }
</script>

<input
  {id}
  class={!groupErrors && $errors[id] ? classes + ' is-invalid' : classes}
  type={typeAttr}
  {checked}
  {value}
  on:change={handleChange}
  on:blur={handleChange}
  on:focus
  on:input
  on:keydown
  on:keypress
  on:keyup
  aria-describedby={description ? id + '-form-text' : undefined}
  {...$$restProps}
/>
{#if !groupErrors && $errors[id]}
  <div class="invalid-feedback">{normalizeError($errors[id])}</div>
{/if}
{#if description}
  <div id={id + '-form-text'} class="form-text">{@html description}</div>
{/if}
