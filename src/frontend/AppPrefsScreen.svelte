<script lang="ts">
  import { appDisabled } from './stores/appDisabled';
  import PrefsForm from './components/PrefsForm.svelte';
</script>

<main class="container-md g-0">
  <div class="row mt-3">
    <div class="intro col-12">Please configure this application for use.</div>
  </div>
  <div class="row justify-content-center">
    <div class="col-lg-9">
      <PrefsForm
        on:submit={() => {
          $appDisabled = false;
        }}
      />
    </div>
  </div>
</main>

<style>
  .intro {
    text-align: center;
    font-style: italic;
  }
</style>
