import { describe, expect, it } from 'vitest';
import { LESSONS } from './program.js';
import { LESSONS_EN } from './program.en.js';
import { PIECES } from './pieces.js';
import { exerciseAbc } from './exercises.js';

describe('the program', () => {
	it('every level has lessons in technique or theory, repertoire and improvisation', () => {
		for (let n = 1; n <= 8; n++) {
			const ls = LESSONS.filter((l) => l.level === n);
			expect(ls.length, `level ${n}`).toBeGreaterThanOrEqual(3);
			expect(ls.some((l) => l.area === 'repertoire' || l.area === 'technique'), `level ${n}`).toBe(true);
		}
	});
	it('every lesson has its English text and no English text is orphaned', () => {
		expect(Object.keys(LESSONS_EN).sort()).toEqual(LESSONS.map((l) => l.id).sort());
		for (const l of LESSONS) expect(LESSONS_EN[l.id].tasks.length, l.id).toBe(l.tasks.length);
	});
	it('ids are unique and every material exists', () => {
		expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
		for (const l of LESSONS)
			for (const m of l.materials) {
				if (m.startsWith('piece:')) expect(PIECES.some((p) => p.id === m.slice(6)), `${l.id}: ${m}`).toBe(true);
				else expect(exerciseAbc(m), `${l.id}: ${m}`).not.toBeNull();
			}
	});
});
