<script lang="ts">
  import { appDisabled } from './stores/appDisabled';
  import PrefsForm from './components/PrefsForm.svelte';
</script>

<main>
  <div class="row justify-content-center">
    <div class="col-sm-11 col-md-9">
      <PrefsForm
        on:submit={() => {
          $appDisabled = false;
        }}
      />
    </div>
  </div>
</main>

<style>
</style>
