<script lang="ts">
	import Score from '#lib/Score.svelte';
	import { keyName } from '#lib/content/pieces.js';
	let { data } = $props();
	const p = $derived(data.piece);
</script>

<svelte:head><title>{p.title} · Пианино</title></svelte:head>

<a class="back muted small" href="/pieces">‹ Ноты</a>
<h1>{p.title}</h1>
<p class="muted small">{p.composer.includes('Siloti') ? 'И. С. Бах — А. Зилоти' : 'И. С. Бах'} · {p.catalog} · {keyName(p.key)} · {p.meter} · уровень {p.level} · {p.collection}</p>
{#if p.remarks.length}
	<ul class="remarks small">
		{#each p.remarks as r (r)}<li>{r}</li>{/each}
	</ul>
{/if}

{#key p.id}
	<Score abc={data.abc} />
{/key}

<p class="muted small src">
	Источник: <a href={p.source.url} target="_blank" rel="noopener">{p.source.name}</a>{p.source.edition ? ` (${p.source.edition})` : ''} · {p.source.license}. {p.source.name === 'Mutopia Project' ? 'Ноты переведены из MIDI издания и сверены с ним нота в ноту.' : 'Ноты набраны со скана издания.'}
</p>

<style>
	.back {
		text-decoration: none;
	}
	.remarks {
		margin: 4px 0;
		padding-left: 18px;
		color: var(--muted);
	}
	.src {
		margin-top: 16px;
	}
</style>
