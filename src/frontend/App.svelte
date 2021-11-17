<script lang="ts">
  import { setContext } from 'svelte';
  import type { AppScreen } from './lib/app_screen';
  import { User } from './lib/user';
  import { appPrefsReady } from './stores/appPrefsReady';
  import { databaseConfigReady } from './stores/dbConfigReady';
  import { loggedInUser } from './stores/loggedInUser';
  import { screenStack } from './stores/screenStack';
  import { currentDialog } from './stores/currentDialog';
  import { AppPrefsClient } from './clients/app_prefs_client';
  import { DatabaseConfigClient } from './clients/db_config_client';
  import VariableFlash from './layout/VariableFlash.svelte';
  import VariableNotice from './layout/VariableNotice.svelte';
  import VariableDialog from './layout/VariableDialog.svelte';
  import ActivityMenu from './components/ActivityMenu.svelte';
  import HeaderBar from './components/HeaderBar.svelte';
  import ActivityBar from './components/ActivityBar.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import AppPrefsDialog from './dialogs/AppPrefsDialog.svelte';
  import DBConfigDialog from './dialogs/DBConfigDialog.svelte';

  const initialAppPrefs = AppPrefsClient.getPrefs();
  setContext('app-prefs', initialAppPrefs);
  $appPrefsReady = initialAppPrefs.isReady();

  const initialDatabaseConfig = DatabaseConfigClient.getConfig();
  setContext('db-config', initialDatabaseConfig);
  $databaseConfigReady = initialDatabaseConfig.isReady();

  let currentScreen: AppScreen;
  screenStack.subscribe((screens) => {
    currentScreen = screens[screens.length - 1];
  });

  $loggedInUser = User.getLoggedInUser();
  screenStack.push({
    title: 'Activities',
    componentType: ActivityMenu,
    params: {}
  });
  $: (async () => {
    if (!$databaseConfigReady) {
      $currentDialog = DBConfigDialog;
    } else if (!$appPrefsReady) {
      $currentDialog = AppPrefsDialog;
    }
  })();
</script>

<HeaderBar appTitle="UT SpecTool" />
<div class="page-content">
  <ActivityBar />
  <svelte:component this={currentScreen.componentType} {...currentScreen.params} />
</div>
<StatusBar />

<VariableDialog />
<VariableNotice />
<VariableFlash />

<style lang="scss" global>
  // Svelte is not allowing a component to have both local and global SCSS.

  @use 'sass:math';
  @import './values';

  @import '../../node_modules/bootstrap/scss/functions';
  @import '../../node_modules/bootstrap/scss/variables';
  @import '../../node_modules/bootstrap/scss/utilities';

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

  @import '../../node_modules/bootstrap/scss/bootstrap';

  // Layout

  body {
    box-sizing: content-box;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
  }

  .page-content {
    flex: auto;
    margin: 0 $horizontalMargin;
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
</style>
