<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { LEVELS } from '#lib/content/levels.js';
	import LangSwitch from '#lib/LangSwitch.svelte';
	import { t, tr, type Key } from '#lib/i18n.js';

	let { data } = $props();
	let error = $state<string | null>(null);
	const TRACKS = ['classical', 'jazz', 'blues', 'pop'];

	async function save(patch: Record<string, unknown>) {
		error = null;
		const r = await fetch('/api/settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
		if (!r.ok) error = (await r.json().catch(() => ({}))).message ?? t('settings.saveFail');
		await invalidateAll();
	}
	function toggleTrack(k: string) {
		const t = data.settings.tracks.includes(k) ? data.settings.tracks.filter((x) => x !== k) : [...data.settings.tracks, k];
		if (t.length) save({ tracks: t });
	}
</script>

<svelte:head><title>{t('settings')} · {t('app.name')}</title></svelte:head>

<a class="muted small" href="/">{t('settings.back')}</a>
<h1>{t('settings')}</h1>

<h2>{t('settings.language')}</h2>
<LangSwitch />
{#if error}<p class="err">{error}</p>{/if}

<h2>{t('settings.level')}</h2>
<p class="muted small">{t('settings.levelText')} {t('settings.notSure')} <a href="/settings/level-check">{t('settings.check')}</a>.</p>
<ul class="levels">
	{#each LEVELS as l (l.n)}
		<li>
			<button class="card" class:on={data.settings.level === l.n} aria-pressed={data.settings.level === l.n} onclick={() => save({ level: l.n })}>
				<span class="top"><b>{l.n}. {tr(l.title)}</b><span class="muted small">{tr(l.grade)}</span></span>
				<span class="small">{tr(l.can)}</span>
			</button>
		</li>
	{/each}
</ul>

<h2>{t('settings.tracks')}</h2>
<div class="chips">
	{#each TRACKS as k (k)}
		<button class="chip" class:on={data.settings.tracks.includes(k)} aria-pressed={data.settings.tracks.includes(k)} onclick={() => toggleTrack(k)}>{t(`track.${k}` as Key)}</button>
	{/each}
</div>

<h2>{t('settings.minutes')}</h2>
<div class="chips">
	{#each [15, 30, 45, 60, 90] as m (m)}
		<button class="chip" class:on={data.settings.minutes === m} onclick={() => save({ minutes: m })}>{m} {t('min')}</button>
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
