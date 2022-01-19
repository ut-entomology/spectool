<script lang="ts" context="module">
  import type { SvelteComponent } from 'svelte';

  import DataFolderDialog from '../dialogs/DataFolderDialog.svelte';
  import DBConfigDialog from '../dialogs/DBConfigDialog.svelte';
  import DBLoginDialog from '../dialogs/DBLoginDialog.svelte';
  import UserLoginDialog from '../dialogs/UserLoginDialog.svelte';

  import ActivityMenu from '../components/ActivityMenu.svelte';
  import FirstNamesMain from '../activities/FirstNamesMain.svelte';
  import LocalityConsolidationMain from '../activities/locality_consolidation/LocalityConsolidationMain.svelte';
  import UnusedTaxaMain from '../activities/unused_taxa/UnusedTaxaMain.svelte';

  const targetMap: Record<string, typeof SvelteComponent> = {
    DataFolderDialog,
    DBConfigDialog,
    DBLoginDialog,
    UserLoginDialog,
    ActivityMenu,
    FirstNamesMain,
    LocalityConsolidationMain,
    UnusedTaxaMain
  };

  export function toSvelteTarget(targetName: string): typeof SvelteComponent {
    const targetComponent = targetMap[targetName];
    if (!targetComponent) {
      throw Error(`Target component '${targetName}' not found`);
    }
    return targetComponent;
  }
</script>
