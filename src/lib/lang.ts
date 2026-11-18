export type Lang = 'ru' | 'en';

/** the «lang» cookie, else the browser's language (Russian for Russian, Ukrainian, Belarusian; else English) */
export function langFromRequest(cookie: string | undefined, accept: string | null): Lang {
	if (cookie === 'ru' || cookie === 'en') return cookie;
	return !accept || /^(ru|uk|be)/i.test(accept) ? 'ru' : 'en';
}
