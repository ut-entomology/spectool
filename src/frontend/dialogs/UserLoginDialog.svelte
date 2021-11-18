<script lang="ts">
  import { flashMessage } from '../layout/VariableFlash.svelte';
  import { currentDialog } from '../stores/currentDialog';
  import { currentUser } from '../stores/currentUser';
  import { UserClient } from '../clients/user_client';
  import LoginDialog from '../dialogs/LoginDialog.svelte';

  export let onSuccess: () => void = () => {};

  const closeDialog = () => {
    $currentDialog = null;
  };

  async function login(username: string, password: string, save: boolean) {
    $currentUser = save
      ? await UserClient.loginAndSave({ username, password })
      : await UserClient.login({ username, password });
    closeDialog();
    await flashMessage('You are logged in');
    onSuccess();
  }
</script>

<LoginDialog title="Login to Specify" {login} toggle={closeDialog} />
