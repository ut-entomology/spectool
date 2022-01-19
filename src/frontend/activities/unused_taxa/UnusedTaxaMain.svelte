<script lang="ts">
  import * as yup from 'yup';
  import { createForm, ContextForm, Input } from '../../layout/forms';
  import ActivityInstructions from '../../components/ActivityInstructions.svelte';
  import Dialog from '../../layout/Dialog.svelte';

  const REGEX_DATE = /^ *\d{1,2} *[/] *\d{1,2} *[/] *\d{4} *$/;

  let startingDateStr = new Date(0).toLocaleDateString('en-US');
  let endingDateStr = new Date().toLocaleDateString('en-US');

  let errorMessage = '';

  const DATE_FORMAT_MESSAGE = 'Enter date as MM/DD/YYYY';
  function validateDate(dateStr?: string) {
    if (!dateStr || !REGEX_DATE.test(dateStr)) {
      return false;
    }
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  const context = createForm({
    initialValues: {
      startingDateStr,
      endingDateStr
    },
    validationSchema: yup.object().shape({
      startingDateStr: yup
        .string()
        .label('Starting Date')
        .required()
        .test('test-starting-date', DATE_FORMAT_MESSAGE, validateDate),
      endingDateStr: yup
        .string()
        .label('Ending Date')
        .required()
        .test('test-ending-date', DATE_FORMAT_MESSAGE, validateDate)
    }),
    onSubmit: async (values) => {
      const startingDate = new Date(values.startingDateStr);
      const endingDate = new Date(values.endingDateStr);
      if (startingDate > endingDate) {
        errorMessage = 'Starting date must precede or equal ending date';
      }
    }
  });

  const handleOnKeypress = () => {
    errorMessage = '';
  };
</script>

<main>
  <ActivityInstructions>
    Enter the range of taxon creation dates for which you&apos;d like to inspect unused
    taxa.
  </ActivityInstructions>
  <Dialog title="Date range for unused taxa">
    <ContextForm class="row justify-content-center" {context}>
      <div class="col-auto">
        <div class="row mb-2">
          <div class="field_name">
            <label for="starting_date" class="col-form-label">Starting Date</label>
          </div>
          <div class="col-auto">
            <Input
              id="starting_date"
              name="startingDateStr"
              on:keypress={handleOnKeypress}
            />
          </div>
        </div>
        <div class="row mb-3">
          <div class="field_name">
            <label for="ending_date" class="col-form-label">Ending Date</label>
          </div>
          <div class="col-auto">
            <Input
              id="ending_date"
              name="endingDateStr"
              on:keypress={handleOnKeypress}
            />
          </div>
        </div>
        <div class="row justify-content-end">
          <div class="col-5">
            <button class="btn btn-major" type="submit">View Taxa</button>
          </div>
        </div>
      </div>
    </ContextForm>
    {#if errorMessage !== ''}
      <div class="row justify-content-center mt-3">
        <div class="col-auto">
          <div class="alert alert-danger" role="alert">{errorMessage}</div>
        </div>
      </div>
    {/if}
  </Dialog>
</main>

<style>
  .field_name {
    width: 9em;
  }
</style>
