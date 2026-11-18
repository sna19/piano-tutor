import { getDb } from '#lib/server/db.js';
import { readSettings } from '#lib/server/settings.js';

export function load() {
	return { settings: readSettings(getDb()) };
}
