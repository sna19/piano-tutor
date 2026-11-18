<script lang="ts">
	import Score from '#lib/Score.svelte';
	import { keyName, pieceText } from '#lib/content/pieces.js';
	import { lang, t } from '#lib/i18n.js';
	let { data } = $props();
	const p = $derived(data.piece);
	const pt = $derived(pieceText(p, lang()));
	const abc = $derived(lang() === 'ru' ? data.abc : data.abc.replace(/^T:.*$/m, `T:${pt.title} · ${p.catalog}`).replace(/^C:.*$/m, `C:${p.composer.includes('Siloti') ? 'J. S. Bach — A. Siloti (after BWV 855a)' : 'J. S. Bach'}`));
	const by = $derived(p.composer.includes('Siloti') ? (lang() === 'en' ? 'J. S. Bach — A. Siloti' : 'И. С. Бах — А. Зилоти') : lang() === 'en' ? 'J. S. Bach' : 'И. С. Бах');
</script>

<svelte:head><title>{pt.title} · {t('app.name')}</title></svelte:head>

<a class="back muted small" href="/pieces">{t('piece.back')}</a>
<h1>{pt.title}</h1>
<p class="muted small">{by} · {p.catalog} · {keyName(p.key, lang())} · {p.meter} · {t('level.lc')} {p.level} · {pt.collection}</p>
{#if pt.remarks.length}
	<ul class="remarks small">
		{#each pt.remarks as r (r)}<li>{r}</li>{/each}
	</ul>
{/if}

{#key `${p.id}|${lang()}`}
	<Score {abc} />
{/key}

<p class="muted small src">
	{t('piece.source')}: <a href={p.source.url} target="_blank" rel="noopener">{p.source.name}</a>{p.source.edition ? ` (${p.source.edition})` : ''} · {p.source.license}. {p.source.name === 'Mutopia Project' ? t('piece.fromMidi') : t('piece.fromScan')}
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
