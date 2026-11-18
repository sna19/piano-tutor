import { error } from '@sveltejs/kit';
import { loadAbc, pieceById } from '#lib/content/pieces.js';

export async function load({ params }) {
	const piece = pieceById(params.id);
	const abc = piece ? await loadAbc(piece.id) : null;
	if (!piece || !abc) error(404, 'Такой пьесы нет');
	return { piece, abc };
}
