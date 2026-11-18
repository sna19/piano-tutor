import { describe, expect, it } from 'vitest';
import { openDb } from './db.js';
import { readProgress, setProgress } from './progress.js';

describe('progress', () => {
	it('marks, changes and takes off a mark; refuses unknown refs', () => {
		const { db } = openDb(':memory:');
		setProgress(db, 'lesson:l2-minuet-g', 'learning');
		setProgress(db, 'lesson:l2-minuet-g', 'done');
		setProgress(db, 'piece:bach-anna-magdalena-04', 'learning');
		expect(readProgress(db)).toEqual({ 'lesson:l2-minuet-g': 'done', 'piece:bach-anna-magdalena-04': 'learning' });
		setProgress(db, 'lesson:l2-minuet-g', null);
		expect(readProgress(db)).toEqual({ 'piece:bach-anna-magdalena-04': 'learning' });
		expect(() => setProgress(db, 'x', 'done')).toThrow();
		expect(() => setProgress(db, 'lesson:a', 'maybe')).toThrow();
	});
});
