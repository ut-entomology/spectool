<script lang="ts" context="module">
  import { currentUser } from '../stores/currentUser';
  import { currentCollectionID } from '../stores/currentCollectionID';
  import type { SpecifyUser } from '../shared/shared_user';

  export function recordUserLogin(user: SpecifyUser) {
    currentUser.set(user);
    currentCollectionID.set(user.access.length > 0 ? user.access[0].collectionID : 0);
  }
</script>

<script lang="ts">
  import { flashMessage } from '../layout/VariableFlash.svelte';
  import { currentDialog } from '../stores/currentDialog';
  import { UserClient } from '../clients/user_client';
  import LoginDialog from '../dialogs/LoginDialog.svelte';

  export let onSuccess: () => void = () => {};

  const closeDialog = () => {
    $currentDialog = null;
  };

  async function login(username: string, password: string, save: boolean) {
    const user = save
      ? await UserClient.loginAndSave({ username, password })
      : await UserClient.login({ username, password });
    closeDialog();
    recordUserLogin(user);
    await flashMessage('You are logged in');
    onSuccess();
  }
</script>

<LoginDialog title="Login to Specify" {login} toggle={closeDialog} />
