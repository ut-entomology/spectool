<script lang="ts">
  import { statusMessage } from '../stores/statusMessage';
</script>

<div class="status_bar">
  <div class="content">{$statusMessage}</div>
</div>

<style lang="scss">
  @import '../global.scss';

  .status_bar {
    flex: 0;
    width: 100%;
    background-color: $pageBarBackgroundColor;
    padding: 0.4em 0;
  }

  .content {
    position: relative;
    margin: 0 $horizontalMargin;
    font-size: 90%;
    height: 1em;
    text-align: right;
  }
</style>
