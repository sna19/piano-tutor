<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { LEVELS } from '#lib/content/levels.js';
	import { t, tr } from '#lib/i18n.js';

	/**
	 * Placement: from level 1 up, «можете ли вы…» by what each level expects. The first «нет» is the level to work
	 * on; all «да» — level 8.
	 */
	let answers = $state<(boolean | null)[]>(LEVELS.map(() => null));
	const firstNo = $derived(answers.findIndex((a) => a === false));
	const allYes = $derived(answers.every((a) => a === true));
	const result = $derived(firstNo >= 0 ? LEVELS[firstNo].n : allYes ? 8 : null);
	const current = $derived(firstNo >= 0 ? firstNo + 1 : answers.findIndex((a) => a === null));

	async function apply() {
		if (!result) return;
		await fetch('/api/settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ level: result }) });
		await invalidateAll();
		goto('/program');
	}
</script>

<svelte:head><title>{t('check.title')} · {t('app.name')}</title></svelte:head>

<a class="muted small" href="/settings">{t('check.back')}</a>
<h1>{t('check.title')}</h1>
<p class="muted small">{t('check.intro')}</p>

<ol class="qs">
	{#each LEVELS as l, i (l.n)}
		{#if i <= current || answers[i] !== null}
			<li class="card">
				<span class="small muted">{t('level')} {l.n} · {tr(l.title)}</span>
				<span>{tr(l.can)}</span>
				<div class="btns">
					<button class="chip" class:on={answers[i] === true} onclick={() => (answers[i] = true)}>{t('check.yes')}</button>
					<button class="chip" class:on={answers[i] === false} onclick={() => { answers[i] = false; for (let k = i + 1; k < answers.length; k++) answers[k] = null; }}>{t('check.no')}</button>
				</div>
			</li>
		{/if}
	{/each}
</ol>

{#if result}
	<div class="card res">
		<p>{t('check.result')} <b>{result}. {tr(LEVELS[result - 1].title)}</b>.</p>
		<button class="btn" onclick={apply}>{t('check.apply', { n: result })}</button>
	</div>
{/if}

<style>
	.qs {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.qs li {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.btns {
		display: flex;
		gap: 6px;
	}
	.res {
		margin-top: 12px;
	}
</style>
