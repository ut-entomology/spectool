<script lang="ts">
  import { flashMessage } from '../layout/VariableFlash.svelte';
  import { currentDialog } from '../stores/currentDialog';
  import { loggedInUser } from '../stores/loggedInUser';
  import { User } from '../lib/user';
  import LoginDialog from '../dialogs/LoginDialog.svelte';

  const closeDialog = () => {
    $currentDialog = null;
  };

  async function connect(username: string, password: string, save: boolean) {
    await User.login(username, password, save);
    $loggedInUser = new User(username, save);
    closeDialog();
    flashMessage('You are logged in');
  }
</script>

<LoginDialog
  title="Establish Database Connection"
  login={connect}
  toggle={closeDialog}
  submitLabel="Connect"
/>
