import { desc, eq } from 'drizzle-orm';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './db.js';
import { library } from './schema.js';
import { InputError } from './settings.js';

export const MAX_BYTES = 30 * 1024 * 1024;

export function libraryDir(dataDir: string) {
	const d = join(dataDir, 'library');
	mkdirSync(d, { recursive: true });
	return d;
}

export function listLibrary(db: Db) {
	return db.select().from(library).orderBy(desc(library.createdAt)).all();
}

/** A PDF of the student's own: checked to be a PDF, stored as <id>.pdf. */
export function addToLibrary(db: Db, dir: string, title: unknown, fileName: string, bytes: Uint8Array) {
	if (bytes.length === 0) throw new InputError('Пустой файл');
	if (bytes.length > MAX_BYTES) throw new InputError('Файл больше 30 МБ');
	if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw new InputError('Это не PDF');
	const t = (typeof title === 'string' && title.trim()) || fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
	const row = db.insert(library).values({ title: t.slice(0, 200), fileName: fileName.slice(0, 200), size: bytes.length }).returning().get();
	writeFileSync(join(dir, `${row.id}.pdf`), bytes);
	return row;
}

export function libraryFile(db: Db, dir: string, id: number) {
	const row = db.select().from(library).where(eq(library.id, id)).get();
	if (!row) return null;
	return { row, bytes: readFileSync(join(dir, `${id}.pdf`)) };
}

export function removeFromLibrary(db: Db, dir: string, id: number) {
	db.delete(library).where(eq(library.id, id)).run();
	rmSync(join(dir, `${id}.pdf`), { force: true });
}
