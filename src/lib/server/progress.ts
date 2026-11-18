import { eq } from 'drizzle-orm';
import type { Db } from './db.js';
import { progress } from './schema.js';
import { InputError } from './settings.js';

export type Status = 'learning' | 'done';

/** ref → status (lessons `lesson:<id>`, pieces `piece:<id>`) */
export function readProgress(db: Db): Record<string, Status> {
	return Object.fromEntries(db.select().from(progress).all().map((r) => [r.ref, r.status as Status]));
}

/** status null → the mark is taken off */
export function setProgress(db: Db, ref: unknown, status: unknown) {
	if (typeof ref !== 'string' || !/^(lesson|piece):[\w-]+$/.test(ref)) throw new InputError('Неизвестный урок или пьеса');
	if (status === null) {
		db.delete(progress).where(eq(progress.ref, ref)).run();
		return;
	}
	if (status !== 'learning' && status !== 'done') throw new InputError('Статус: в работе или готово');
	db.insert(progress)
		.values({ ref, status })
		.onConflictDoUpdate({ target: progress.ref, set: { status, updatedAt: new Date().toISOString() } })
		.run();
}
