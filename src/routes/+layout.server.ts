import { getDb } from '#lib/server/db.js';
import { readSettings } from '#lib/server/settings.js';
import { readProgress } from '#lib/server/progress.js';

export function load() {
	return { settings: readSettings(getDb()), progress: readProgress(getDb()) };
}
