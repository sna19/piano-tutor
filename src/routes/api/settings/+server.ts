import { json } from '@sveltejs/kit';
import { getDb } from '#lib/server/db.js';
import { InputError, readSettings, writeSettings } from '#lib/server/settings.js';

export function GET() {
	return json(readSettings(getDb()));
}

/** PATCH { level?, tracks?, minutes? } */
export async function PATCH({ request }) {
	try {
		return json(writeSettings(getDb(), await request.json()));
	} catch (e) {
		if (e instanceof InputError) return json({ message: e.message }, { status: 400 });
		throw e;
	}
}
