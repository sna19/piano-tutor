import { error } from '@sveltejs/kit';
import { lessonById } from '#lib/content/program.js';

export function load({ params }) {
	const lesson = lessonById(params.id);
	if (!lesson) error(404, 'Такого урока нет');
	return { lesson };
}
