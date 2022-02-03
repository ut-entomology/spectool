<script lang="ts">
  import Notice from '../../layout/Notice.svelte';
  import BigSpinner from '../../components/BigSpinner.svelte';

  async function prepare() {}

  function closeWindow() {
    window.close();
  }
</script>

{#await prepare()}
  <BigSpinner />
{:then}
  show report
{:catch err}
  <Notice
    header="Error"
    alert="danger"
    message="Failed to generate agents report: {err.message}"
    on:close={closeWindow}
  />
{/await}
