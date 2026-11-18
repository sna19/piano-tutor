<script lang="ts">
	import { page } from '$app/state';
	import { PIECES, keyName, pieceText } from '#lib/content/pieces.js';
	import { lang, t } from '#lib/i18n.js';
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
				(!q.trim() || `${p.title} ${p.original} ${p.catalog} ${p.collection} ${pieceText(p, 'en').collection}`.toLowerCase().includes(q.trim().toLowerCase()))
		)
	);
</script>

<svelte:head><title>{t('pieces.title')} · {t('app.name')}</title></svelte:head>

<header class="hd"><h1>{t('pieces.title')}</h1><a class="chip" href="/pieces/mine">{t('pieces.mine')}</a></header>
<p class="muted small">{t('pieces.intro', { n: PIECES.length, lv: data.settings.level })}</p>

<input class="search" type="search" placeholder={t('pieces.search')} bind:value={q} aria-label={t('search')} />

<div class="chips" role="group" aria-label={t('level')}>
	<button class="chip" class:on={level === null} onclick={() => ((level = null), (collection = null))}>{t('pieces.all')}</button>
	{#each LEVELS as l (l.n)}
		<button class="chip" class:on={level === l.n} onclick={() => ((level = l.n), (collection = null))}>{l.n}{l.n === data.settings.level ? ` · ${t('pieces.mineLevel')}` : ''}</button>
	{/each}
</div>
{#if collections.length > 1}
	<div class="chips" role="group" aria-label={t('collection')}>
		<button class="chip" class:on={collection === null} onclick={() => (collection = null)}>{t('pieces.allCollections')}</button>
		{#each collections as c (c)}
			<button class="chip" class:on={collection === c} onclick={() => (collection = c)}>{lang() === 'en' ? pieceText({ ...PIECES[0], collection: c }, 'en').collection : c}</button>
		{/each}
	</div>
{/if}

<ul class="list">
	{#each list as p (p.id)}
		{@const pt = pieceText(p, lang())}
		<li>
			<a href="/pieces/{p.id}" class="card">
				<span class="top"><b>{pt.title}</b><span class="lv">{p.level}</span></span>
				<span class="muted small">{p.catalog} · {keyName(p.key, lang())} · {p.meter} · {pt.collection}{p.draft ? ` · ${t('draft')}` : ''}</span>
			</a>
		</li>
	{:else}
		<li class="muted">{t('pieces.none')}</li>
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
