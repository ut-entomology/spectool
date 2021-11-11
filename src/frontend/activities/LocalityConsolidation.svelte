<script lang="ts">
  import { GeographyClient } from '../clients/geography_client';
  import { Form, Input, Select } from '../layout/forms';
</script>

<main>
  <Form {context}>
    <div class="row mb-2 justify-content-center">
      <div class="col-sm-3">
        <label for="country" class="col-form-label">Country</label>
      </div>
      <div class="col-sm-6">
        <Select id="country" name="country">foo</Select>
      </div>
    </div>
    <div class="row mb-3 justify-content-center">
      <div class="col-sm-3">
        <label for="state" class="col-form-label">State</label>
      </div>
      <div class="col-sm-6">
        <Input id="state" name="state" />
      </div>
    </div>
  </Form>
</main>

<style>
</style>
