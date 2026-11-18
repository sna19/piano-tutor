<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import { PIECES } from '#lib/content/pieces.js';
	import { levelOf } from '#lib/content/levels.js';
	let { data } = $props();
	const lv = $derived(levelOf(data.settings.level));
	const mine = $derived(PIECES.filter((p) => p.level === data.settings.level && !p.draft));
	// a piece of the day, the same all day
	const day = new Date().toISOString().slice(0, 10);
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

<section class="card soon">
	<h2>Скоро здесь</h2>
	<p class="small">План занятия на выбранное время: разминка и техника, теория, пьеса, импровизация под backing track, слух — по вашему уровню. Порядок работ — в «Программе».</p>
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
	.soon h2 {
		margin-top: 0;
	}
</style>
