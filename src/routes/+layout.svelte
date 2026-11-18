<script lang="ts">
	import '../app.css';
	import TabBar from '#lib/TabBar.svelte';
	let { children } = $props();
</script>

<main>
	{@render children()}
</main>
<TabBar />

<style>
	main {
		max-width: 900px;
		margin: 0 auto;
		padding: calc(env(safe-area-inset-top) + 8px) 16px calc(env(safe-area-inset-bottom) + 84px);
	}
</style>
