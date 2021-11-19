<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  const FLY_IN_Y = -50;
  const FLY_IN_DURATION = 300;
  const BACKDROP_FADE_DURATION = 150;

  export let dialogClasses = '';
  export let contentClasses = '';

  let _triggeringElement: Element | null;
  try {
    _triggeringElement = document.activeElement;
  } catch (err) {
    _triggeringElement = null;
  }
  document.body.classList.add('modal-open');

  onDestroy(() => {
    if (document.body.classList.contains('modal-open')) {
      document.body.classList.remove('modal-open');
    }
    if (_triggeringElement && _triggeringElement instanceof HTMLElement) {
      if (typeof _triggeringElement.focus === 'function') {
        _triggeringElement.focus();
      }
      _triggeringElement = null;
    }
  });
</script>

<div class="modal fade show" role="dialog" style="display: block">
  <div
    class="modal-dialog {dialogClasses}"
    role="document"
    in:fly={{ y: FLY_IN_Y, duration: FLY_IN_DURATION }}
    out:fly={{ y: FLY_IN_Y, duration: FLY_IN_DURATION, easing: quintOut }}
  >
    <div class="modal-content {contentClasses}">
      <slot />
    </div>
  </div>
</div>
<div
  class="modal-backdrop show"
  transition:fade={{ duration: BACKDROP_FADE_DURATION }}
/>
