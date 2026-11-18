<script lang="ts">
	import { page } from '$app/state';
	import { LEVELS } from '#lib/content/levels.js';
	import { AREAS, TRACK_TITLE, lessonsOf, lessonText } from '#lib/content/program.js';
	import StatusButton from '#lib/StatusButton.svelte';
	import { lang, t, tr } from '#lib/i18n.js';

	let { data } = $props();
	// svelte-ignore state_referenced_locally
	let level = $state(Number(page.url.searchParams.get('level')) || data.settings.level);
	const lv = $derived(LEVELS.find((l) => l.n === level)!);
	const lessons = $derived(lessonsOf(level, data.settings.tracks));
	const done = $derived(lessons.filter((l) => data.progress[`lesson:${l.id}`] === 'done').length);
</script>

<svelte:head><title>{t('program.title')} · {t('app.name')}</title></svelte:head>

<h1>{t('program.title')}</h1>
<p class="muted small">{t('program.intro')}</p>

<div class="chips" role="tablist" aria-label={t('level')}>
	{#each LEVELS as l (l.n)}
		<button class="chip" class:on={level === l.n} role="tab" aria-selected={level === l.n} onclick={() => (level = l.n)}>{l.n}{l.n === data.settings.level ? ` · ${t('pieces.mineLevel')}` : ''}</button>
	{/each}
</div>

<section class="card head">
	<b>{lv.n}. {tr(lv.title)}</b>
	<span class="small">{tr(lv.can)}</span>
	<span class="muted small">{tr(lv.grade)} · {t('program.done', { d: done, n: lessons.length })}</span>
	<div class="bar" style="--p:{lessons.length ? (done / lessons.length) * 100 : 0}%"></div>
</section>

{#each AREAS as a (a.key)}
	{@const ls = lessons.filter((l) => l.area === a.key)}
	{#if ls.length}
		<h2>{tr(a.title)}</h2>
		<ul class="list">
			{#each ls as l (l.id)}
				{@const lt = lessonText(l, lang())}
				<li>
					<a class="card row" href="/program/{l.id}">
						<span class="txt">
							<b>{lt.title}</b>
							<span class="muted small">{lt.goal}{l.track !== 'core' ? ` · ${tr(TRACK_TITLE[l.track])}` : ''} · {l.minutes} {t('min')}</span>
						</span>
						<StatusButton ref="lesson:{l.id}" status={data.progress[`lesson:${l.id}`]} />
					</a>
				</li>
			{/each}
		</ul>
	{/if}
{/each}

<p class="muted small foot"><a href="/settings/level-check">{t('program.check')}</a> · {t('program.changeIn')} <a href="/settings">{t('program.settingsLink')}</a>.</p>

<style>
	.chips {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
		margin: 10px 0;
	}
	.chips .chip {
		flex: none;
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.bar {
		height: 6px;
		border-radius: 3px;
		background: linear-gradient(90deg, var(--good) var(--p), var(--surface2) var(--p));
		margin-top: 4px;
	}
	.list {
		list-style: none;
		margin: 0;
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
	.foot {
		margin-top: 20px;
	}
</style>
