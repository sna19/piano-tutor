import { describe, expect, it } from 'vitest';
import { openDb } from './db.js';
import { DEFAULTS, InputError, readSettings, writeSettings } from './settings.js';

describe('settings', () => {
	it('defaults, saves, refuses what does not fit', () => {
		const { db } = openDb(':memory:');
		expect(readSettings(db)).toEqual(DEFAULTS);
		expect(writeSettings(db, { level: 5, minutes: 45, tracks: ['jazz'] })).toEqual({ level: 5, minutes: 45, tracks: ['jazz'] });
		expect(() => writeSettings(db, { level: 9 })).toThrow(InputError);
		expect(() => writeSettings(db, { minutes: 20 })).toThrow(InputError);
		expect(() => writeSettings(db, { tracks: [] })).toThrow(InputError);
		expect(readSettings(db).level).toBe(5);
	});
});
