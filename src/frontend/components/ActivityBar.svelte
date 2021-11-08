<script lang="ts">
  import { screenStack } from '../stores/screenStack';

  function closeActivity() {
    screenStack.pop();
  }
</script>

<div class="activity_bar">
  {#if $screenStack.length == 1}
    <div class="title">{$screenStack[0].title}</div>
  {:else}
    <div class="title">{$screenStack[1].title}</div>
    <button class="btn btn-minor compact" on:click={closeActivity}>Close</button>
  {/if}
</div>

<style>
  .activity_bar {
    display: flex;
    font-size: 110%;
    margin: 0.4rem 0;
  }

  .activity_bar div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-right: 0.5rem;
  }
</style>
