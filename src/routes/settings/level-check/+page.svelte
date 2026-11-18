<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { LEVELS } from '#lib/content/levels.js';

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

<svelte:head><title>Проверка уровня · Пианино</title></svelte:head>

<a class="muted small" href="/settings">‹ Настройки</a>
<h1>Проверка уровня</h1>
<p class="muted small">Отвечайте честно: «да» — если это получается уже сейчас, без долгой подготовки. Уровень — первый, где ответ «нет»: на нём и стоит работать.</p>

<ol class="qs">
	{#each LEVELS as l, i (l.n)}
		{#if i <= current || answers[i] !== null}
			<li class="card">
				<span class="small muted">Уровень {l.n} · {l.title}</span>
				<span>{l.can}</span>
				<div class="btns">
					<button class="chip" class:on={answers[i] === true} onclick={() => (answers[i] = true)}>Да, могу</button>
					<button class="chip" class:on={answers[i] === false} onclick={() => { answers[i] = false; for (let k = i + 1; k < answers.length; k++) answers[k] = null; }}>Пока нет</button>
				</div>
			</li>
		{/if}
	{/each}
</ol>

{#if result}
	<div class="card res">
		<p>Ваш уровень — <b>{result}. {LEVELS[result - 1].title}</b>.</p>
		<button class="btn" onclick={apply}>Поставить уровень {result}</button>
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
