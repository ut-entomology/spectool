<script lang="ts">
  import { currentActivity } from '../stores/currentActivity';

  export let title: string;
  export let preClose: (() => Promise<boolean>) | null = null;

  async function closeActivity(): Promise<void> {
    if (await preClose!()) {
      $currentActivity = null;
    }
  }
</script>

<div class="activity_bar">
  {title}
  {#if preClose}
    <button class="inconspicuous" on:click={closeActivity}>Close</button>
  {/if}
</div>

<style>
  .activity_bar {
    font-size: 110%;
    margin: 0.4em 0;
  }

  .activity_bar button {
    margin-left: 0.5em;
    font-size: 0.85em;
  }
</style>
