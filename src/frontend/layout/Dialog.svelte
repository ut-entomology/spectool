<script lang="ts">
  export let title: string;
</script>

<div class="dialog">
  <div class="row">
    <h2 class="col">{title}</h2>
  </div>
  <slot />
</div>
