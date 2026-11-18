<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import FileText from '@lucide/svelte/icons/file-text';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { t } from '#lib/i18n.js';

	let { data } = $props();
	let title = $state('');
	let input: HTMLInputElement;
	let busy = $state(false);
	let problem = $state<string | null>(null);

	async function upload() {
		const f = input.files?.[0];
		if (!f) return (problem = t('mine.choose'));
		busy = true;
		problem = null;
		const form = new FormData();
		form.append('file', f);
		form.append('title', title);
		const r = await fetch('/api/library', { method: 'POST', body: form }).catch(() => null);
		busy = false;
		if (!r?.ok) return (problem = (await r?.json().catch(() => null))?.message ?? t('mine.fail'));
		title = '';
		input.value = '';
		await invalidateAll();
	}
	async function remove(id: number, title: string) {
		if (!confirm(t('mine.confirm', { t: title }))) return;
		await fetch(`/api/library/${id}`, { method: 'DELETE' });
		await invalidateAll();
	}
	const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} ${t('mb')}`;
</script>

<svelte:head><title>{t('mine.title')} · {t('app.name')}</title></svelte:head>

<a class="muted small" href="/pieces">{t('piece.back')}</a>
<h1>{t('mine.title')}</h1>
<p class="muted small">{t('mine.intro')}</p>

<div class="card up">
	<input bind:this={input} type="file" accept="application/pdf,.pdf" aria-label={t('mine.file')} />
	<input class="t" bind:value={title} placeholder={t('mine.titlePh')} />
	<button class="btn" disabled={busy} onclick={upload}>{busy ? t('mine.uploading') : t('mine.add')}</button>
	{#if problem}<p class="err">{problem}</p>{/if}
</div>

<ul class="list">
	{#each data.files as f (f.id)}
		<li class="card row">
			<a href="/api/library/{f.id}" target="_blank" rel="noopener" class="open"><FileText size={22} /><span><b>{f.title}</b><span class="muted small">{mb(f.size)}</span></span></a>
			<button class="del" aria-label="{t('mine.delete')} {f.title}" onclick={() => remove(f.id, f.title)}><Trash2 size={18} /></button>
		</li>
	{:else}
		<li class="muted">{t('mine.empty')}</li>
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
