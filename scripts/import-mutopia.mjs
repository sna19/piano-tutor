// Imports Bach keyboard pieces from the Mutopia Project (public domain / CC BY-SA engravings): downloads each
// piece's MIDI and LilyPond source, converts the MIDI to ABC (scripts/midi2abc.mjs), checks the ABC note by note
// against the MIDI and writes src/lib/content/pieces/bach/<id>.abc plus the catalog
// src/lib/content/pieces/bach.generated.json. Run: node scripts/import-mutopia.mjs <bach.json> [cacheDir]
// (bach.json — the list of Mutopia entries; the downloads are cached, nothing of them goes into the repository).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import abcjsModule from 'abcjs';
import { midiToAbc, verify } from './midi2abc.mjs';

const abcjs = abcjsModule.default ?? abcjsModule;
const [listFile, cache = '/tmp/claude-1026/pt/cache'] = process.argv.slice(2);
const OUT = new URL('../src/lib/content/pieces/bach/', import.meta.url).pathname;
mkdirSync(cache, { recursive: true });
mkdirSync(OUT, { recursive: true });

const entries = JSON.parse(readFileSync(listFile, 'utf8'));

/** Level 1–8 (as semesters: 1 ≈ first year beginner … 8 ≈ concert repertoire), collection and Russian title. */
function classify(title, bwv) {
	const n = parseInt((bwv.match(/\d+/) ?? ['0'])[0], 10);
	const anh = /Anh/.test(bwv);
	if (anh && n >= 113 && n <= 132) {
		const lv = { 114: 2, 115: 2, 116: 2, 113: 2, 118: 2, 120: 2, 121: 2, 131: 2, 117: 2, 119: 3, 126: 3, 127: 3, 128: 3 }[n] ?? 3;
		return { level: lv, collection: 'Нотная тетрадь Анны Магдалены Бах' };
	}
	if (anh && n === 691) return { level: 3, collection: 'Нотная тетрадь Анны Магдалены Бах' };
	if (n === 515 || n === 516) return { level: 3, collection: 'Нотная тетрадь Анны Магдалены Бах' };
	if (n === 994) return { level: 2, collection: 'Нотная тетрадь Вильгельма Фридемана Баха' };
	if (n >= 924 && n <= 943) return { level: n === 924 ? 3 : 4, collection: 'Маленькие прелюдии' };
	if ((n >= 250 && n <= 438) || n === 259 || /Chorale|Choral/.test(title)) return { level: 3, collection: 'Хоралы' };
	if (n >= 439 && n <= 512) return { level: 3, collection: 'Песни и арии (Шемелли, хоралы)' };
	if (n >= 772 && n <= 786) return { level: [772, 775, 779, 784, 785].includes(n) ? 5 : 5, collection: 'Двухголосные инвенции' };
	if (n >= 787 && n <= 801) return { level: 6, collection: 'Трёхголосные синфонии' };
	if (n >= 802 && n <= 805) return { level: 7, collection: 'Четыре дуэта (Clavierübung III)' };
	if (n >= 806 && n <= 811) return { level: /Gigue/.test(title) ? 7 : 5, collection: 'Английские сюиты' };
	if (n >= 846 && n <= 869) {
		const prelude = /Praeludium|Prelude|Präludium/i.test(title);
		return { level: prelude ? (n === 846 ? 4 : n === 847 ? 6 : 6) : 7, collection: 'Хорошо темперированный клавир, том I' };
	}
	if (n >= 870 && n <= 893) return { level: /Praeludium/i.test(title) ? 7 : 8, collection: 'Хорошо темперированный клавир, том II' };
	if (n === 952) return { level: 6, collection: 'Отдельные фуги' };
	if (n === 988) return { level: /Aria/.test(title) ? 6 : 8, collection: 'Гольдберг-вариации' };
	if (n === 903 || n === 910) return { level: 8, collection: 'Фантазии и токкаты' };
	if (n === 1006) return { level: 6, collection: 'Сюита ми мажор BWV 1006a' };
	if (n === 1079 || n === 1080) return { level: 8, collection: 'Поздние циклы' };
	if (n === 1056) return { level: 6, collection: 'Переложения' };
	return { level: 6, collection: 'Другое' };
}

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17, XVIII: 18, XIX: 19, XX: 20, XXI: 21, XXII: 22, XXIII: 23, XXIV: 24 };

function russianTitle(title, bwv) {
	let m;
	if ((m = title.match(/^Invention (\d+)/))) return `Инвенция № ${m[1]}`;
	if ((m = title.match(/^Sinfonia (\d+)/))) return `Синфония № ${m[1]}`;
	if ((m = title.match(/Clavier (I+), (Praeludium|Fuga) ([IVXL]+|\d+)/))) {
		const no = ROMAN[m[3]] ?? m[3];
		return `${m[2] === 'Fuga' ? 'Фуга' : 'Прелюдия'} № ${no} (ХТК ${m[1]})`;
	}
	if ((m = title.match(/^Praeludium ([IVXL]+)$/))) return `Прелюдия № ${ROMAN[m[1]]} (ХТК I)`;
	if ((m = title.match(/Goldberg Variations - (\w+)/))) return m[1] === 'Aria' ? 'Гольдберг-вариации: Ария' : `Гольдберг-вариации: вариация ${m[1]}`;
	if ((m = title.match(/Duetto (\w+)/))) return `Дуэт ${m[1]}`;
	const map = [
		[/^Menuet$/, 'Менуэт'],
		[/^Minuet in (.+)$/, 'Менуэт'],
		[/^Polonaise/, 'Полонез'],
		[/^Musette/, 'Мюзет'],
		[/^March/, 'Марш'],
		[/^Air/, 'Ария'],
		[/^Aria/, 'Ария'],
		[/^Applicatio/, 'Applicatio (аппликатурное упражнение)'],
		[/Petite Prélude|^Praeludium \d+|^Prelude$/, 'Маленькая прелюдия'],
		[/Bourree I$/, 'Бурре I'],
		[/Bourree II$/, 'Бурре II'],
		[/Gigue$/, 'Жига'],
		[/Fugue in C major/, 'Фуга до мажор'],
		[/Toccata/, 'Токката фа-диез минор'],
		[/Chromatic Fantasy.*Fantasy/, 'Хроматическая фантазия'],
		[/Chromatic Fantasy.*Fugue/, 'Хроматическая фуга'],
		[/Contrapunctus I$/, 'Искусство фуги: Контрапункт I'],
		[/Contrapunctus XII/, 'Искусство фуги: Канон в октаву'],
		[/Contrapunctus XIII/, 'Искусство фуги: Канон в дуодециму'],
		[/Contrapunctus XIV/, 'Искусство фуги: Канон в децу'],
		[/Contrapunctus XV/, 'Искусство фуги: Канон в увеличении'],
		[/Ricercare a 6/, 'Музыкальное приношение: Ричеркар на 6'],
		[/Ricercare/, 'Музыкальное приношение: Ричеркар на 3'],
		[/Arioso/, 'Ариозо'],
		[/1006a - (.+)/, null]
	];
	for (const [re, ru] of map) if (re.test(title)) return ru ?? title.replace(/^BWV 1006a - /, '');
	return title;
}

async function get(url, file) {
	const path = join(cache, file);
	if (existsSync(path)) return readFileSync(path);
	const r = await fetch(url);
	if (!r.ok) throw new Error(`${r.status} ${url}`);
	const b = Buffer.from(await r.arrayBuffer());
	writeFileSync(path, b);
	await new Promise((res) => setTimeout(res, 300));
	return b;
}

/** LilyPond \partial → length of the pickup in quarter notes. */
function partialOf(ly) {
	const m = ly.match(/\\partial\s+(\d+)(\.*)(?:\s*\*\s*(\d+)(?:\/(\d+))?)?/);
	if (!m) return 0;
	let q = 4 / Number(m[1]);
	q *= [1, 1.5, 1.75][m[2].length] ?? 1;
	if (m[3]) q *= Number(m[3]) / Number(m[4] ?? 1);
	return q;
}

const seen = new Set();
const catalog = [];
const report = [];
for (const e of entries) {
	const [title, , bwvRaw] = e.cells;
	if (!e.mid.length || !e.ly.length) continue;
	const bwv = (bwvRaw.match(/BWV\s*(Anh\.\s*)?\d+[a-z]?/) ?? [bwvRaw])[0].replace(/\s+/g, ' ');
	const slug = e.ly[0].split('/').slice(-2, -1)[0];
	if (seen.has(slug)) continue;
	seen.add(slug);
	if (/Voice \(SATB\)/.test(e.cells.join(' '))) continue;
	const id = `bach-${slug}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
	try {
		const mid = await get(e.mid[0], `${slug}.mid`);
		const ly = (await get(e.ly[0], `${slug}.ly`)).toString('utf8');
		const meters = new Set([...ly.matchAll(/\\time\s+(\d+\/\d+)/g)].map((m) => m[1]));
		const keys = new Set([...ly.matchAll(/\\key\s+(\w+)\s*\\(major|minor)/g)].map((m) => m[1] + m[2]));
		const ru = russianTitle(title, bwv);
		const r = midiToAbc(mid, { title: `${ru} · ${bwv}`, composer: 'И. С. Бах', partial: partialOf(ly) });
		const check = verify(abcjs, r.abc, mid);
		const ok = check.missing.length === 0 && check.extra.length === 0;
		const notes = [];
		if (meters.size > 1) notes.push(`смена размера (${[...meters].join(', ')}) — тактовые черты могут стоять не там`);
		if (keys.size > 1) notes.push('смена тональности — знаки при ключе по первой');
		if (/\\repeat\s+"?volta/.test(ly)) notes.push('повторы в нотах не показаны — пьеса записана одним проходом');
		if (/\\(appoggiatura|acciaccatura|grace)/.test(ly)) notes.push('украшения записаны короткими нотами');
		const diff = Math.max(check.missing.length, check.extra.length);
		if (!ok && diff > check.notes * 0.01) {
			report.push(`✗ ${id}: ${check.missing.length} missing, ${check.extra.length} extra of ${check.notes}`);
			continue;
		}
		if (!ok) notes.unshift(`черновик: ${diff} нот из ${check.notes} расходятся с исходником (знаки альтерации) — сверить с изданием`);
		const { level, collection } = classify(title, bwv);
		writeFileSync(join(OUT, `${id}.abc`), r.abc);
		catalog.push({
			id,
			title: ru,
			original: title,
			composer: 'Johann Sebastian Bach',
			catalog: bwv,
			collection,
			style: 'classical',
			level,
			key: r.abc.match(/^K:(.+)$/m)[1],
			meter: `${r.meta.time.num}/${r.meta.time.den}`,
			tempo: r.meta.bpm,
			bars: r.meta.bars,
			notes: check.notes,
			voices: r.meta.voices,
			remarks: notes,
			draft: !ok || undefined,
			source: { name: 'Mutopia Project', url: e.ly[0].replace(/\/[^/]+\.ly$/, '/'), license: e.license, edition: e.cells.find((c) => /Gesellschaft|Edition|edition|Kirnberger|IMSLP|Kimberger/.test(c)) ?? '' }
		});
		report.push(`✓ ${id} L${level} ${ru} — ${check.notes} notes, ${r.meta.bars} bars${notes.length ? ' · ' + notes.join('; ') : ''}`);
	} catch (err) {
		report.push(`✗ ${id}: ${err.message}`);
	}
}
catalog.sort((a, b) => a.level - b.level || a.collection.localeCompare(b.collection) || a.catalog.localeCompare(b.catalog, 'en', { numeric: true }));
writeFileSync(new URL('../src/lib/content/pieces/bach.generated.json', import.meta.url), JSON.stringify(catalog, null, '\t') + '\n');
console.log(report.join('\n'));
console.log(`\n${catalog.length} pieces written`);
