import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { isCrossSiteForm } from '#lib/server/csrf.js';
import { langFromRequest } from '#lib/lang.js';

export const handle: Handle = ({ event, resolve }) => {
	if (isCrossSiteForm(event.request, event.url)) {
		return new Response('Cross-site form submissions are forbidden', { status: 403 });
	}
	event.locals.lang = langFromRequest(event.cookies.get('lang'), event.request.headers.get('accept-language'));
	return resolve(event, { transformPageChunk: ({ html }) => html.replace('<html lang="ru">', `<html lang="${event.locals.lang}">`) });
};

/** The data file is the usual failure on the NAS (volume permissions): say so on screen. */
export const handleError: HandleServerError = ({ error }) => {
	console.error(error);
	if (error instanceof Error && error.name === 'SqliteError') {
		return { message: `файл данных недоступен (${error.message})` };
	}
	return { message: 'Internal Error' };
};
