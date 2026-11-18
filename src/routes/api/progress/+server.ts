import { json } from '@sveltejs/kit';
import { getDb } from '#lib/server/db.js';
import { readProgress, setProgress } from '#lib/server/progress.js';
import { InputError } from '#lib/server/settings.js';

export function GET() {
	return json(readProgress(getDb()));
}

/** POST { ref, status: 'learning' | 'done' | null } */
export async function POST({ request }) {
	try {
		const b = await request.json();
		setProgress(getDb(), b.ref, b.status);
		return json(readProgress(getDb()));
	} catch (e) {
		if (e instanceof InputError) return json({ message: e.message }, { status: 400 });
		throw e;
	}
}
