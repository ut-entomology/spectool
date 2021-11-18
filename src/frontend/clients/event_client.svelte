<script lang="ts" context="module">
  import { currentConnection } from '../stores/currentConnection';
  import { currentDialog } from '../stores/currentDialog';
  import { DialogSpec } from '../lib/dialog_spec';
  import type { Connection } from '../shared/connection';
  import { DatabaseClient } from './database_client';
  import { flashMessage } from '../layout/VariableFlash.svelte';
  import { showNotice } from '../layout/VariableNotice.svelte';
  import DataFolderDialog from '../dialogs/DataFolderDialog.svelte';
  import DBConfigDialog from '../dialogs/DBConfigDialog.svelte';
  import DBLoginDialog from '../dialogs/DBLoginDialog.svelte';

  let connection: Connection;
  currentConnection.subscribe((conn) => {
    connection = conn;
  });

  window.ipc.on('configure_database', (_data) => {
    currentDialog.set(new DialogSpec(DBConfigDialog));
  });

  window.ipc.on('connect_database', (_data) => {
    if (!connection.isConfigured) throw Error('Connection has not been configured');
    currentDialog.set(new DialogSpec(DBLoginDialog));
  });

  window.ipc.on('disconnect_database', async (_data) => {
    if (!connection.username) throw Error('Database was not connected');
    try {
      await DatabaseClient.logout();
      flashMessage('Disconnected from database');
      currentConnection.set({
        isConfigured: true,
        username: null
      });
    } catch (err: any) {
      showNotice(
        `Failed to disconnect from database: ${err.message}`,
        'ERROR',
        'danger'
      );
    }
  });

  window.ipc.on('set_preferences', (_data) => {
    currentDialog.set(new DialogSpec(DataFolderDialog));
  });
</script>
