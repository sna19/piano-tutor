<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { LEVELS } from '#lib/content/levels.js';

	let { data } = $props();
	let error = $state<string | null>(null);
	const TRACKS = [
		{ key: 'classical', label: 'Классика' },
		{ key: 'jazz', label: 'Джаз' },
		{ key: 'blues', label: 'Блюз' },
		{ key: 'pop', label: 'Поп' }
	];

	async function save(patch: Record<string, unknown>) {
		error = null;
		const r = await fetch('/api/settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
		if (!r.ok) error = (await r.json().catch(() => ({}))).message ?? 'Не сохранилось';
		await invalidateAll();
	}
	function toggleTrack(k: string) {
		const t = data.settings.tracks.includes(k) ? data.settings.tracks.filter((x) => x !== k) : [...data.settings.tracks, k];
		if (t.length) save({ tracks: t });
	}
</script>

<svelte:head><title>Настройки · Пианино</title></svelte:head>

<a class="muted small" href="/">‹ Сегодня</a>
<h1>Настройки</h1>
{#if error}<p class="err">{error}</p>{/if}

<h2>Мой уровень</h2>
<p class="muted small">От уровня зависят пьесы, задания на день и программа. Уровни устроены как семестры колледжа; ориентир — класс музыкальной школы.</p>
<ul class="levels">
	{#each LEVELS as l (l.n)}
		<li>
			<button class="card" class:on={data.settings.level === l.n} aria-pressed={data.settings.level === l.n} onclick={() => save({ level: l.n })}>
				<span class="top"><b>{l.n}. {l.title}</b><span class="muted small">{l.grade}</span></span>
				<span class="small">{l.can}</span>
			</button>
		</li>
	{/each}
</ul>

<h2>Направления</h2>
<div class="chips">
	{#each TRACKS as t (t.key)}
		<button class="chip" class:on={data.settings.tracks.includes(t.key)} aria-pressed={data.settings.tracks.includes(t.key)} onclick={() => toggleTrack(t.key)}>{t.label}</button>
	{/each}
</div>

<h2>Обычная длина занятия</h2>
<div class="chips">
	{#each [15, 30, 45, 60, 90] as m (m)}
		<button class="chip" class:on={data.settings.minutes === m} onclick={() => save({ minutes: m })}>{m} мин</button>
	{/each}
</div>

<style>
	.levels {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.levels button {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: left;
		border: 2px solid transparent;
		cursor: pointer;
	}
	.levels button.on {
		border-color: var(--accent);
	}
	.top {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		align-items: baseline;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.err {
		color: var(--bad);
	}
</style>
