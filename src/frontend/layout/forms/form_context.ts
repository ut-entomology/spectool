import type { Readable, Writable } from 'svelte/store';

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
