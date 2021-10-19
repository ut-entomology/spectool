<script lang="ts">
	import { Backend } from "./backend";

	let username: string = "";
	let password: string = "";
	let lastName: string = "";
	let names: string[] = [];
	let message: string = "";

	function getFirstNames() {
		Backend.getFirstNames(
			window,
			username,
			password,
			lastName,
			(firstNames: string[]) => {
				message = "";
				names = firstNames!;
			},
			(err: Error) => {
				names = [];
				message = err.message;
			}
		);
	}
</script>

<main>
	<label>
		username:
		<input bind:value={username} />
	</label>
	<label>
		password:
		<input bind:value={password} />
	</label>
	<label>
		last name:
		<input bind:value={lastName} />
	</label>

	<button on:click={getFirstNames}>Get First Names</button>

	<ul>
		{#each names as name}
			<li>{name}</li>
		{/each}
	</ul>

	<p>{message}</p>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
