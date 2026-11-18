import { json } from '@sveltejs/kit';
import { dataDir, getDb } from '#lib/server/db.js';
import { addToLibrary, libraryDir, listLibrary } from '#lib/server/library.js';
import { InputError } from '#lib/server/settings.js';

export function GET() {
	return json(listLibrary(getDb()));
}

/** POST multipart { file, title } — a PDF of my own */
export async function POST({ request }) {
	try {
		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File)) throw new InputError('Выберите PDF');
		const row = addToLibrary(getDb(), libraryDir(dataDir), form.get('title'), file.name, new Uint8Array(await file.arrayBuffer()));
		return json(row, { status: 201 });
	} catch (e) {
		if (e instanceof InputError) return json({ message: e.message }, { status: 400 });
		throw e;
	}
}
