import bach from './pieces/bach.generated.json';
import extra from './pieces/extra.json';
import type { Lang } from '../i18n.js';

export type Style = 'classical' | 'jazz' | 'blues' | 'pop';

export interface Piece {
	id: string;
	title: string;
	original: string;
	composer: string;
	catalog: string;
	collection: string;
	style: Style;
	level: number;
	key: string;
	meter: string;
	tempo: number;
	bars: number;
	notes: number;
	voices: number;
	remarks: string[];
	draft?: boolean;
	source: { name: string; url: string; license: string; edition: string };
}

export const PIECES: Piece[] = [...(extra as Piece[]), ...(bach as Piece[])].sort((a, b) => a.level - b.level);
export const pieceById = (id: string) => PIECES.find((p) => p.id === id);

// the notes themselves are loaded only when a piece is opened
const files = import.meta.glob('./pieces/*/*.abc', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;

export async function loadAbc(id: string): Promise<string | null> {
	const entry = Object.entries(files).find(([path]) => path.endsWith(`/${id}.abc`));
	return entry ? entry[1]() : null;
}

/** «Bm» → «си минор» / «B minor» for the list. */
const NOTE: Record<string, string> = { C: 'до', D: 'ре', E: 'ми', F: 'фа', G: 'соль', A: 'ля', B: 'си' };
export function keyName(k: string, lang: Lang = 'ru'): string {
	const m = k.match(/^([A-G])([#b]?)(m?)/);
	if (!m) return k;
	if (lang === 'en') return `${m[1]}${m[2] === '#' ? '♯' : m[2] === 'b' ? '♭' : ''} ${m[3] ? 'minor' : 'major'}`;
	return `${NOTE[m[1]]}${m[2] === '#' ? '-диез' : m[2] === 'b' ? '-бемоль' : ''} ${m[3] ? 'минор' : 'мажор'}`;
}

const COLLECTION_EN: Record<string, string> = {
	'Нотная тетрадь Анны Магдалены Бах': 'Notebook for Anna Magdalena Bach',
	'Нотная тетрадь Вильгельма Фридемана Баха': 'Clavier-Büchlein for Wilhelm Friedemann Bach',
	'Маленькие прелюдии': 'Little Preludes',
	Хоралы: 'Chorales',
	'Песни и арии (Шемелли, хоралы)': 'Songs and arias (Schemelli, chorales)',
	'Двухголосные инвенции': 'Two-Part Inventions',
	'Трёхголосные синфонии': 'Three-Part Sinfonias',
	'Четыре дуэта (Clavierübung III)': 'Four Duets (Clavierübung III)',
	'Английские сюиты': 'English Suites',
	'Хорошо темперированный клавир, том I': 'Well-Tempered Clavier, Book I',
	'Хорошо темперированный клавир, том II': 'Well-Tempered Clavier, Book II',
	'Отдельные фуги': 'Separate fugues',
	'Гольдберг-вариации': 'Goldberg Variations',
	'Фантазии и токкаты': 'Fantasias and toccatas',
	'Сюита ми мажор BWV 1006a': 'Suite in E major BWV 1006a',
	'Поздние циклы': 'Late cycles',
	Переложения: 'Arrangements',
	Транскрипции: 'Transcriptions',
	Другое: 'Other'
};

/** remarks of the import, by their beginning */
const REMARK_EN: [RegExp, (m: RegExpMatchArray) => string][] = [
	[/^повторы в нотах не показаны/, () => 'repeats are not shown — the piece is written out in one pass'],
	[/^украшения записаны короткими нотами/, () => 'ornaments are written as short notes'],
	[/^смена размера \((.+)\)/, (m) => `meter changes (${m[1]}) — bar lines may be misplaced`],
	[/^смена тональности/, () => 'key change — the key signature is the first one'],
	[/^черновик: (\d+) нот из (\d+)/, (m) => `draft: ${m[1]} of ${m[2]} notes differ from the source (accidentals) — check against the edition`],
	[/^черновик: набрано со скана/, () => 'draft: typeset from a scan of the Gutheil edition — check against the score, especially the left-hand chords in bars 10, 16 and 20'],
	[/^мелодия \(первая нота/, () => 'the melody (the first note of each group) sounds twice — as a sixteenth and as a half note, as written; pedal, arpeggiated chords and dynamics are not rendered'],
	[/^арпеджио левой руки/, () => 'the left-hand arpeggios in bars 18–22 are written as triplets and 32nds — in the score they are quick broken chords']
];

/** the piece's texts in a language */
export function pieceText(p: Piece, lang: Lang) {
	if (lang === 'ru') return { title: p.title, collection: p.collection, remarks: p.remarks };
	const title = p.id === 'siloti-prelude-b-minor' ? 'Prelude in B minor (Bach — Siloti)' : p.original.replace(/^Das Wohltemperierte Clavier (I+), /, 'WTC $1, ');
	const remarks = p.remarks.map((r) => {
		for (const [re, f] of REMARK_EN) {
			const m = r.match(re);
			if (m) return f(m);
		}
		return r;
	});
	return { title, collection: COLLECTION_EN[p.collection] ?? p.collection, remarks };
}
