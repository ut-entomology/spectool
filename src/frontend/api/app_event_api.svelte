<script lang="ts" context="module">
  import { currentConnection } from '../stores/currentConnection';
  import { currentDialog } from '../stores/currentDialog';
  import { DialogSpec } from '../lib/dialog_spec';
  import { Connection } from '../shared/shared_connection';

  import { flashMessage } from '../layout/VariableFlash.svelte';
  import { showNotice } from '../layout/VariableNotice.svelte';

  export class AppEventApi {
    private _connection?: Connection;

    constructor() {
      currentConnection.subscribe((conn) => {
        this._connection = conn;
      });
    }

    configureDatabase() {
      currentDialog.set(new DialogSpec('DBConfigDialog'));
    }

    connectDatabase() {
      if (!this._connection!.isConfigured)
        throw Error('Connection has not been configured');
      currentDialog.set(new DialogSpec('DBLoginDialog'));
    }

    async disconnectDatabase() {
      if (!this._connection!.username) throw Error('Database was not connected');
      try {
        await window.apis.databaseApi.logout();
        flashMessage('Disconnected from database');
        currentConnection.set(new Connection(true, null));
      } catch (err: any) {
        showNotice(
          `Failed to disconnect from database: ${err.message}`,
          'ERROR',
          'danger'
        );
      }
    }

    clearLocalStorage() {
      const appMode = localStorage.getItem('app_mode');
      localStorage.clear();
      if (appMode !== null) {
        localStorage.setItem('app_mode', appMode);
      }
      location.reload();
    }

    setAppMode(mode?: string) {
      if (mode) {
        localStorage.setItem('app_mode', mode);
      }
    }

    setPreferences() {
      currentDialog.set(new DialogSpec('DataFolderDialog'));
    }
  }
</script>
