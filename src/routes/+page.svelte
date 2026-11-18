<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import { PIECES } from '#lib/content/pieces.js';
	import { levelOf } from '#lib/content/levels.js';
	import { lessonsOf } from '#lib/content/program.js';
	import StatusButton from '#lib/StatusButton.svelte';
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

<svelte:head><title>Сегодня · Пианино</title></svelte:head>

<header>
	<h1>Сегодня</h1>
	<a href="/settings" aria-label="Настройки" class="gear"><Settings size={22} /></a>
</header>
<p class="muted">Уровень {lv.n} · {lv.title}. Занятие {data.settings.minutes} мин.</p>

{#if pick}
	<a class="card piece" href="/pieces/{pick.id}">
		<span class="muted small">Пьеса дня</span>
		<b>{pick.title}</b>
		<span class="muted small">{pick.catalog} · {pick.collection}</span>
	</a>
{/if}

{#if working.length || next}
	<h2>Уроки</h2>
	<ul class="ls">
		{#each [...working, ...(next ? [next] : [])] as l (l.id)}
			<li>
				<a class="card row" href="/program/{l.id}">
					<span class="txt"><b>{l.title}</b><span class="muted small">{l.minutes} мин · {l.goal}</span></span>
					<StatusButton ref="lesson:{l.id}" status={data.progress[`lesson:${l.id}`]} />
				</a>
			</li>
		{/each}
	</ul>
{/if}

<section class="card soon">
	<h2>Скоро здесь</h2>
	<p class="small">План занятия на выбранное время с таймером: разминка и техника, теория, пьеса, импровизация под backing track, слух — из уроков вашего уровня (этап 3).</p>
</section>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
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
