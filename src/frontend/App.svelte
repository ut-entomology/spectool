<script lang="ts">
  import { setContext, getContext } from 'svelte';
  import { User } from './lib/user';
  import { loggedInUser } from './stores/loggedInUser';
  import { screenStack } from './stores/screenStack';
  import type { AppPrefs } from './shared/app_prefs';
  import { AppPrefsClient } from './clients/app_prefs_client';
  import AppPrefsScreen from './app_prefs_screen.svelte';
  import ModalFlash from './layout/ModalFlash.svelte';
  import ModalNotice from './layout/ModalNotice.svelte';
  import ActivityMenu from './activities/ActivityMenu.svelte';
  import HeaderBar from './components/HeaderBar.svelte';
  import ActivityBar from './components/ActivityBar.svelte';
  import StatusBar from './components/StatusBar.svelte';

  setContext('prefs', AppPrefsClient.getPrefs(window));
  $loggedInUser = User.getLoggedInUser();
  if (!getContext<AppPrefs>('prefs').dataFolder) {
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

<HeaderBar appTitle="UT SpecTool" />
<div class="page-content">
  <ActivityBar />
  <svelte:component this={currentScreen().componentType} {...currentScreen().params} />
</div>
<StatusBar />

<ModalNotice />
<ModalFlash maxWidth="220px" />

<style lang="scss" global>
  // Svelte is not allowing a component to have both local and global SCSS.

  @import './values';
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
    padding: 0.2em 0.6em;
    border-radius: 0.5em;
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
    padding: 0 0.5em;
    font-size: 90%;
  }

  // Modals

  .dialog {
    padding: 1.5em 1em;
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
    padding: 1em;
  }

  .modal-flash {
    padding: 1.5em;
    text-align: center;
  }

  // Alerts

  .alert {
    margin-bottom: 0; // override default 1rem
  }
</style>
