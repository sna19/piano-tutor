<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import 'abcjs/abcjs-audio.css';
	import { t } from './i18n.js';

	/**
	 * The notes of a piece on screen with sound (abcjs): drawn to the width of the screen, bars per line by the
	 * zoom; played with a piano sound — tempo, both hands or one, loop; the notes being played light up.
	 */
	interface Props {
		abc: string;
		/** starting tempo in % of the written one */
		warp?: number;
	}
	let { abc, warp = 100 }: Props = $props();

	let paper: HTMLDivElement;
	let audio: HTMLDivElement;
	let zoom = $state(3); // bars per line on a phone; more on wide screens
	let hands = $state<'both' | 'rh' | 'lh'>('both');
	let problem = $state<string | null>(null);
	let ready = $state(false);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let abcjs: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let visual: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let ctrl: any;
	let lit: Element[] = [];
	// 0.1 s of silence, WAV 8 kHz mono
	const SILENCE = (() => {
		const n = 800;
		const b = new Uint8Array(44 + n);
		const v = new DataView(b.buffer);
		const w = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
		w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
		v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
		b.fill(128, 44);
		let s = '';
		for (const x of b) s += String.fromCharCode(x);
		return 'data:audio/wav;base64,' + btoa(s);
	})();

	/** V: lines of the header in order — abcjs numbers voices this way */
	const voiceNames = $derived([...abc.matchAll(/^V:(\S+)\s+clef=/gm)].map((m) => m[1]));
	const hasHands = $derived(voiceNames.some((v) => v.startsWith('RH')) && voiceNames.some((v) => v.startsWith('LH')));

	function voicesOff(): number[] {
		if (hands === 'both') return [];
		const keep = hands === 'rh' ? 'RH' : 'LH';
		return voiceNames.map((v, i) => (v.startsWith(keep) ? -1 : i)).filter((i) => i >= 0);
	}

	const cursor = {
		onStart() {
			unlight();
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onEvent(ev: any) {
			unlight();
			if (!ev?.elements) return;
			for (const group of ev.elements) for (const el of group) {
				el.classList.add('playing');
				lit.push(el);
			}
			// keep the played line in sight
			const first = ev.elements[0]?.[0] as Element | undefined;
			if (first) {
				const r = first.getBoundingClientRect();
				if (r.top < 80 || r.bottom > window.innerHeight - 160) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
			}
		},
		onFinished() {
			unlight();
		}
	};
	function unlight() {
		for (const el of lit) el.classList.remove('playing');
		lit = [];
	}

	function draw() {
		if (!abcjs || !paper) return;
		const width = paper.clientWidth;
		const perLine = Math.max(1, Math.round((width / 390) * zoom));
		visual = abcjs.renderAbc(paper, abc, {
			add_classes: true,
			responsive: 'resize',
			foregroundColor: 'currentColor',
			staffwidth: Math.max(260, width - 16),
			wrap: { minSpacing: 1.5, maxSpacing: 2.8, preferredMeasuresPerLine: perLine },
			scale: width < 500 ? 0.9 : 1,
			paddingleft: 0,
			paddingright: 0,
			jazzchords: true
		})[0];
	}

	async function load() {
		if (!ctrl) return;
		try {
			await ctrl.setTune(visual, false, { voicesOff: voicesOff(), chordsOff: true, program: 0 });
			ctrl.setWarp?.(warp);
			ready = true;
		} catch (e) {
			problem = `${t('score.audioFail')}: ${(e as Error).message ?? e}`;
		}
	}

	let resizeTimer: ReturnType<typeof setTimeout>;
	function onResize() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(async () => {
			draw();
			await load();
		}, 250);
	}

	/**
	 * iPhone: Web Audio is silenced by the ring/silent switch. Safari 17+ lets the page say it plays media
	 * (audioSession «playback»); older iOS switch to that mode once an <audio> element plays — a silent one,
	 * on the first tap.
	 */
	function unmuteIos() {
		try {
			const s = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
			if (s) s.type = 'playback';
		} catch {
			/* not supported */
		}
		const unlock = () => {
			const a = new Audio(SILENCE);
			a.setAttribute('playsinline', '');
			a.play().catch(() => {});
			window.removeEventListener('touchend', unlock, true);
			window.removeEventListener('click', unlock, true);
		};
		window.addEventListener('touchend', unlock, true);
		window.addEventListener('click', unlock, true);
	}

	onMount(async () => {
		unmuteIos();
		abcjs = (await import('abcjs')).default;
		draw();
		if (abcjs.synth.supportsAudio()) {
			ctrl = new abcjs.synth.SynthController();
			ctrl.load(audio, cursor, { displayLoop: true, displayRestart: true, displayPlay: true, displayProgress: true, displayWarp: true });
			await load();
		} else problem = t('score.noAudio');
		window.addEventListener('resize', onResize);
	});
	onDestroy(() => {
		if (typeof window !== 'undefined') window.removeEventListener('resize', onResize);
		ctrl?.pause?.();
	});

	async function setZoom(d: number) {
		zoom = Math.min(6, Math.max(1, zoom + d));
		draw();
		await load();
	}
	async function setHands(h: typeof hands) {
		hands = h;
		ctrl?.pause?.();
		await load();
	}
</script>

<div class="tools">
	{#if hasHands}
		<div class="seg" role="radiogroup" aria-label={t('score.hands')}>
			<button class="chip" class:on={hands === 'both'} role="radio" aria-checked={hands === 'both'} onclick={() => setHands('both')}>{t('score.both')}</button>
			<button class="chip" class:on={hands === 'rh'} role="radio" aria-checked={hands === 'rh'} onclick={() => setHands('rh')}>{t('score.rh')}</button>
			<button class="chip" class:on={hands === 'lh'} role="radio" aria-checked={hands === 'lh'} onclick={() => setHands('lh')}>{t('score.lh')}</button>
		</div>
	{/if}
	<div class="seg" aria-label={t('score.zoom')}>
		<button class="chip" aria-label={t('score.bigger')} onclick={() => setZoom(-1)}>A+</button>
		<button class="chip" aria-label={t('score.smaller')} onclick={() => setZoom(1)}>A−</button>
	</div>
</div>
<div class="audio" bind:this={audio}></div>
{#if problem}<p class="err">{problem}</p>{:else if !ready}<p class="muted small">{t('score.loading')}</p>{/if}
<p class="muted small hint">{t('score.hint')}</p>
<div class="paper" bind:this={paper}></div>

<style>
	.tools {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 8px;
		margin: 8px 0;
	}
	.seg {
		display: flex;
		gap: 6px;
	}
	.audio {
		position: sticky;
		top: env(safe-area-inset-top);
		z-index: 5;
		margin: 0 -4px;
	}
	.audio :global(.abcjs-inline-audio) {
		height: 44px;
		border-radius: 12px;
		background: var(--text);
		color: var(--bg);
	}
	.audio :global(.abcjs-inline-audio .abcjs-btn) {
		width: 36px;
		height: 36px;
	}
	.paper {
		margin-top: 8px;
		padding: 8px;
		border-radius: var(--r2);
		background: var(--surface);
		color: var(--text);
		overflow-x: hidden;
	}
	.paper :global(.playing) {
		fill: var(--accent);
		stroke: var(--accent);
	}
	.hint {
		margin: 6px 0 0;
	}
	.err {
		color: var(--bad);
	}
</style>
