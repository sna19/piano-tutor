import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import abcjsModule from 'abcjs';
import { PIECES, keyName } from './pieces.js';

const abcjs = (abcjsModule as unknown as { default?: typeof abcjsModule }).default ?? abcjsModule;
const root = new URL('./pieces/', import.meta.url).pathname;
const fileOf = (id: string) => (id.startsWith('bach-') ? `${root}bach/${id}.abc` : `${root}siloti/${id}.abc`);

describe('the pieces', () => {
	it('every catalog entry has its notes and every file is in the catalog', () => {
		const files = ['bach', 'siloti'].flatMap((d) => readdirSync(root + d).map((f) => f.replace(/\.abc$/, '')));
		expect(files.sort()).toEqual(PIECES.map((p) => p.id).sort());
	});
	it('every piece parses, plays the number of notes of its source and has a source with a license', () => {
		for (const p of PIECES) {
			const abc = readFileSync(fileOf(p.id), 'utf8');
			const tune = abcjs.parseOnly(abc)[0] as unknown as { warnings?: string[]; setUpAudio: () => { tracks: { cmd: string }[][] } };
			expect(tune.warnings ?? [], p.id).toEqual([]);
			const notes = tune.setUpAudio().tracks.flat().filter((e) => e.cmd === 'note').length;
			// ties join notes; a draft may differ by a few
			expect(Math.abs(notes - p.notes) / p.notes, p.id).toBeLessThan(0.02);
			expect(p.source.license, p.id).toMatch(/Public Domain|Creative Commons/);
			expect(p.level).toBeGreaterThanOrEqual(1);
			expect(p.level).toBeLessThanOrEqual(8);
		}
	});
	it('names keys in Russian', () => {
		expect(keyName('Bm')).toBe('си минор');
		expect(keyName('Eb')).toBe('ми-бемоль мажор');
		expect(keyName('F#m')).toBe('фа-диез минор');
	});
});
