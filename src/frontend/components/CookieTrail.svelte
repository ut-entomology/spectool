<script lang="ts">
  export let pageTitle: string;
</script>

<div class="cookie_trail">
  <div class="back"><a href="/">&laquo;</a></div>
  <div class="text">| <span class="title">{pageTitle}</span></div>
</div>

<style>
  .cookie_trail {
    width: 100%;
    font-size: 120%;
    color: #aaa;
    display: flex;
    flex-flow: row nowrap;
  }

  .back {
    font-size: 160%;
    font-weight: bold;
    padding-right: 0.3em;
  }

  .text {
    padding-top: 9px;
  }

  .title {
    color: black;
  }
</style>
