<script lang="ts">
	import { LEVELS } from '#lib/content/levels.js';
	import { PIECES } from '#lib/content/pieces.js';
	let { data } = $props();
</script>

<svelte:head><title>Программа · Пианино</title></svelte:head>

<h1>Программа</h1>
<p class="muted small">Восемь уровней, как семестры колледжа. В каждом — курсы: техника, теория и гармония, слух, репертуар, импровизация. Уроки и критерии «готово» по каждому курсу появятся на следующем этапе; пока — уровни и пьесы для них.</p>

<ol class="levels">
	{#each LEVELS as l (l.n)}
		{@const n = PIECES.filter((p) => p.level === l.n).length}
		<li class="card" class:mine={l.n === data.settings.level}>
			<span class="top"><b>{l.n}. {l.title}</b>{#if l.n === data.settings.level}<span class="tag">мой уровень</span>{/if}</span>
			<span class="small">{l.can}</span>
			<span class="muted small">{l.grade}{n ? ` · ` : ''}{#if n}<a href="/pieces?level={l.n}">пьес: {n}</a>{/if}</span>
		</li>
	{/each}
</ol>

<style>
	.levels {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.levels li {
		display: flex;
		flex-direction: column;
		gap: 4px;
		border: 2px solid transparent;
	}
	.levels li.mine {
		border-color: var(--accent);
	}
	.top {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
	.tag {
		font-size: 12px;
		color: var(--accent);
		font-weight: 600;
	}
</style>
