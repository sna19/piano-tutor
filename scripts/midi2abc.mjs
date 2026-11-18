// MIDI (as LilyPond writes it: exact, quantized) → ABC for abcjs. Used once per piece by scripts/import-mutopia.mjs;
// the result is stored in src/lib/content/pieces/ and checked note by note against the MIDI (see verify()).
//
// What it does: one staff per MIDI track (LilyPond writes a track per staff), notes of a staff split into voices
// (a chord = notes with the same start and end), bars by the time signature, ties across bar lines, accidentals
// against the key signature and the bar, beams broken at beats, a pickup bar from LilyPond's \partial.

// ── MIDI parsing ─────────────────────────────────────────────────────────────────────────────────────────────
export function parseMidi(buf) {
	let p = 0;
	const u32 = () => (buf[p++] << 24) | (buf[p++] << 16) | (buf[p++] << 8) | buf[p++];
	const u16 = () => (buf[p++] << 8) | buf[p++];
	const str = (n) => String.fromCharCode(...buf.slice(p, (p += n)));
	const vlq = () => {
		let v = 0;
		for (;;) {
			const b = buf[p++];
			v = (v << 7) | (b & 0x7f);
			if (!(b & 0x80)) return v;
		}
	};
	if (str(4) !== 'MThd') throw new Error('not a MIDI file');
	const hl = u32();
	const format = u16();
	const ntracks = u16();
	const division = u16();
	p = 8 + hl;
	const tracks = [];
	for (let t = 0; t < ntracks; t++) {
		if (str(4) !== 'MTrk') throw new Error('bad track');
		const len = u32();
		const end = p + len;
		let tick = 0;
		let status = 0;
		const ev = [];
		const open = new Map();
		const notes = [];
		let name = '';
		while (p < end) {
			tick += vlq();
			let b = buf[p];
			if (b & 0x80) {
				status = b;
				p++;
			}
			const type = status & 0xf0;
			if (status === 0xff) {
				const mt = buf[p++];
				const ml = vlq();
				const data = buf.slice(p, p + ml);
				p += ml;
				if (mt === 0x51) ev.push({ tick, kind: 'tempo', us: (data[0] << 16) | (data[1] << 8) | data[2] });
				else if (mt === 0x58) ev.push({ tick, kind: 'time', num: data[0], den: 2 ** data[1] });
				else if (mt === 0x59) ev.push({ tick, kind: 'key', sf: (data[0] << 24) >> 24, minor: data[1] === 1 });
				else if (mt === 0x03 || mt === 0x04) name = name || String.fromCharCode(...data);
			} else if (status === 0xf0 || status === 0xf7) {
				p += vlq();
			} else if (type === 0x90 || type === 0x80) {
				const key = buf[p++];
				const vel = buf[p++];
				const ch = status & 0x0f;
				const id = ch * 128 + key;
				if (type === 0x90 && vel > 0) {
					if (!open.has(id)) open.set(id, []);
					open.get(id).push(tick);
				} else {
					const st = open.get(id)?.shift();
					if (st !== undefined && tick > st) notes.push({ start: st, end: tick, pitch: key });
				}
			} else if (type === 0xc0 || type === 0xd0) p += 1;
			else p += 2;
		}
		p = end;
		tracks.push({ name, ev, notes });
	}
	return { format, division, tracks };
}

// ── pitch spelling ───────────────────────────────────────────────────────────────────────────────────────────
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const MAJOR_KEYS = { '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb', '-2': 'Bb', '-1': 'F', 0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#' };
const MINOR_KEYS = { '-7': 'Abm', '-6': 'Ebm', '-5': 'Bbm', '-4': 'Fm', '-3': 'Cm', '-2': 'Gm', '-1': 'Dm', 0: 'Am', 1: 'Em', 2: 'Bm', 3: 'F#m', 4: 'C#m', 5: 'G#m', 6: 'D#m', 7: 'A#m' };

/** The key signature as an alteration per letter. */
function keyAlter(sf) {
	const a = Object.fromEntries(LETTERS.map((l) => [l, 0]));
	if (sf > 0) for (let i = 0; i < sf; i++) a[SHARP_ORDER[i]] = 1;
	if (sf < 0) for (let i = 0; i < -sf; i++) a[SHARP_ORDER[6 - i]] = -1;
	return a;
}

/** Spelling (letter, alteration) of each pitch class in a key: the scale itself, raised 6th and 7th in minor, the
 * rest by the key's side (sharps for sharp keys and C, flats for flat keys). */
function spellingTable(sf, minor) {
	const ka = keyAlter(sf);
	const t = new Array(12);
	const tonicLetter = (minor ? MINOR_KEYS : MAJOR_KEYS)[sf][0];
	const ti = LETTERS.indexOf(tonicLetter);
	for (let i = 0; i < 7; i++) {
		const l = LETTERS[i];
		t[(NATURAL[i] + ka[l] + 12) % 12] = { l, a: ka[l] };
	}
	if (minor) {
		for (const deg of [5, 6]) {
			const l = LETTERS[(ti + deg) % 7];
			const pc = (NATURAL[LETTERS.indexOf(l)] + ka[l] + 1 + 12) % 12;
			if (!t[pc]) t[pc] = { l, a: ka[l] + 1 };
		}
	}
	const flatSide = sf < 0;
	for (let pc = 0; pc < 12; pc++) {
		if (t[pc]) continue;
		// a white key outside the key: a natural sign (D natural in E major)
		const nat = NATURAL.indexOf(pc);
		if (nat >= 0) {
			t[pc] = { l: LETTERS[nat], a: 0 };
			continue;
		}
		if (flatSide) {
			const i = NATURAL.indexOf((pc + 1) % 12);
			t[pc] = i >= 0 ? { l: LETTERS[i], a: -1 } : { l: LETTERS[NATURAL.indexOf((pc + 11) % 12)], a: 1 };
		} else {
			const i = NATURAL.indexOf((pc + 11) % 12);
			// in C major and its relatives B-flat reads better than A-sharp
			if (pc === 10 && sf === 0) t[pc] = { l: 'B', a: -1 };
			else t[pc] = i >= 0 ? { l: LETTERS[i], a: 1 } : { l: LETTERS[NATURAL.indexOf((pc + 1) % 12)], a: -1 };
		}
	}
	return t;
}

function spell(pitch, table) {
	const s = table[pitch % 12];
	// the octave of the written letter: B# belongs to the octave below, Cb to the one above
	const octave = Math.floor((pitch - (NATURAL[LETTERS.indexOf(s.l)] + s.a)) / 12) - 1;
	return { l: s.l, a: s.a, o: octave };
}

function abcLetter(l, o) {
	// ABC: C = C4 (middle C), c = C5, c' = C6, C, = C3
	if (o >= 5) return l.toLowerCase() + "'".repeat(o - 5);
	return l + ','.repeat(4 - o);
}

// ── durations ────────────────────────────────────────────────────────────────────────────────────────────────
// Units: the grid is 1/48 of a whole note per "u"... kept simple: everything is counted in 1/64-quarter steps
// would be overkill; LilyPond's MIDI is exact, so quantize to 1/32 notes (and 1/24 for triplet eighths in 12ths).

function gcd(a, b) {
	return b ? gcd(b, a % b) : a;
}

/** Length in ABC units (L:1/16) as text: 1 → "", 2 → "2", 1/2 → "/2", 3/2 → "3/2". */
function lenText(num, den) {
	const g = gcd(num, den);
	num /= g;
	den /= g;
	if (den === 1) return num === 1 ? '' : String(num);
	if (num === 1) return den === 2 ? '/' : `/${den}`;
	return `${num}/${den}`;
}

// lengths (in 32nd notes) a single note can have without a tie
const SIMPLE = [1, 2, 3, 4, 6, 7, 8, 12, 14, 16, 24, 28, 32, 48, 56, 64];

function splitLen(n) {
	const out = [];
	while (n > 0) {
		const s = [...SIMPLE].reverse().find((x) => x <= n);
		out.push(s);
		n -= s;
	}
	return out;
}

// ── conversion ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @param {Uint8Array} buf MIDI file
 * @param {{ title?: string, composer?: string, partial?: number, keyOverride?: {sf:number,minor:boolean} }} opt
 *   partial — length of the pickup bar in quarter notes (from LilyPond's \partial)
 */
export function midiToAbc(buf, opt = {}) {
	const midi = parseMidi(buf);
	const q = midi.division; // ticks per quarter
	const T32 = q / 8; // ticks per 32nd note
	const all = midi.tracks.flatMap((t) => t.ev);
	const time = all.find((e) => e.kind === 'time') ?? { num: 4, den: 4 };
	const key = opt.keyOverride ?? all.find((e) => e.kind === 'key') ?? { sf: 0, minor: false };
	const tempo = all.find((e) => e.kind === 'tempo');
	const bpm = tempo ? Math.round(60e6 / tempo.us) : 90;
	const table = spellingTable(key.sf, key.minor);
	const ka = keyAlter(key.sf);

	const bar32 = (time.num * 32) / time.den; // bar length in 32nds
	const pickup32 = Math.round((opt.partial ?? 0) * 8);
	const beat32 = time.den === 8 && time.num % 3 === 0 ? 12 : 32 / time.den; // compound meters beam by dotted quarter

	const staves = midi.tracks.filter((t) => t.notes.length);
	const quant = (x) => Math.round(x / T32);
	const problems = [];

	const voicesOut = [];
	for (const [si, tr] of staves.entries()) {
		const notes = tr.notes
			.map((n) => ({ s: quant(n.start), e: quant(n.end), p: n.pitch }))
			.filter((n) => {
				if (n.e <= n.s) {
					problems.push(`dropped a note shorter than 1/32 (pitch ${n.p})`);
					return false;
				}
				return true;
			})
			.sort((a, b) => a.s - b.s || b.p - a.p);
		const avg = notes.reduce((n, x) => n + x.p, 0) / notes.length;
		const clef = avg < 57 ? 'bass' : 'treble';
		// voices: a chord joins the voice that holds a note with the same start and end; else the free voice
		// whose last pitch is nearest
		const voices = [];
		for (const n of notes) {
			let v = voices.find((v) => v.items.length && v.items.at(-1).s === n.s && v.items.at(-1).e === n.e);
			if (v) {
				v.items.at(-1).ps.push(n.p);
				continue;
			}
			// the first voice takes every note it can (one line reads best); a second voice only for overlaps, and
			// then the one whose last pitch is nearest
			const free = voices.filter((v) => v.until <= n.s);
			const sounding = voices.filter((v) => v.until > n.s);
			free.sort((a, b) => (sounding.length ? Math.abs(a.last - n.p) - Math.abs(b.last - n.p) : 0) || a.idx - b.idx);
			v = free[0];
			if (!v) {
				v = { idx: voices.length, items: [], until: 0, last: n.p };
				voices.push(v);
			}
			v.items.push({ s: n.s, e: n.e, ps: [n.p] });
			v.until = n.e;
			v.last = n.p;
		}
		// upper voice first (stems up), by average pitch
		voices.sort((a, b) => avgP(b) - avgP(a));
		// the voice with most notes shows its rests; the others hide theirs (x)
		const main = voices.reduce((m, v) => (v.items.length > m.items.length ? v : m), voices[0]);
		for (const [vi, v] of voices.entries()) voicesOut.push({ staff: si, clef, items: v.items, vi, main: v === main, name: `${si === 0 && staves.length > 1 ? 'RH' : si === 1 ? 'LH' : 'S' + si}${vi + 1}` });
	}
	function avgP(v) {
		const ps = v.items.flatMap((x) => x.ps);
		return ps.reduce((n, x) => n + x, 0) / ps.length;
	}

	const end32 = Math.max(...voicesOut.flatMap((v) => v.items.map((x) => x.e)));
	const barStart = (k) => (k === 0 ? 0 : pickup32 ? pickup32 + (k - 1) * bar32 : k * bar32);
	const barOf = (t) => {
		if (pickup32) return t < pickup32 ? 0 : 1 + Math.floor((t - pickup32) / bar32);
		return Math.floor(t / bar32);
	};
	const nBars = barOf(end32 - 1) + 1;

	const body = [];
	for (const v of voicesOut) {
		// timeline of the voice: notes and rests, cut at bar lines
		const segs = [];
		let t = 0;
		for (const it of v.items) {
			if (it.s > t) segs.push({ s: t, e: it.s, ps: null });
			segs.push({ ...it });
			t = it.e;
		}
		const lastBarEnd = barStart(nBars) || end32;
		if (t < lastBarEnd && (pickup32 === 0 || nBars > 1)) segs.push({ s: t, e: lastBarEnd, ps: null });
		const bars = Array.from({ length: nBars }, () => []);
		for (const sg of segs) {
			let s = sg.s;
			while (s < sg.e) {
				const b = barOf(s);
				const be = barStart(b + 1);
				const e = Math.min(sg.e, be);
				bars[b]?.push({ s, e, ps: sg.ps, tie: e < sg.e });
				s = e;
			}
		}
		const rest = v.main ? 'z' : 'x';
		const lines = [];
		let line = [];
		for (const [b, items] of bars.entries()) {
			const acc = {}; // letter+octave → alteration in force in this bar
			let out = '';
			for (const it of items) {
				const lens = splitAtBeats(it.s, it.e, barStart(b), beat32);
				for (const [k, [ls, le]] of lens.entries()) {
					const n32 = le - ls;
					const pieces = splitLen(n32);
					for (const [j, len] of pieces.entries()) {
						const lt = lenText(len, 2); // L:1/16 → a 32nd is 1/2
						if (!it.ps) {
							out += rest + lt;
						} else {
							const names = it.ps
								.slice()
								.sort((a, b) => a - b)
								.map((pitch) => {
									const sp = spell(pitch, table);
									const id = sp.l + sp.o;
									const cur = id in acc ? acc[id] : ka[sp.l];
									let mark = '';
									if (cur !== sp.a) {
										mark = sp.a === 0 ? '=' : sp.a > 0 ? '^'.repeat(sp.a) : '_'.repeat(-sp.a);
										acc[id] = sp.a;
									}
									return mark + abcLetter(sp.l, sp.o);
								});
							const chord = names.length > 1 ? `[${names.join('')}]` : names[0];
							const tied = j < pieces.length - 1 || k < lens.length - 1 || it.tie;
							out += chord + lt + (tied ? '-' : '');
						}
					}
					// a beat boundary after this piece breaks the beam
					if ((le - barStart(b)) % beat32 === 0) out += ' ';
				}
			}
			line.push(out.trim());
			if (line.length === 4) {
				lines.push(line.join(' | ') + ' |');
				line = [];
			}
		}
		if (line.length) lines.push(line.join(' | ') + ' |]');
		else if (lines.length) lines[lines.length - 1] = lines[lines.length - 1].replace(/\|$/, '|]');
		body.push(`V:${v.name}\n${lines.join('\n')}`);
	}

	const staffGroups = [...new Set(voicesOut.map((v) => v.staff))].map((s) => voicesOut.filter((v) => v.staff === s).map((v) => v.name));
	const score = staffGroups.length > 1 ? `%%score {${staffGroups.map((g) => (g.length > 1 ? `(${g.join(' ')})` : g[0])).join(' | ')}}` : `%%score (${staffGroups[0].join(' ')})`;
	const head = [
		'X:1',
		opt.title ? `T:${opt.title}` : null,
		opt.composer ? `C:${opt.composer}` : null,
		`M:${time.num}/${time.den}`,
		'L:1/16',
		`Q:1/4=${bpm}`,
		score,
		...voicesOut.map((v) => `V:${v.name} clef=${v.clef}${v.vi > 0 ? ' stem=down' : v.items && staffGroups.find((g) => g.includes(v.name)).length > 1 ? ' stem=up' : ''}`),
		`K:${(key.minor ? MINOR_KEYS : MAJOR_KEYS)[key.sf]}`
	].filter(Boolean);
	return { abc: head.join('\n') + '\n' + body.join('\n') + '\n', problems, meta: { bpm, time, key, bars: nBars, voices: voicesOut.length } };
}

/** Pieces of [s, e) cut at the beats of its bar, so beams and long notes read by the beat — only for notes that
 * start off the beat and cross it (a note on the beat keeps its whole length). */
function splitAtBeats(s, e, bar0, beat) {
	const rel = s - bar0;
	if (rel % beat === 0) return [[s, e]];
	const next = bar0 + Math.ceil(rel / beat) * beat;
	if (next >= e) return [[s, e]];
	// syncopation: keep a common figure (e.g. 8th–quarter–8th) as one note when it fits a simple length
	if (SIMPLE.includes(e - s) && (e - s) <= beat * 2) return [[s, e]];
	return [[s, next], ...splitAtBeats(next, e, bar0, beat)];
}

/**
 * Note-by-note check: the notes abcjs will play from the ABC (pitch, start and length in 32nds; tied notes
 * joined) against the notes of the MIDI. Returns the differences (empty = the same music).
 */
export function verify(abcjs, abc, buf) {
	const midi = parseMidi(buf);
	const T32 = midi.division / 8;
	const want = midi.tracks
		.flatMap((t) => t.notes)
		.map((n) => ({ p: n.pitch, s: Math.round(n.start / T32), d: Math.round(n.end / T32) - Math.round(n.start / T32) }))
		.filter((n) => n.d > 0);
	const tune = abcjs.parseOnly(abc)[0];
	const seq = tune.setUpAudio();
	const got = seq.tracks
		.flat()
		.filter((e) => e.cmd === 'note')
		.map((e) => ({ p: e.pitch, s: Math.round(e.start * 32), d: Math.round(e.duration * 32) }));
	const key = (n) => `${n.s}:${n.p}:${n.d}`;
	const count = (list) => list.reduce((m, n) => m.set(key(n), (m.get(key(n)) ?? 0) + 1), new Map());
	const w = count(want);
	const g = count(got);
	const missing = [];
	const extra = [];
	for (const [k, n] of w) for (let i = 0; i < n - (g.get(k) ?? 0); i++) missing.push(k);
	for (const [k, n] of g) for (let i = 0; i < n - (w.get(k) ?? 0); i++) extra.push(k);
	return { notes: want.length, missing, extra };
}
