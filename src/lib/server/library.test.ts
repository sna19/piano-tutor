import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openDb } from './db.js';
import { addToLibrary, libraryFile, listLibrary, removeFromLibrary } from './library.js';

describe('my scores', () => {
	it('keeps a PDF, gives it back, removes it; refuses what is not a PDF', () => {
		const { db } = openDb(':memory:');
		const dir = mkdtempSync(join(tmpdir(), 'lib-'));
		const pdf = new TextEncoder().encode('%PDF-1.4 test');
		const row = addToLibrary(db, dir, '', 'my_theme-sheet.pdf', pdf);
		expect(row.title).toBe('my theme sheet');
		expect(listLibrary(db)).toHaveLength(1);
		expect(libraryFile(db, dir, row.id)!.bytes.length).toBe(pdf.length);
		expect(() => addToLibrary(db, dir, 'x', 'a.pdf', new TextEncoder().encode('hello'))).toThrow(/не PDF/);
		removeFromLibrary(db, dir, row.id);
		expect(listLibrary(db)).toHaveLength(0);
	});
});
