<script lang="ts">
  import { setContext } from 'svelte';

  import type { ScreenSpec } from '../lib/screen_spec';
  import { Context } from '../lib/contexts';
  import { currentPrefs } from '../stores/currentPrefs';
  import { currentConnection } from '../stores/currentConnection';
  import { screenStack } from '../stores/screenStack';
  import type { Connection } from '../shared/shared_connection';
  import { DatabaseConfigClient } from '../clients/db_config_client';
  import { recordUserLogin } from '../dialogs/UserLoginDialog.svelte';
  import { toSvelteTarget } from '../util/svelte_targets.svelte';
  import VariableFlash from '../layout/VariableFlash.svelte';
  import VariableNotice, { showNotice } from '../layout/VariableNotice.svelte';
  import VariableDialog from '../layout/VariableDialog.svelte';
  import HeaderBar from './HeaderBar.svelte';
  import ActivityBar from './ActivityBar.svelte';
  import StatusBar from './StatusBar.svelte';
  import BigSpinner from './BigSpinner.svelte';

  let connection: Connection;
  const initialDatabaseConfig = DatabaseConfigClient.getConfig();
  setContext(Context.DatabaseConfig, initialDatabaseConfig);
  currentConnection.subscribe((conn) => {
    connection = conn;
  });

  let currentScreen: ScreenSpec;
  screenStack.subscribe((screens) => {
    currentScreen = screens[screens.length - 1];
  });

  // @ts-ignore TS doesn't understand that the subscriber is immediately called
  if (!currentScreen) {
    screenStack.push({
      targetName: 'ActivityMenu',
      params: {}
    });
  }

  async function connectDatabase() {
    const databaseCreds = await window.apis.databaseApi.getSavedCreds();
    if (databaseCreds) {
      try {
        $currentConnection = await window.apis.databaseApi.loginAndSave(databaseCreds);
      } catch (err: any) {
        showNotice(
          `Login failed to connect to database: ${err.message}`,
          'FAILED',
          'warning'
        );
      }
    }
  }

  async function loginUser() {
    const userCreds = await window.apis.userApi.getSavedCreds();
    if (userCreds) {
      try {
        recordUserLogin(await window.apis.userApi.loginAndSave(userCreds));
      } catch (err: any) {
        showNotice(
          `Login failed for user '${userCreds.username}': ${err.message}`,
          'FAILED',
          'warning'
        );
      }
    }
  }

  async function restoreSession() {
    $currentPrefs = await window.apis.appPrefsApi.getPrefs();
    if (connection.username) {
      if (!connection.isActive()) {
        await connectDatabase();
      }
      if (connection.isActive()) {
        await loginUser();
      }
    }
  }
</script>

{#await restoreSession()}
  <BigSpinner />
{:then}
  <HeaderBar appTitle="UT SpecTool" />
  <ActivityBar />
  <div class="page-content">
    <svelte:component
      this={toSvelteTarget(currentScreen.targetName)}
      {...currentScreen.params}
    />
  </div>
  <StatusBar />

  <VariableDialog />
  <VariableNotice />
  <VariableFlash />
{/await}

<style lang="scss" global>
  // Svelte is not allowing a component to have both local and global SCSS.

  @use 'sass:math';
  @import '../values';

  @import '../../../node_modules/bootstrap/scss/functions';
  @import '../../../node_modules/bootstrap/scss/variables';
  @import '../../../node_modules/bootstrap/scss/utilities';

  // Must precede loading boostrap SCSS
  $utilities: (
    'rw': (
      class: 'rw',
      property: width,
      responsive: true,
      values: (
        // can't figure out how to generate this
        1: math.percentage(math.div(1, 12)),
        2: math.percentage(math.div(2, 12)),
        3: math.percentage(math.div(3, 12)),
        4: math.percentage(math.div(4, 12)),
        5: math.percentage(math.div(5, 12)),
        6: math.percentage(math.div(6, 12)),
        7: math.percentage(math.div(7, 12)),
        8: math.percentage(math.div(8, 12)),
        9: math.percentage(math.div(9, 12)),
        10: math.percentage(math.div(10, 12)),
        11: math.percentage(math.div(11, 12)),
        12: math.percentage(math.div(12, 12))
      )
    )
  );

  @import '../../../node_modules/bootstrap/scss/bootstrap';

  // Layout

  body {
    box-sizing: content-box;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    height: 100%;
  }

  .page-content {
    flex: auto;
    display: flex;
    flex-direction: column;
    margin: 0 $horizontalMargin;
    height: 100%;
  }

  h2 {
    font-size: 1.2rem;
    text-align: center;
    margin-bottom: 1.5rem;
  }

  // Buttons

  button.btn-major,
  button.btn-minor {
    color: $blueLinkColor;
    padding: 0.2rem 0.6rem;
    border-radius: 0.5rem;
  }

  button.btn-major {
    background-color: $majorButtonColor;
    border: 1px solid $majorButtonColor;
  }

  button.btn-minor {
    background-color: $minorButtonColor;
    border: 1px solid $minorButtonColor;
  }

  button.btn-major:hover,
  button.btn-minor:hover {
    border: 1px solid $blueLinkColor;
    color: $blueLinkColor;
  }

  button.compact {
    padding: 0 0.5rem;
    font-size: 90%;
  }

  input[file]::before {
    font-size: 90%;
  }

  // Modals

  .dialog {
    padding: 1.5rem;
  }

  .dialog,
  .modal-notice {
    border-radius: 8px;
    pointer-events: auto;
  }

  .modal-notice {
    margin: 0 auto;
    padding: 1rem;
  }

  .modal-flash {
    padding: 1.5rem;
    text-align: center;
  }

  // Alerts

  .alert {
    margin-bottom: 0; // override default 1rem
  }

  // Activities

  .activity-instructions {
    margin: 1rem 0;
  }
</style>
