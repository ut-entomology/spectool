<script lang="ts">
  import * as yup from 'yup';
  import { createForm, Form, Field, ErrorMessage } from 'svelte-forms-lib';

  const schema = yup.object().shape({
    title: yup.string().required().min(4),
    description: yup.string().required().min(10)
  });

  const context: any = createForm({
    initialValues: {
      title: '',
      description: ''
    },
    validationSchema: schema,
    onSubmit: (values) => {
      alert(JSON.stringify(values));
    }
  });
</script>

<Form {context}>
  <!-- TYPESCRIPT ERROR -->
  <div>
    <label for="title">Title</label>
    <Field type="text" name="title" id="title" />
    <ErrorMessage name="title" />
  </div>
  <div>
    <label for="title">Description</label>
    <Field type="textarea" name="description" />
    <ErrorMessage name="description" />
  </div>
  <button type="submit">Submit</button>
</Form>
