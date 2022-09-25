<script lang="ts" context="module">
  import type { Prerequisite } from './prerequisite';
  import type { AppPrefs } from '../../shared/shared_app_prefs';
  import type { Connection } from '../../shared/shared_connection';
  import { AccessLevel, SpecifyUser, findAccessLevel } from '../../shared/shared_user';
  import { DialogSpec } from '../lib/dialog_spec';
  import { currentPrefs } from '../stores/currentPrefs';
  import { currentConnection } from '../stores/currentConnection';
  import { currentCollectionID } from '../stores/currentCollectionID';
  import { currentUser } from '../stores/currentUser';
  import { currentDialog } from '../stores/currentDialog';
  import { showNotice } from '../layout/VariableNotice.svelte';

  let appPrefs: AppPrefs;
  currentPrefs.subscribe((prefs) => {
    appPrefs = prefs;
  });

  let connection: Connection;
  currentConnection.subscribe((conn) => {
    connection = conn;
  });

  let collectionID: number;
  currentCollectionID.subscribe((id) => {
    collectionID = id;
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
      currentDialog.set(new DialogSpec('DBConfigDialog', { onSuccess }))
  };

  export const connectionPrereq: Prerequisite = {
    check: () => connection.username !== null,
    satisfy: (onSuccess) =>
      currentDialog.set(new DialogSpec('DBLoginDialog', { onSuccess }))
  };

  export const managerPrereq: Prerequisite = {
    check: () => {
      return (
        _currentUser !== null &&
        findAccessLevel(_currentUser, collectionID) === AccessLevel.Manager
      );
    },
    satisfy: () => showNotice('Only managers can use his function', 'NOTICE', 'warning')
  };

  export const userLoginPrereq: Prerequisite = {
    check: () => _currentUser != null,
    satisfy: (onSuccess) =>
      currentDialog.set(new DialogSpec('UserLoginDialog', { onSuccess }))
  };

  export const dataFolderPrereq: Prerequisite = {
    check: () => !!appPrefs.dataFolder,
    satisfy: (onSuccess) =>
      currentDialog.set(new DialogSpec('DataFolderDialog', { onSuccess }))
  };
</script>
