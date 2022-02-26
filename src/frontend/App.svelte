<script lang="ts">
  import { exposeWindowApi } from 'electron-affinity/window';

  import { AppEventApi } from './api/app_event_api.svelte';
  import { bindMainApis } from './lib/main_client';
  import PageLayout from './components/PageLayout.svelte';
  import { currentConnection } from './stores/currentConnection';

  async function init() {
    exposeWindowApi(new AppEventApi());

    // Wait for app mode before building any components.
    const waitForAppMode = (resolve: () => {}) => {
      if (localStorage.getItem('app_mode') === null) {
        setTimeout(() => {
          waitForAppMode(resolve);
        }, 100);
      } else {
        resolve();
      }
    };
    await new Promise((resolve: any) => {
      waitForAppMode(resolve);
    });

    // Bind to backend IPC APIs.
    window.apis = await bindMainApis();

    // Restore a previously-saved connection, if any.
    $currentConnection = await window.apis.databaseApi.getExistingConnection();
  }
</script>

{#await init() then}
  <PageLayout />
{/await}
