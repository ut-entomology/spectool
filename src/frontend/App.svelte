<script>
	import router from "page";

	import LoginPage from "./pages/Login.svelte";

	let page;
	let params;

	router("/", () => (page = LoginPage));
	router.start();
</script>

<svelte:component this={page} {params} />
