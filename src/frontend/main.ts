import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    name2: 'world'
  }
});

export default app;
