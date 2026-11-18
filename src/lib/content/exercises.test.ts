import { describe, expect, it } from 'vitest';
import abcjsModule from 'abcjs';
import { exerciseAbc } from './exercises.js';

const abcjs = (abcjsModule as unknown as { default?: typeof abcjsModule }).default ?? abcjsModule;
type Ev = { cmd: string; pitch: number };
const pitches = (abc: string, track = 0) =>
	(abcjs.parseOnly(abc)[0] as unknown as { setUpAudio: () => { tracks: Ev[][] } }).setUpAudio().tracks[track].filter((e) => e.cmd === 'note').map((e) => e.pitch);

describe('exercises', () => {
	it('G major scale has F sharp; A harmonic minor has G sharp; up and down', () => {
		const g = pitches(exerciseAbc('ex:scale:G:major:1')!);
		expect(g).toEqual([67, 69, 71, 72, 74, 76, 78, 79, 78, 76, 74, 72, 71, 69, 67]);
		const a = pitches(exerciseAbc('ex:scale:A:minor:1')!);
		expect(a.slice(0, 8)).toEqual([57, 59, 60, 62, 64, 65, 68, 69]);
	});
	it('arpeggio, cadence, ii–V–I and the blues scale play the right notes', () => {
		expect(pitches(exerciseAbc('ex:arpeggio:C:major:1')!)).toEqual([60, 64, 67, 72, 67, 64, 60]);
		const cad = pitches(exerciseAbc('ex:cadence:D:minor')!);
		expect(cad).toContain(61); // C sharp, the raised 7th in V7
		const ii = pitches(exerciseAbc('ex:251:C')!, 1);
		expect(ii.slice(0, 2)).toEqual([50, 60]); // D3–C4 shell
		expect(pitches(exerciseAbc('ex:blues:C')!).slice(0, 7)).toEqual([60, 63, 65, 66, 67, 70, 72]);
	});
	it('every exercise of the program parses without warnings', async () => {
		const { allExerciseIds } = await import('./program.js');
		for (const id of allExerciseIds()) {
			const abc = exerciseAbc(id);
			expect(abc, id).not.toBeNull();
			expect((abcjs.parseOnly(abc!)[0] as unknown as { warnings?: string[] }).warnings ?? [], id).toEqual([]);
		}
	});
});
