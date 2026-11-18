<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import FileText from '@lucide/svelte/icons/file-text';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let { data } = $props();
	let title = $state('');
	let input: HTMLInputElement;
	let busy = $state(false);
	let problem = $state<string | null>(null);

	async function upload() {
		const f = input.files?.[0];
		if (!f) return (problem = 'Выберите PDF');
		busy = true;
		problem = null;
		const form = new FormData();
		form.append('file', f);
		form.append('title', title);
		const r = await fetch('/api/library', { method: 'POST', body: form }).catch(() => null);
		busy = false;
		if (!r?.ok) return (problem = (await r?.json().catch(() => null))?.message ?? 'Не загрузилось');
		title = '';
		input.value = '';
		await invalidateAll();
	}
	async function remove(id: number, t: string) {
		if (!confirm(`Удалить «${t}» из моих нот?`)) return;
		await fetch(`/api/library/${id}`, { method: 'DELETE' });
		await invalidateAll();
	}
	const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} МБ`;
</script>

<svelte:head><title>Мои ноты · Пианино</title></svelte:head>

<a class="muted small" href="/pieces">‹ Ноты</a>
<h1>Мои ноты</h1>
<p class="muted small">Свои PDF — например, купленные ноты. Файлы хранятся только на вашем NAS (в /data) и никуда не выкладываются. Тап — открыть на весь экран.</p>

<div class="card up">
	<input bind:this={input} type="file" accept="application/pdf,.pdf" aria-label="PDF-файл" />
	<input class="t" bind:value={title} placeholder="Название (необязательно)" />
	<button class="btn" disabled={busy} onclick={upload}>{busy ? 'Загружаю…' : 'Добавить'}</button>
	{#if problem}<p class="err">{problem}</p>{/if}
</div>

<ul class="list">
	{#each data.files as f (f.id)}
		<li class="card row">
			<a href="/api/library/{f.id}" target="_blank" rel="noopener" class="open"><FileText size={22} /><span><b>{f.title}</b><span class="muted small">{mb(f.size)}</span></span></a>
			<button class="del" aria-label="Удалить {f.title}" onclick={() => remove(f.id, f.title)}><Trash2 size={18} /></button>
		</li>
	{:else}
		<li class="muted">Пока пусто.</li>
	{/each}
</ul>

<style>
	.up {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 12px 0;
	}
	.t {
		min-height: var(--tap);
		padding: 0 12px;
		border: 1px solid var(--line);
		border-radius: var(--r1);
		background: var(--bg);
		color: var(--text);
		font: inherit;
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
		gap: 8px;
	}
	.open {
		flex: 1;
		display: flex;
		gap: 10px;
		align-items: center;
		text-decoration: none;
	}
	.open span {
		display: flex;
		flex-direction: column;
	}
	.del {
		width: 44px;
		height: 44px;
		border: none;
		background: none;
		color: var(--muted);
		cursor: pointer;
	}
	.err {
		color: var(--bad);
	}
</style>
