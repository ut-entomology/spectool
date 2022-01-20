<script lang="ts" context="module">
  import type { SvelteComponent } from 'svelte';

  import DataFolderDialog from '../dialogs/DataFolderDialog.svelte';
  import DBConfigDialog from '../dialogs/DBConfigDialog.svelte';
  import DBLoginDialog from '../dialogs/DBLoginDialog.svelte';
  import UserLoginDialog from '../dialogs/UserLoginDialog.svelte';

  import ActivityMenu from '../components/ActivityMenu.svelte';
  import LocalityConsolidationMain from '../activities/locality_consolidation/LocalityConsolidationMain.svelte';
  import UnusedTaxaMain from '../activities/unused_taxa/UnusedTaxaMain.svelte';
  import UnusedTaxaSelector from '../activities/unused_taxa/UnusedTaxaSelector.svelte';

  const targetMap: Record<string, typeof SvelteComponent> = {
    // Main Screen
    ActivityMenu,
    // Activities
    LocalityConsolidationMain,
    UnusedTaxaMain,
    UnusedTaxaSelector,
    // Dialogs
    DataFolderDialog,
    DBConfigDialog,
    DBLoginDialog,
    UserLoginDialog
  };

  export function toSvelteTarget(targetName: string): typeof SvelteComponent {
    const targetComponent = targetMap[targetName];
    if (!targetComponent) {
      throw Error(`Target component '${targetName}' not found`);
    }
    return targetComponent;
  }
</script>
