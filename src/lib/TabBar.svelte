<script lang="ts">
	import { page } from '$app/state';
	import Sun from '@lucide/svelte/icons/sun';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Music from '@lucide/svelte/icons/music';
	import AudioLines from '@lucide/svelte/icons/audio-lines';
	import BookOpen from '@lucide/svelte/icons/book-open';

	const TABS = [
		{ href: '/', label: 'Сегодня', icon: Sun },
		{ href: '/program', label: 'Программа', icon: GraduationCap },
		{ href: '/pieces', label: 'Ноты', icon: Music },
		{ href: '/improv', label: 'Импровизация', icon: AudioLines },
		{ href: '/book', label: 'Учебник', icon: BookOpen }
	];
	const on = (href: string) => (href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href));
</script>

<nav aria-label="Разделы">
	{#each TABS as t (t.href)}
		<a href={t.href} class:on={on(t.href)} aria-current={on(t.href) ? 'page' : undefined}>
			<t.icon size={22} />
			<span>{t.label}</span>
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
