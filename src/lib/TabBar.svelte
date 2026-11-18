<script lang="ts">
	import { page } from '$app/state';
	import Sun from '@lucide/svelte/icons/sun';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Music from '@lucide/svelte/icons/music';
	import AudioLines from '@lucide/svelte/icons/audio-lines';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import { t, type Key } from './i18n.js';

	const TABS = [
		{ href: '/', label: 'tab.today' as Key, icon: Sun },
		{ href: '/program', label: 'tab.program' as Key, icon: GraduationCap },
		{ href: '/pieces', label: 'tab.pieces' as Key, icon: Music },
		{ href: '/improv', label: 'tab.improv' as Key, icon: AudioLines },
		{ href: '/book', label: 'tab.book' as Key, icon: BookOpen }
	];
	const on = (href: string) => (href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href));
</script>

<nav aria-label={t('sections')}>
	{#each TABS as tab (tab.href)}
		<a href={tab.href} class:on={on(tab.href)} aria-current={on(tab.href) ? 'page' : undefined}>
			<tab.icon size={22} />
			<span>{t(tab.label)}</span>
		</a>
	{/each}
</nav>

<style>
	nav {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		padding-bottom: env(safe-area-inset-bottom);
		background: color-mix(in oklab, var(--bg) 92%, transparent);
		backdrop-filter: blur(12px);
		border-top: 1px solid var(--line);
	}
	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		min-height: 52px;
		padding-top: 6px;
		font-size: 11px;
		color: var(--muted);
		text-decoration: none;
	}
	a.on {
		color: var(--text);
		font-weight: 600;
	}
</style>
