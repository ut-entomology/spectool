<script lang="ts">
  import { setContext } from 'svelte';
  import { User } from './lib/user';
  import { appDisabled } from './stores/appDisabled';
  import { loggedInUser } from './stores/loggedInUser';
  import { screenStack } from './stores/screenStack';
  import { AppPrefsClient } from './clients/app_prefs_client';
  import AppPrefsScreen from './AppPrefsScreen.svelte';
  import ModalFlash from './layout/ModalFlash.svelte';
  import ModalNotice from './layout/ModalNotice.svelte';
  import ActivityMenu from './activities/ActivityMenu.svelte';
  import HeaderBar from './components/HeaderBar.svelte';
  import ActivityBar from './components/ActivityBar.svelte';
  import StatusBar from './components/StatusBar.svelte';

  const initialPrefs = AppPrefsClient.getPrefs(window);
  $appDisabled = initialPrefs.dataFolder === '';

  setContext('prefs', initialPrefs);
  $loggedInUser = User.getLoggedInUser();
  $: if ($appDisabled) {
    screenStack.push({
      title: 'Application Preferences',
      componentType: AppPrefsScreen,
      params: {}
    });
  } else {
    screenStack.push({
      title: 'Activities',
      componentType: ActivityMenu,
      params: {}
    });
  }

  function currentScreen() {
    return $screenStack[$screenStack.length - 1];
  }
</script>

<HeaderBar appTitle="UT SpecTool" disabled={$appDisabled} />
<div class="page-content">
  <ActivityBar />
  <svelte:component this={currentScreen().componentType} {...currentScreen().params} />
</div>
<StatusBar />

<ModalNotice />
<ModalFlash maxWidth="220px" />

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
    padding: 1.5rem 1rem;
  }

  .dialog,
  .modal-notice,
  .modal-flash {
    margin: 0 auto;
    border-radius: 8px;
    background: white;
    pointer-events: auto;
  }

  .modal-notice {
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
