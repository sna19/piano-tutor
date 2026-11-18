<script lang="ts">
	import Score from '#lib/Score.svelte';
	import StatusButton from '#lib/StatusButton.svelte';
	import { AREAS, TRACK_TITLE, lessonText } from '#lib/content/program.js';
	import { pieceById, pieceText } from '#lib/content/pieces.js';
	import { exerciseAbc, exerciseTitle } from '#lib/content/exercises.js';
	import { lang, t, tr } from '#lib/i18n.js';

	let { data } = $props();
	const l = $derived(data.lesson);
	const lt = $derived(lessonText(l, lang()));
	const exercises = $derived(l.materials.filter((m) => m.startsWith('ex:')));
	const pieces = $derived(l.materials.filter((m) => m.startsWith('piece:')).map((m) => pieceById(m.slice(6))!).filter(Boolean));
	let shown = $state<string | null>(null);
	$effect(() => {
		// the first exercise is open at once
		if (shown === null || !exercises.includes(shown)) shown = exercises[0] ?? null;
	});
</script>

<svelte:head><title>{lt.title} · {t('app.name')}</title></svelte:head>

<a class="muted small back" href="/program?level={l.level}">{t('lesson.back', { n: l.level })}</a>
<header>
	<h1>{lt.title}</h1>
	<StatusButton ref="lesson:{l.id}" status={data.progress[`lesson:${l.id}`]} />
</header>
<p class="muted small">{tr(AREAS.find((a) => a.key === l.area)!.title)} · {tr(TRACK_TITLE[l.track])} · {l.minutes} {t('lesson.perDay')}</p>
<p class="goal">{lt.goal}</p>

<h2>{t('lesson.todo')}</h2>
<ol class="tasks">
	{#each lt.tasks as x (x)}<li>{x}</li>{/each}
</ol>
<p class="card done"><b>{t('lesson.doneWhen')}</b> {lt.done}</p>

{#if pieces.length}
	<h2>{t('lesson.pieces')}</h2>
	<ul class="plist">
		{#each pieces as p (p.id)}
			{@const pt = pieceText(p, lang())}
			<li><a class="card" href="/pieces/{p.id}"><b>{pt.title}</b> <span class="muted small">{p.catalog} · {pt.collection}</span></a></li>
		{/each}
	</ul>
{/if}

{#if exercises.length}
	<h2>{t('lesson.exercises')}</h2>
	<div class="chips">
		{#each exercises as e (e)}
			<button class="chip" class:on={shown === e} onclick={() => (shown = e)}>{exerciseTitle(e, lang())}</button>
		{/each}
	</div>
	{#if shown}
		{#key `${shown}|${lang()}`}
			<Score abc={exerciseAbc(shown, lang()) ?? ''} />
		{/key}
	{/if}
{/if}

<style>
	.back {
		text-decoration: none;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
	}
	.goal {
		font-size: 17px;
	}
	.tasks {
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.done {
		margin: 12px 0;
	}
	.plist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.plist a {
		display: block;
		text-decoration: none;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 8px;
	}
</style>
