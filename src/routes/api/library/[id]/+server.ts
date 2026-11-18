import { error, json } from '@sveltejs/kit';
import { dataDir, getDb } from '#lib/server/db.js';
import { libraryDir, libraryFile, removeFromLibrary } from '#lib/server/library.js';

/** GET — the PDF itself (opens in the phone's PDF viewer) */
export function GET({ params }) {
	const f = libraryFile(getDb(), libraryDir(dataDir), Number(params.id));
	if (!f) error(404, 'Нет такого файла');
	return new Response(f.bytes, {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(f.row.fileName)}`,
			'cache-control': 'private, max-age=3600'
		}
	});
}

export function DELETE({ params }) {
	removeFromLibrary(getDb(), libraryDir(dataDir), Number(params.id));
	return json({ ok: true });
}
