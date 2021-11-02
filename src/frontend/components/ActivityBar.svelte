<script lang="ts">
  import { screenStack } from '../stores/screenStack';
  import { Button } from 'sveltestrap';

  function closeActivity() {
    screenStack.pop();
  }
</script>

<div class="activity_bar">
  {#if $screenStack.length == 1}
    <div>{$screenStack[0].title}</div>
  {:else}
    <div>{$screenStack[1].title}</div>
    <Button outline class="compact" on:click={closeActivity}>Close</Button>
  {/if}
</div>

<style>
  .activity_bar {
    display: flex;
    font-size: 110%;
    margin: 0.4em 0;
  }

  .activity_bar div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-right: 0.5em;
  }
</style>
