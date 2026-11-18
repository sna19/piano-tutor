import { getDb } from '#lib/server/db.js';
import { listLibrary } from '#lib/server/library.js';

export function load() {
	return { files: listLibrary(getDb()) };
}
