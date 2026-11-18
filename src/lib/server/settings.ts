import { eq } from 'drizzle-orm';
import type { Db } from './db.js';
import { settings } from './schema.js';

/** The student's settings with their defaults. */
export interface Settings {
	/** level 1–8 */
	level: number;
	/** what to study: classical, jazz, blues, pop — the day plan mixes them */
	tracks: string[];
	/** the usual length of a session, minutes */
	minutes: number;
}

export const DEFAULTS: Settings = { level: 2, tracks: ['classical', 'jazz', 'blues'], minutes: 30 };
const TRACKS = ['classical', 'jazz', 'blues', 'pop'];
const MINUTES = [15, 30, 45, 60, 90];

export function readSettings(db: Db): Settings {
	const rows = db.select().from(settings).all();
	const v: Record<string, unknown> = {};
	for (const r of rows) {
		try {
			v[r.key] = JSON.parse(r.value);
		} catch {
			/* a broken value keeps its default */
		}
	}
	return {
		level: Number.isInteger(v.level) && (v.level as number) >= 1 && (v.level as number) <= 8 ? (v.level as number) : DEFAULTS.level,
		tracks: Array.isArray(v.tracks) && v.tracks.length && v.tracks.every((t) => TRACKS.includes(t)) ? (v.tracks as string[]) : DEFAULTS.tracks,
		minutes: MINUTES.includes(v.minutes as number) ? (v.minutes as number) : DEFAULTS.minutes
	};
}

export class InputError extends Error {}

export function writeSettings(db: Db, input: Partial<Record<keyof Settings, unknown>>): Settings {
	const put = (key: string, value: unknown) =>
		db
			.insert(settings)
			.values({ key, value: JSON.stringify(value) })
			.onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value), updatedAt: new Date().toISOString() } })
			.run();
	if (input.level !== undefined) {
		const n = Number(input.level);
		if (!Number.isInteger(n) || n < 1 || n > 8) throw new InputError('Уровень от 1 до 8');
		put('level', n);
	}
	if (input.tracks !== undefined) {
		const t = input.tracks;
		if (!Array.isArray(t) || !t.length || !t.every((x) => TRACKS.includes(x))) throw new InputError('Выберите хотя бы одно направление');
		put('tracks', t);
	}
	if (input.minutes !== undefined) {
		if (!MINUTES.includes(Number(input.minutes))) throw new InputError('Длина занятия: 15, 30, 45, 60 или 90 минут');
		put('minutes', Number(input.minutes));
	}
	void eq;
	return readSettings(db);
}
