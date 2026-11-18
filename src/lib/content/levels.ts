/**
 * The program's levels — like semesters of a music college: each has a goal in every course. A level is chosen
 * in the settings (or found by the placement check); the day plan and the suggested pieces follow it.
 */
export interface Level {
	n: number;
	title: string;
	/** what a student of this level can already do */
	can: string;
	/** about where it stands against the usual exam grades */
	grade: string;
}

export const LEVELS: Level[] = [
	{ n: 1, title: 'Начало', can: 'Нахожу ноты на клавиатуре, читаю скрипичный и басовый ключ медленно, играю простые мелодии каждой рукой.', grade: 'подготовительный — 1 класс' },
	{ n: 2, title: 'Первые пьесы', can: 'Играю двумя руками простые пьесы в до, соль, фа мажоре; знаю мажорные гаммы на одну октаву, трезвучия.', grade: '1–2 класс' },
	{ n: 3, title: 'Двухголосие', can: 'Веду две независимые линии (менуэты, полонезы Анны Магдалены), гаммы в две октавы, обращения трезвучий, 12-тактовый блюз.', grade: '3 класс' },
	{ n: 4, title: 'Полифония и гармония', can: 'Маленькие прелюдии Баха, Прелюдия до мажор ХТК; септаккорды, ii–V–I в мажоре, простые гармонизации мелодий.', grade: '4–5 класс' },
	{ n: 5, title: 'Инвенции', can: 'Двухголосные инвенции, гаммы в четыре октавы во всех тональностях; shell-voicings, импровизация на блюз и ii–V–I.', grade: '5–6 класс' },
	{ n: 6, title: 'Трёхголосие', can: 'Синфонии и прелюдии ХТК, чтение хоралов с листа; rootless voicings, стандарты, модальная импровизация.', grade: '7–8 класс' },
	{ n: 7, title: 'Фуги', can: 'Фуги ХТК, дуэты; реармонизация, импровизация в разных стилях, аккомпанемент.', grade: 'училище, младшие курсы' },
	{ n: 8, title: 'Концертный репертуар', can: 'Гольдберг-вариации, Хроматическая фантазия и фуга, ХТК II; свободная импровизация, аранжировка.', grade: 'училище, старшие курсы — консерватория' }
];

export const levelOf = (n: number) => LEVELS.find((l) => l.n === n) ?? LEVELS[0];
