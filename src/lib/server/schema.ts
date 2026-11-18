import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const createdAt = () =>
	text('created_at')
		.notNull()
		.default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);

/** The student's settings: level, tracks, the usual length of a session (key → JSON value). */
export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	updatedAt: createdAt()
});

/** One practised block: what (a piece, a lesson, a backing track, an exercise), when, how long. */
export const practiceLog = sqliteTable(
	'practice_log',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		/** local calendar date YYYY-MM-DD */
		date: text('date').notNull(),
		/** technique | theory | ear | repertoire | improv | reading */
		area: text('area').notNull(),
		/** content id: piece:…, lesson:…, track:… */
		ref: text('ref'),
		minutes: integer('minutes').notNull(),
		note: text('note'),
		createdAt: createdAt()
	},
	(t) => [index('practice_log_date').on(t.date), index('practice_log_ref').on(t.ref)]
);

/** Where the student is with a piece or a lesson. */
export const progress = sqliteTable(
	'progress',
	{
		/** content id: piece:…, lesson:… */
		ref: text('ref').notNull(),
		/** learning | done */
		status: text('status').notNull(),
		/** for a piece: the tempo reached, beats per minute */
		tempo: integer('tempo'),
		updatedAt: createdAt()
	},
	(t) => [primaryKey({ columns: [t.ref] })]
);

/** «Мои ноты»: the student's own PDF scores (e.g. bought ones); the files live in /data/library, never in the repository. */
export const library = sqliteTable('library', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	fileName: text('file_name').notNull(),
	size: integer('size').notNull(),
	createdAt: createdAt()
});
