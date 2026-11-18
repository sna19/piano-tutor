import bach from './pieces/bach.generated.json';

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

export const PIECES: Piece[] = bach as Piece[];
export const pieceById = (id: string) => PIECES.find((p) => p.id === id);

// the notes themselves are loaded only when a piece is opened
const files = import.meta.glob('./pieces/*/*.abc', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;

export async function loadAbc(id: string): Promise<string | null> {
	const entry = Object.entries(files).find(([path]) => path.endsWith(`/${id}.abc`));
	return entry ? entry[1]() : null;
}

/** «Bm» → «си минор» for the list. */
const NOTE: Record<string, string> = { C: 'до', D: 'ре', E: 'ми', F: 'фа', G: 'соль', A: 'ля', B: 'си' };
export function keyName(k: string): string {
	const m = k.match(/^([A-G])([#b]?)(m?)/);
	if (!m) return k;
	return `${NOTE[m[1]]}${m[2] === '#' ? '-диез' : m[2] === 'b' ? '-бемоль' : ''} ${m[3] ? 'минор' : 'мажор'}`;
}
