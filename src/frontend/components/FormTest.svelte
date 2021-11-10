<script>
  import * as yup from 'yup';
  import { createForm, Form, Field, ErrorMessage } from 'svelte-forms-lib';
  import { Row, Col, Button, FormGroup, Label } from 'sveltestrap/src';

  const schema = yup.object().shape({
    title: yup.string().required().min(4).max(50),
    description: yup.string().required().min(10).max(1000)
  });

  const formProps = {
    initialValues: {
      title: '',
      description: ''
    },
    validationSchema: schema,
    onSubmit: (values) => {
      alert(JSON.stringify(values));
    }
  };
</script>

<Form {...formProps}>
  <Row>
    <Col>
      <FormGroup>
        <Label for="title">Title</Label>
        <Field type="text" name="title" id="title" placeholder="Recipe Title" />
        <ErrorMessage name="title" />
      </FormGroup>
    </Col>
  </Row>

  <Row>
    <Col>
      <FormGroup>
        <Label for="title">Description</Label>
        <Field
          type="textarea"
          name="description"
          id="description"
          placeholder="Recipe Description"
        />
        <ErrorMessage name="description" />
      </FormGroup>
    </Col>
  </Row>
  <Row>
    <Col>
      <button type="submit">Submit</button>
    </Col>
  </Row>
</Form>
