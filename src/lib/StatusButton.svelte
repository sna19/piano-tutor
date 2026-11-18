<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { t } from './i18n.js';

	/** The mark of a lesson or a piece: a tap goes none → в работе → готово → none. */
	let { ref, status }: { ref: string; status: 'learning' | 'done' | undefined } = $props();
	const NEXT = { none: 'learning', learning: 'done', done: null } as const;
	const LABEL = $derived({ none: t('st.none'), learning: t('st.learning'), done: t('st.done') });
	let busy = $state(false);
	async function tap(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		busy = true;
		await fetch('/api/progress', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ref, status: NEXT[status ?? 'none'] }) });
		await invalidateAll();
		busy = false;
	}
</script>

<button class="st {status ?? 'none'}" disabled={busy} onclick={tap} aria-label="{t('st.mark')}: {LABEL[status ?? 'none']}">{LABEL[status ?? 'none']}</button>

<style>
	.st {
		flex: none;
		min-height: 32px;
		padding: 0 12px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: none;
		font-size: 13px;
		cursor: pointer;
		white-space: nowrap;
	}
	.st.learning {
		border-color: var(--accent);
		color: var(--accent);
		font-weight: 600;
	}
	.st.done {
		background: var(--good);
		border-color: var(--good);
		color: #fff;
	}
</style>
