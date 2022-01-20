<script lang="ts" context="module">
  import type { Activity } from '../lib/activity';
  import * as prereqs from '../lib/prereqs.svelte';
  import { currentUser } from '../stores/currentUser';
  import { screenStack } from '../stores/screenStack';
  import { currentActivity } from '../stores/currentActivity';
  import { currentConnection } from '../stores/currentConnection';
  import { currentCollectionID } from '../stores/currentCollectionID';
  import type { Connection } from '../shared/shared_connection';

  let connection: Connection;
  currentConnection.subscribe((conn) => {
    connection = conn;
  });

  export function openActivity(activity: Activity) {
    prereqs.satisfyAll(activity.prerequisites, () => {
      screenStack.push(activity.screenSpec);
      currentActivity.set(activity);
    });
  }

  export function closeActivity() {
    currentActivity.set(null);
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

<div class="activity_bar row g-0 justify-content-between">
  <div class="title_box col-auto">
    {#if !$currentActivity}
      <div>Activity Menu</div>
    {:else}
      <div class="d-block">
        {$currentActivity.title}
        <button
          type="button"
          class="btn-close btn-sm"
          aria-label="Close"
          on:click={closeActivity}
        />
      </div>
    {/if}
  </div>
  {#if $currentUser !== null}
    <div class="collection_box col-auto">
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
    flex: 0;
    font-size: 110%;
    padding-top: 0.5rem;
    background-color: $pageBarBackgroundColor;
    padding: 0 $horizontalMargin;
    border-bottom: 1px solid $pageBarBorderColor;
  }

  .title_box {
    margin-bottom: -1px;
    background-color: $activityAreaBackgroudColor;
    border-top-left-radius: $border-radius;
    border-top-right-radius: $border-radius;
    border: 1px solid $pageBarBorderColor;
    border-bottom: none;
  }

  .title_box div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 0.2rem 0.8rem 0.15rem 0.8rem;
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
