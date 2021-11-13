<div class="big-spinner translate-middle">
  <div class="spinner-border text-warning" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>

<style lang="scss">
  @import '../values.scss';

  .big-spinner {
    position: fixed;
    z-index: 1031;
    top: $verticalMessagePosition;
    left: 50%;
  }

  .big-spinner div {
    width: 3rem;
    height: 3rem;
  }
</style>
