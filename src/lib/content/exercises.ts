/**
 * Exercises written as ABC on the fly, so they sound, light up and slow down like the pieces: scales, arpeggios,
 * cadences, ii–V–I voicings, the blues scale. A lesson refers to one by an id such as `ex:scale:G:major:2`.
 */

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NAT = [0, 2, 4, 5, 7, 9, 11];
const SHARPS = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];

export type Mode = 'major' | 'minor';

/** Key signature (number of sharps, < 0 flats) of a key like «G», «Bb», «F#m». */
const SIG: Record<string, number> = {
	C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
	Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, 'G#m': 5, 'D#m': 6, Dm: -1, Gm: -2, Cm: -3, Fm: -4, Bbm: -5, Ebm: -6
};

function keyAlter(sig: number): Record<string, number> {
	const a: Record<string, number> = Object.fromEntries(LETTERS.map((l) => [l, 0]));
	for (let i = 0; i < Math.abs(sig); i++) a[sig > 0 ? SHARPS[i] : SHARPS[6 - i]] = sig > 0 ? 1 : -1;
	return a;
}

/** «absolute letter index» (C4 = 28) → ABC letter with octave marks */
function letter(abs: number): string {
	const o = Math.floor(abs / 7);
	const l = LETTERS[((abs % 7) + 7) % 7];
	return o >= 5 ? l.toLowerCase() + "'".repeat(o - 5) : l + ','.repeat(4 - o);
}

const C4 = 28;

interface Key {
	name: string; // ABC K: value
	tonic: number; // letter index 0–6
	sig: number;
	mode: Mode;
}

export function parseKey(k: string, mode: Mode): Key {
	const name = mode === 'minor' ? `${k}m` : k;
	if (!(name in SIG)) throw new Error(`unknown key ${name}`);
	return { name, tonic: LETTERS.indexOf(k[0]), sig: SIG[name], mode };
}

/** The raised 7th (and 6th, ascending melodic) of a minor key as an explicit accidental. */
function raised(key: Key, abs: number): string {
	const l = LETTERS[((abs % 7) + 7) % 7];
	const a = keyAlter(key.sig)[l] + 1;
	return (a === 0 ? '=' : a === 1 ? '^' : '^^') + letter(abs);
}

function header(title: string, key: string, extra: string[] = [], meter = '4/4', tempo = 80) {
	return ['X:1', `T:${title}`, `M:${meter}`, 'L:1/8', `Q:1/4=${tempo}`, ...extra, `K:${key}`].join('\n');
}

/** bars of 8 eighths from a list of notes; the last note fills its bar */
function bars(notes: string[], perBar = 8): string {
	const out: string[] = [];
	for (let i = 0; i < notes.length; i += perBar) {
		const chunk = notes.slice(i, i + perBar);
		if (chunk.length < perBar) chunk[chunk.length - 1] += String(perBar - chunk.length + 1);
		out.push(chunk.join(''));
	}
	return out.join(' | ') + ' |]';
}

/** A scale up and down, hands an octave apart; harmonic minor for minor keys. */
export function scale(k: string, mode: Mode, octaves = 1): string {
	const key = parseKey(k, mode);
	const base = C4 + key.tonic - (key.tonic > 4 ? 7 : 0); // start near middle C
	const up: string[] = [];
	for (let i = 0; i <= octaves * 7; i++) {
		const abs = base + i;
		up.push(mode === 'minor' && ((abs - key.tonic) % 7 + 7) % 7 === 6 ? raised(key, abs) : letter(abs));
	}
	const rh = [...up, ...up.slice(0, -1).reverse()];
	const lh = rh.map((n) => shiftOctave(n, -1));
	const title = `Гамма ${keyRu(k, mode)}${octaves > 1 ? `, ${octaves} октавы` : ''}`;
	return `${header(title, key.name, ['%%score {RH | LH}', 'V:RH clef=treble', 'V:LH clef=bass'])}\nV:RH\n${bars(rh)}\nV:LH\n${bars(lh)}\n`;
}

/** The tonic triad broken up and down over the octaves. */
export function arpeggio(k: string, mode: Mode, octaves = 1): string {
	const key = parseKey(k, mode);
	const base = C4 + key.tonic - (key.tonic > 4 ? 7 : 0);
	const up: string[] = [];
	for (let o = 0; o < octaves; o++) for (const d of [0, 2, 4]) up.push(letter(base + o * 7 + d));
	up.push(letter(base + octaves * 7));
	const rh = [...up, ...up.slice(0, -1).reverse()];
	const lh = rh.map((n) => shiftOctave(n, -1));
	return `${header(`Арпеджио ${keyRu(k, mode)}`, key.name, ['%%score {RH | LH}', 'V:RH clef=treble', 'V:LH clef=bass'])}\nV:RH\n${bars(rh, 6)}\nV:LH\n${bars(lh, 6)}\n`.replace('M:4/4', 'M:3/4');
}

/** I – IV – V7 – I (minor: i – iv – V7 – i) in close position over the bass. */
export function cadence(k: string, mode: Mode): string {
	const key = parseKey(k, mode);
	const t = C4 + key.tonic - (key.tonic > 4 ? 7 : 0);
	const ch = (ds: number[]) => `[${ds.map((d) => note(key, t + d)).join('')}]`;
	// voice leading: I (root position), IV (2nd inversion), V7 (leading tone, 7th, root), I
	const rh = [ch([0, 2, 4]), ch([0, 3, 5]), ch([-1, 3, 4]), ch([0, 2, 4])].map((c) => c + '4');
	const lh = [0, 3, 4, 0].map((d) => note(key, t + d - 7) + '4');
	const names = mode === 'major' ? ['I', 'IV', 'V7', 'I'] : ['i', 'iv', 'V7', 'i'];
	return `${header(`Каденция ${keyRu(k, mode)}`, key.name, ['%%score {RH | LH}', 'V:RH clef=treble', 'V:LH clef=bass'], '2/4', 60)}\nV:RH\n${rh.map((c, i) => `"^${names[i]}"${c}`).join(' | ')} |]\nV:LH\n${lh.join(' | ')} |]\n`;
}

function note(key: Key, abs: number) {
	// in minor the leading tone is raised
	if (key.mode === 'minor' && ((abs - key.tonic) % 7 + 7) % 7 === 6) return raised(key, abs);
	return letter(abs);
}

/** ii–V–I in a major key: shell voicings in the left hand (ii: 1–7, V: 1–3, I: 1–7), guide tones on top
 * (3rd–5th of ii → 7th–3rd of V → 3rd–7th of I) — the 7th of ii falls to the 3rd of V, and so on. */
export function twoFiveOne(k: string): string {
	const key = parseKey(k, 'major');
	const t = 21 + key.tonic; // the tonic in the 3rd octave (C3 = 21)
	const c = (...a: number[]) => `[${a.map(letter).join('')}]`;
	const lh = [c(t + 1, t + 7) + '8', c(t - 3, t - 1) + '8', c(t, t + 6) + '8', c(t, t + 6) + '8'];
	const rh = [c(t + 10, t + 12) + '8', c(t + 10, t + 13) + '8', c(t + 9, t + 13) + '8', c(t + 9, t + 13) + '8'];
	const sym = [`${chordRoot(k, 1)}m7`, `${chordRoot(k, 4)}7`, `${chordRoot(k, 0)}maj7`, ''];
	return `${header(`ii–V–I в ${keyRu(k, 'major')}`, key.name, ['%%score {RH | LH}', 'V:RH clef=treble', 'V:LH clef=bass'], '4/4', 90)}\nV:RH\n${rh.map((x, i) => (sym[i] ? `"${sym[i]}"` : '') + x).join(' | ')} |]\nV:LH\n${lh.join(' | ')} |]\n`;
}

function chordRoot(k: string, deg: number): string {
	const key = parseKey(k, 'major');
	const l = LETTERS[(key.tonic + deg) % 7];
	const a = keyAlter(key.sig)[l];
	return l + (a > 0 ? '#' : a < 0 ? 'b' : '');
}

/** The blues scale (1 b3 4 #4 5 b7) from a tonic, up and down, with the 12-bar chords above it. */
export function bluesScale(k: 'C' | 'F' | 'G' | 'Bb'): string {
	const steps: Record<string, string[]> = {
		C: ['C', '_E', 'F', '^F', 'G', '_B', 'c'],
		F: ['F', '_A', '_B', '=B', 'c', '_e', 'f'],
		G: ['G', '_B', 'c', '^c', 'd', '=f', 'g'],
		Bb: ['_B,', '_D', '_E', '=E', 'F', '_A', '_B']
	};
	const up = steps[k];
	const line = [...up, ...up.slice(0, -1).reverse()];
	return `${header(`Блюзовая гамма от ${k === 'Bb' ? 'си-бемоль' : keyRu(k, 'major').replace(' мажор', '')}`, 'C', [], '4/4', 80)}\n${bars(line, 8)}\n`;
}

function shiftOctave(n: string, by: number): string {
	// an ABC note with octave marks one octave down (by = -1)
	const m = n.match(/^([_^=]*)([A-Ga-g])([,']*)$/);
	if (!m) return n;
	const [, acc, l, marks] = m;
	let o = l === l.toLowerCase() ? 5 + (marks.match(/'/g)?.length ?? 0) : 4 - (marks.match(/,/g)?.length ?? 0);
	o += by;
	const L = l.toUpperCase();
	return acc + (o >= 5 ? L.toLowerCase() + "'".repeat(o - 5) : L + ','.repeat(4 - o));
}

const RU: Record<string, string> = { C: 'до', D: 'ре', E: 'ми', F: 'фа', G: 'соль', A: 'ля', B: 'си' };
export function keyRu(k: string, mode: Mode): string {
	const acc = k[1] === '#' ? '-диез' : k[1] === 'b' ? '-бемоль' : '';
	return `${RU[k[0]]}${acc} ${mode === 'major' ? 'мажор' : 'минор'}`;
}

/** `ex:scale:G:major:2`, `ex:arpeggio:D:minor:1`, `ex:cadence:F:major`, `ex:251:Bb`, `ex:blues:C` → ABC */
export function exerciseAbc(id: string): string | null {
	const [, kind, k, mode, n] = id.split(':');
	try {
		if (kind === 'scale') return scale(k, mode as Mode, Number(n) || 1);
		if (kind === 'arpeggio') return arpeggio(k, mode as Mode, Number(n) || 1);
		if (kind === 'cadence') return cadence(k, mode as Mode);
		if (kind === '251') return twoFiveOne(k);
		if (kind === 'blues') return bluesScale(k as 'C');
	} catch {
		return null;
	}
	return null;
}

export function exerciseTitle(id: string): string {
	const abc = exerciseAbc(id);
	return abc?.match(/^T:(.+)$/m)?.[1] ?? id;
}
