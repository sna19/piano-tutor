<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import { PIECES, pieceText } from '#lib/content/pieces.js';
	import { levelOf } from '#lib/content/levels.js';
	import { lessonsOf, lessonText } from '#lib/content/program.js';
	import StatusButton from '#lib/StatusButton.svelte';
	import LangSwitch from '#lib/LangSwitch.svelte';
	import { lang, t, tr } from '#lib/i18n.js';

	let { data } = $props();
	const lv = $derived(levelOf(data.settings.level));
	const mine = $derived(PIECES.filter((p) => p.level === data.settings.level && !p.draft));
	// a piece of the day, the same all day
	const day = new Date().toISOString().slice(0, 10);
	const lessons = $derived(lessonsOf(data.settings.level, data.settings.tracks));
	const working = $derived(lessons.filter((l) => data.progress[`lesson:${l.id}`] === 'learning'));
	const next = $derived(lessons.find((l) => !data.progress[`lesson:${l.id}`]));
	const pick = $derived(mine.length ? mine[[...day].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % mine.length] : null);
</script>

<svelte:head><title>{t('today.title')} · {t('app.name')}</title></svelte:head>

<header>
	<h1>{t('today.title')}</h1>
	<span class="tools">
		<LangSwitch />
		<a href="/settings" aria-label={t('settings')} class="gear"><Settings size={22} /></a>
	</span>
</header>
<p class="muted">{t('today.level', { n: lv.n, title: tr(lv.title), m: data.settings.minutes })}</p>

{#if pick}
	{@const pt = pieceText(pick, lang())}
	<a class="card piece" href="/pieces/{pick.id}">
		<span class="muted small">{t('today.piece')}</span>
		<b>{pt.title}</b>
		<span class="muted small">{pick.catalog} · {pt.collection}</span>
	</a>
{/if}

{#if working.length || next}
	<h2>{t('today.lessons')}</h2>
	<ul class="ls">
		{#each [...working, ...(next ? [next] : [])] as l (l.id)}
			{@const lt = lessonText(l, lang())}
			<li>
				<a class="card row" href="/program/{l.id}">
					<span class="txt"><b>{lt.title}</b><span class="muted small">{l.minutes} {t('min')} · {lt.goal}</span></span>
					<StatusButton ref="lesson:{l.id}" status={data.progress[`lesson:${l.id}`]} />
				</a>
			</li>
		{/each}
	</ul>
{/if}

<section class="card soon">
	<h2>{t('today.soon')}</h2>
	<p class="small">{t('today.soonText')}</p>
</section>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.tools {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.gear {
		display: inline-flex;
		width: 44px;
		height: 44px;
		align-items: center;
		justify-content: center;
	}
	.piece {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 12px 0;
		text-decoration: none;
	}
	.ls {
		list-style: none;
		margin: 0 0 12px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
	}
	.txt {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.soon h2 {
		margin-top: 0;
	}
</style>
