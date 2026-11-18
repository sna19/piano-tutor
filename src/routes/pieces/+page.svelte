<script lang="ts">
	import { page } from '$app/state';
	import { PIECES, keyName } from '#lib/content/pieces.js';
	import { LEVELS } from '#lib/content/levels.js';

	let { data } = $props();
	let level = $state<number | null>(null);
	let collection = $state<string | null>(null);
	let q = $state('');
	// svelte-ignore state_referenced_locally
	level = page.url.searchParams.has('all') ? null : Number(page.url.searchParams.get('level')) || data.settings.level;

	const collections = $derived([...new Set(PIECES.filter((p) => level === null || p.level === level).map((p) => p.collection))]);
	const list = $derived(
		PIECES.filter(
			(p) =>
				(level === null || p.level === level) &&
				(collection === null || p.collection === collection) &&
				(!q.trim() || `${p.title} ${p.original} ${p.catalog} ${p.collection}`.toLowerCase().includes(q.trim().toLowerCase()))
		)
	);
</script>

<svelte:head><title>Ноты · Пианино</title></svelte:head>

<header class="hd"><h1>Ноты</h1><a class="chip" href="/pieces/mine">Мои ноты (PDF)</a></header>
<p class="muted small">{PIECES.length} пьес Баха из изданий в общественном достоянии. Ваш уровень — {data.settings.level}; джаз, блюз и поп появятся в следующих этапах.</p>

<input class="search" type="search" placeholder="Название, BWV, сборник" bind:value={q} aria-label="Поиск" />

<div class="chips" role="group" aria-label="Уровень">
	<button class="chip" class:on={level === null} onclick={() => ((level = null), (collection = null))}>Все</button>
	{#each LEVELS as l (l.n)}
		<button class="chip" class:on={level === l.n} onclick={() => ((level = l.n), (collection = null))}>{l.n}{l.n === data.settings.level ? ' · мой' : ''}</button>
	{/each}
</div>
{#if collections.length > 1}
	<div class="chips" role="group" aria-label="Сборник">
		<button class="chip" class:on={collection === null} onclick={() => (collection = null)}>Все сборники</button>
		{#each collections as c (c)}
			<button class="chip" class:on={collection === c} onclick={() => (collection = c)}>{c}</button>
		{/each}
	</div>
{/if}

<ul class="list">
	{#each list as p (p.id)}
		<li>
			<a href="/pieces/{p.id}" class="card">
				<span class="top"><b>{p.title}</b><span class="lv">{p.level}</span></span>
				<span class="muted small">{p.catalog} · {keyName(p.key)} · {p.meter} · {p.collection}{p.draft ? ' · черновик' : ''}</span>
			</a>
		</li>
	{:else}
		<li class="muted">Ничего не нашлось.</li>
	{/each}
</ul>

<style>
	.hd {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	.hd a {
		text-decoration: none;
	}
	.search {
		width: 100%;
		min-height: var(--tap);
		padding: 0 12px;
		border: 1px solid var(--line);
		border-radius: var(--r1);
		background: var(--surface);
		color: var(--text);
		font: inherit;
	}
	.chips {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
		margin: 10px 0 0;
	}
	.chips .chip {
		flex: none;
	}
	.list {
		list-style: none;
		margin: 12px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.list a {
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-decoration: none;
	}
	.top {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
	.lv {
		flex: none;
		min-width: 26px;
		height: 26px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--surface2);
		font-size: 13px;
		font-weight: 600;
	}
</style>
