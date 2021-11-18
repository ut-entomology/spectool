<script lang="ts" context="module">
  import type { Prerequisite } from './prerequisite';
  import type { AppPrefs } from '../shared/app_prefs';
  import type { Connection } from '../shared/connection';
  import type { SpecifyUser } from '../shared/specify_user';
  import { DialogSpec } from '../lib/dialog_spec';
  import { currentPrefs } from '../stores/currentPrefs';
  import { currentConnection } from '../stores/currentConnection';
  import { currentUser } from '../stores/currentUser';
  import { currentDialog } from '../stores/currentDialog';
  import DBConfigDialog from '../dialogs/DBConfigDialog.svelte';
  import DBLoginDialog from '../dialogs/DBLoginDialog.svelte';
  import UserLoginDialog from '../dialogs/UserLoginDialog.svelte';
  import DataFolderDialog from '../dialogs/DataFolderDialog.svelte';

  let appPrefs: AppPrefs;
  currentPrefs.subscribe((prefs) => {
    appPrefs = prefs;
  });

  let connection: Connection;
  currentConnection.subscribe((conn) => {
    connection = conn;
  });

  let _currentUser: SpecifyUser | null;
  currentUser.subscribe((user) => {
    _currentUser = user;
  });

  export function satisfyAll(prereqs: Prerequisite[], onCompletion: () => void) {
    satisfyNext(prereqs, 0, onCompletion);
  }

  function satisfyNext(prereqs: Prerequisite[], i: number, onCompletion: () => void) {
    while (i < prereqs.length && prereqs[i].check()) {
      i += 1;
    }
    if (i < prereqs.length) {
      prereqs[i].satisfy(() => satisfyNext(prereqs, i + 1, onCompletion));
    } else {
      onCompletion();
    }
  }

  export const databaseConfigPrereq: Prerequisite = {
    check: () => connection.isConfigured,
    satisfy: (onSuccess) =>
      currentDialog.set(new DialogSpec(DBConfigDialog, { onSuccess }))
  };

  export const connectionPrereq: Prerequisite = {
    check: () => connection.username !== null,
    satisfy: (onSuccess) =>
      currentDialog.set(new DialogSpec(DBLoginDialog, { onSuccess }))
  };

  export const userLoginPrereq: Prerequisite = {
    check: () => _currentUser != null,
    satisfy: (onSuccess) =>
      currentDialog.set(new DialogSpec(UserLoginDialog, { onSuccess }))
  };

  export const dataFolderPrereq: Prerequisite = {
    check: () => !!appPrefs.dataFolder,
    satisfy: (onSuccess) =>
      currentDialog.set(new DialogSpec(DataFolderDialog, { onSuccess }))
  };
</script>