<script lang="ts">
  import { flashMessage } from '../layout/VariableFlash.svelte';
  import { currentDialog } from '../stores/currentDialog';
  import { currentConnection } from '../stores/currentConnection';
  import { Connection } from '../shared/shared_connection';
  import LoginDialog from '../dialogs/LoginDialog.svelte';

  export let onSuccess: () => void = () => {};

  const closeDialog = () => {
    $currentDialog = null;
  };

  async function connect(username: string, password: string, save: boolean) {
    if (save) {
      await window.apis.databaseApi.loginAndSave({ username, password });
    } else {
      await window.apis.databaseApi.login({ username, password });
    }
    $currentConnection = new Connection(true, username);
    closeDialog();
    await flashMessage('Connected');
    onSuccess();
  }
</script>

<LoginDialog
  title="Connect to Database"
  loggedInText="connected"
  submitLabel="Connect"
  login={connect}
  toggle={closeDialog}
/>
