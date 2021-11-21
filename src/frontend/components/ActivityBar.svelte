<script lang="ts" context="module">
  import type { Activity } from '../lib/activity';
  import * as prereqs from '../lib/prereqs.svelte';
  import { currentUser } from '../stores/currentUser';
  import { screenStack } from '../stores/screenStack';
  import { currentActivity } from '../stores/currentActivity';
  import { currentConnection } from '../stores/currentConnection';
  import { currentCollectionID } from '../stores/currentCollectionID';
  import type { Connection } from '../shared/connection';

  let connection: Connection;
  currentConnection.subscribe((conn) => {
    connection = conn;
  });

  export function openActivity(activity: Activity) {
    prereqs.satisfyAll(activity.prerequisites, () => {
      screenStack.push({
        title: activity.title,
        target: activity.target,
        params: []
      });
      currentActivity.set(activity);
    });
  }

  export function closeActivity() {
    screenStack.reset();
  }
</script>

<script lang="ts">
  $: collectionID = $currentCollectionID;

  $: if ($currentUser === null) {
    if ($currentActivity && $currentActivity.requiresLogin) {
      closeActivity();
    }
  }

  function setCollection() {
    // TODO: restart activity for new collection
  }
</script>

<div class="activity_bar row g-0">
  <div class="title_box col-sm-6">
    {#if $screenStack.length == 1}
      <div>{$screenStack[0].title}</div>
    {:else}
      <div>{$screenStack[1].title}</div>
      <button class="btn btn-minor compact" on:click={closeActivity}>Close</button>
    {/if}
  </div>
  {#if $currentUser !== null}
    <div class="collection_box col-sm-6">
      <select
        name="collection"
        class="selected_collection"
        bind:value={collectionID}
        on:change={setCollection}
      >
        {#each $currentUser.access as access}
          <option value={access.collectionID}
            >{connection.getCollection(access.collectionID)?.collectionName} ({access.accessLevel.toLowerCase()})</option
          >
        {:else}
          <option>no authorized collections</option>
        {/each}
      </select>
    </div>
  {/if}
</div>

<style lang="scss">
  @import '../values';

  .activity_bar {
    font-size: 110%;
    margin: 0.4rem 0;
  }

  .title_box {
    display: flex;
  }

  .title_box div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-right: 0.5rem;
  }

  .collection_box {
    text-align: right;
  }

  .collection_box select {
    font-size: 80%;
    padding: 0.2em 0.3em;
    color: #555;
    border-radius: $border-radius;
  }
</style>
