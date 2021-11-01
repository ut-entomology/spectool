<script lang="ts">
  import { screenStack } from '../stores/screenStack';

  function closeActivity() {
    screenStack.pop();
  }
</script>

<div class="activity_bar">
  {#if $screenStack.length == 1}
    {$screenStack[0].title}
  {:else}
    {$screenStack[$screenStack.length - 1].title}
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
