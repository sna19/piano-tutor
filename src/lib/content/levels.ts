import type { L10n } from '../i18n.js';

/**
 * The program's levels — like semesters of a music college: each has a goal in every course. A level is chosen
 * in the settings (or found by the placement check); the day plan and the suggested pieces follow it.
 */
export interface Level {
	n: number;
	title: L10n;
	/** what a student of this level can already do */
	can: L10n;
	/** about where it stands against the usual exam grades */
	grade: L10n;
}

export const LEVELS: Level[] = [
	{
		n: 1,
		title: { ru: 'Начало', en: 'Beginning' },
		can: { ru: 'Нахожу ноты на клавиатуре, читаю скрипичный и басовый ключ медленно, играю простые мелодии каждой рукой.', en: 'I find notes on the keyboard, read treble and bass clef slowly, play simple melodies hands separately.' },
		grade: { ru: 'подготовительный — 1 класс', en: 'pre-grade — grade 1' }
	},
	{
		n: 2,
		title: { ru: 'Первые пьесы', en: 'First pieces' },
		can: { ru: 'Играю двумя руками простые пьесы в до, соль, фа мажоре; знаю мажорные гаммы на одну октаву, трезвучия.', en: 'I play simple pieces hands together in C, G, F major; I know one-octave major scales and triads.' },
		grade: { ru: '1–2 класс', en: 'grades 1–2' }
	},
	{
		n: 3,
		title: { ru: 'Двухголосие', en: 'Two voices' },
		can: { ru: 'Веду две независимые линии (менуэты, полонезы Анны Магдалены), гаммы в две октавы, обращения трезвучий, 12-тактовый блюз.', en: 'I play two independent lines (Anna Magdalena minuets and polonaises), two-octave scales, triad inversions, a 12-bar blues.' },
		grade: { ru: '3 класс', en: 'grade 3' }
	},
	{
		n: 4,
		title: { ru: 'Полифония и гармония', en: 'Polyphony and harmony' },
		can: { ru: 'Маленькие прелюдии Баха, Прелюдия до мажор ХТК; септаккорды, ii–V–I в мажоре, простые гармонизации мелодий.', en: 'Bach’s Little Preludes, the C major Prelude of the WTC; seventh chords, ii–V–I in major, simple melody harmonisation.' },
		grade: { ru: '4–5 класс', en: 'grades 4–5' }
	},
	{
		n: 5,
		title: { ru: 'Инвенции', en: 'Inventions' },
		can: { ru: 'Двухголосные инвенции, гаммы в четыре октавы во всех тональностях; shell-voicings, импровизация на блюз и ii–V–I.', en: 'Two-part inventions, four-octave scales in all keys; shell voicings, improvising on a blues and ii–V–I.' },
		grade: { ru: '5–6 класс', en: 'grades 5–6' }
	},
	{
		n: 6,
		title: { ru: 'Трёхголосие', en: 'Three voices' },
		can: { ru: 'Синфонии и прелюдии ХТК, чтение хоралов с листа; rootless voicings, стандарты, модальная импровизация.', en: 'Sinfonias and WTC preludes, sight-reading chorales; rootless voicings, standards, modal improvisation.' },
		grade: { ru: '7–8 класс', en: 'grades 7–8' }
	},
	{
		n: 7,
		title: { ru: 'Фуги', en: 'Fugues' },
		can: { ru: 'Фуги ХТК, дуэты; реармонизация, импровизация в разных стилях, аккомпанемент.', en: 'WTC fugues, the Duets; reharmonisation, improvising in several styles, accompanying.' },
		grade: { ru: 'училище, младшие курсы', en: 'conservatory, first years' }
	},
	{
		n: 8,
		title: { ru: 'Концертный репертуар', en: 'Concert repertoire' },
		can: { ru: 'Гольдберг-вариации, Хроматическая фантазия и фуга, ХТК II; свободная импровизация, аранжировка.', en: 'Goldberg Variations, Chromatic Fantasia and Fugue, WTC II; free improvisation, arranging.' },
		grade: { ru: 'училище, старшие курсы — консерватория', en: 'conservatory, senior years' }
	}
];

export const levelOf = (n: number) => LEVELS.find((l) => l.n === n) ?? LEVELS[0];
