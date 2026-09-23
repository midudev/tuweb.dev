/*
 * El reto diario de JavaScript: uno por día, sacado de un catálogo escrito a
 * mano. Aquí no se ejecuta nada —ni eval ni new Function—: cada reto trae su
 * respuesta y se compara como texto. La racha, el nivel y las insignias salen
 * de lo que has resuelto, que vive en tu localStorage y no sale de ahí.
 */

/** Elegir la salida entre cuatro, o escribirla tal cual. */
export type Kind = 'salida' | 'respuesta';

export type Dificultad = 'facil' | 'medio' | 'dificil';

export const DIFICULTADES: Record<Dificultad, { label: string; xp: number }> = {
	facil: { label: 'Fácil', xp: 10 },
	medio: { label: 'Medio', xp: 20 },
	dificil: { label: 'Difícil', xp: 30 },
};

export interface Reto {
	id: string;
	kind: Kind;
	dificultad: Dificultad;
	/** El código, línea a línea. */
	code: string[];
	/** Las opciones, en los de «salida». */
	options?: string[];
	/** La buena, en los de «salida». */
	answer?: number;
	/** Lo que se acepta, en los de «respuesta». */
	accept?: string[];
	/** Por qué sale eso. Se enseña al terminar, aciertes o no. */
	why: string;
}

/** Dos intentos al día. El segundo vale la mitad. */
export const TRIES = 2;

export const CATALOGO: readonly Reto[] = [
	{
		id: 'coma-flotante',
		kind: 'salida',
		dificultad: 'facil',
		code: ['console.log(0.1 + 0.2 === 0.3)'],
		options: ['false', 'true', 'undefined', 'TypeError'],
		answer: 0,
		why: '0.1 + 0.2 da 0.30000000000000004: los decimales en coma flotante no son exactos.',
	},
	{
		id: 'typeof-null',
		kind: 'respuesta',
		dificultad: 'facil',
		code: ['console.log(typeof null)'],
		accept: ['object'],
		why: 'Un fallo de la primera versión del lenguaje que ya no se puede arreglar: typeof null es "object".',
	},
	{
		id: 'suma-arrays',
		kind: 'salida',
		dificultad: 'medio',
		code: ['console.log([1, 2, 3] + [4])'],
		options: ['1,2,34', '[1, 2, 3, 4]', '10', '1,2,3,4'],
		answer: 0,
		why: 'El + con arrays los pasa a texto: "1,2,3" + "4". Se pegan, no se suman.',
	},
	{
		id: 'sort-texto',
		kind: 'respuesta',
		dificultad: 'medio',
		code: ['const a = [10, 1, 3]', 'a.sort()', 'console.log(a[0])'],
		accept: ['1'],
		why: 'sort() sin función compara como texto: "1" < "10" < "3". El primero es 1, pero por casualidad.',
	},
	{
		id: 'menos-mas',
		kind: 'salida',
		dificultad: 'facil',
		code: ["console.log('5' - 2, '5' + 2)"],
		options: ['3 52', '3 7', '52 3', 'NaN 52'],
		answer: 0,
		why: 'El - solo sabe restar números y convierte; el + con un texto concatena.',
	},
	{
		id: 'cierre',
		kind: 'respuesta',
		dificultad: 'facil',
		code: ['let x = 5', 'const doble = () => x * 2', 'x = 10', 'console.log(doble())'],
		accept: ['20'],
		why: 'La función lee x cuando se llama, no cuando se crea. Para entonces ya vale 10.',
	},
	{
		id: 'var-timeout',
		kind: 'salida',
		dificultad: 'medio',
		code: ['for (var i = 0; i < 3; i++) {', '  setTimeout(() => console.log(i), 0)', '}'],
		options: ['3 3 3', '0 1 2', '0 0 0', 'undefined undefined undefined'],
		answer: 0,
		why: 'Con var solo hay una i para todo el bucle. Cuando saltan los timeouts ya vale 3. Con let saldría 0 1 2.',
	},
	{
		id: 'map-filter',
		kind: 'respuesta',
		dificultad: 'facil',
		code: ['const r = [1, 2, 3].map((n) => n * 2).filter((n) => n > 2)', 'console.log(r.length)'],
		accept: ['2'],
		why: 'map deja [2, 4, 6] y filter se queda con [4, 6]: dos.',
	},
	{
		id: 'typeof-nan',
		kind: 'salida',
		dificultad: 'facil',
		code: ['console.log(typeof NaN)'],
		options: ['number', 'NaN', 'undefined', 'object'],
		answer: 0,
		why: 'NaN es un número: el que sale cuando una operación numérica no tiene sentido.',
	},
	{
		id: 'reverse',
		kind: 'respuesta',
		dificultad: 'facil',
		code: ['console.log([..."hola"].reverse().join(""))'],
		accept: ['aloh'],
		why: 'El spread parte la cadena en letras, reverse les da la vuelta y join las vuelve a pegar.',
	},
	{
		id: 'referencia',
		kind: 'salida',
		dificultad: 'facil',
		code: ['const o = { a: 1 }', 'const p = o', 'p.a = 2', 'console.log(o.a)'],
		options: ['2', '1', 'undefined', 'TypeError'],
		answer: 0,
		why: 'p no es una copia: es el mismo objeto con otro nombre. const impide reasignar, no cambiar lo de dentro.',
	},
	{
		id: 'reduce',
		kind: 'respuesta',
		dificultad: 'facil',
		code: ['console.log([3, 1, 2].reduce((acc, n) => acc + n, 10))'],
		accept: ['16'],
		why: 'Se empieza en 10 y se suma cada uno: 10 + 3 + 1 + 2.',
	},
	{
		id: 'nullish',
		kind: 'salida',
		dificultad: 'medio',
		code: ["console.log(null ?? 'a', 0 || 'b', 0 ?? 'c')"],
		options: ['a b 0', 'a b c', 'null b 0', 'a 0 c'],
		answer: 0,
		why: '|| salta con cualquier valor falso, 0 incluido. ?? solo con null o undefined, así que el 0 se queda.',
	},
	{
		id: 'por-defecto',
		kind: 'respuesta',
		dificultad: 'medio',
		code: ['function f(a, b = a * 2) {', '  return a + b', '}', 'console.log(f(3))'],
		accept: ['9'],
		why: 'Un parámetro por defecto puede usar los de antes: b vale 6 y 3 + 6 son 9.',
	},
	{
		id: 'bucle-eventos',
		kind: 'salida',
		dificultad: 'dificil',
		code: [
			'console.log(1)',
			'setTimeout(() => console.log(2), 0)',
			'Promise.resolve().then(() => console.log(3))',
			'console.log(4)',
		],
		options: ['1 4 3 2', '1 2 3 4', '1 4 2 3', '1 3 4 2'],
		answer: 0,
		why: 'Primero lo síncrono (1 y 4), luego las microtareas como las promesas (3) y al final los timeouts (2).',
	},
	{
		id: 'at',
		kind: 'respuesta',
		dificultad: 'facil',
		code: ['console.log("abc".at(-1).toUpperCase())'],
		accept: ['C'],
		why: 'at(-1) cuenta desde el final: la c, que luego pasa a mayúscula.',
	},
	{
		id: 'igualdad',
		kind: 'salida',
		dificultad: 'dificil',
		code: ['console.log([] == false, [] === false)'],
		options: ['true false', 'false false', 'true true', 'false true'],
		answer: 0,
		why: 'Con == los dos lados acaban en 0: [] pasa a "" y luego a 0, false a 0. Con === el tipo ya no cuadra.',
	},
	{
		id: 'resto',
		kind: 'respuesta',
		dificultad: 'medio',
		code: ['const { a, ...resto } = { a: 1, b: 2, c: 3 }', 'console.log(Object.keys(resto).length)'],
		accept: ['2'],
		why: 'a se queda fuera y resto se lleva lo que sobra: b y c.',
	},
	{
		id: 'parseint',
		kind: 'salida',
		dificultad: 'medio',
		code: ['console.log(parseInt("08px"), Number("08px"))'],
		options: ['8 NaN', '8 8', 'NaN NaN', '0 NaN'],
		answer: 0,
		why: 'parseInt lee hasta donde puede y para. Number quiere la cadena entera como número, o nada.',
	},
	{
		id: 'continue',
		kind: 'respuesta',
		dificultad: 'medio',
		code: ['let n = 0', 'for (let i = 0; i < 5; i++) {', '  if (i % 2) continue', '  n += i', '}', 'console.log(n)'],
		accept: ['6'],
		why: 'Los impares dan resto 1 y se saltan. Se suman 0, 2 y 4.',
	},
	{
		id: 'set',
		kind: 'salida',
		dificultad: 'facil',
		code: ["const s = new Set([1, 1, 2, '2'])", 'console.log(s.size)'],
		options: ['3', '2', '4', '1'],
		answer: 0,
		why: 'El 1 repetido cuenta una vez, pero 2 y "2" no son iguales para un Set: tres.',
	},
	{
		id: 'max-vacio',
		kind: 'respuesta',
		dificultad: 'dificil',
		code: ['console.log(Math.max())'],
		accept: ['-Infinity'],
		why: 'Sin nada que comparar, Math.max parte del valor más bajo posible: -Infinity.',
	},
	{
		id: 'asi',
		kind: 'salida',
		dificultad: 'medio',
		code: ['function hola() {', '  return', "    'hola'", '}', 'console.log(hola())'],
		options: ['undefined', 'hola', 'null', 'SyntaxError'],
		answer: 0,
		why: 'Tras un return con salto de línea JavaScript pone el punto y coma solo. Devuelve undefined.',
	},
	{
		id: 'flat',
		kind: 'respuesta',
		dificultad: 'medio',
		code: ['console.log([1, [2, [3, [4]]]].flat(2).length)'],
		accept: ['4'],
		why: 'flat(2) aplana dos niveles: [1, 2, 3, [4]]. El [4] cuenta como uno.',
	},
	{
		id: 'typeof-class',
		kind: 'salida',
		dificultad: 'medio',
		code: ['console.log(typeof function () {}, typeof class {})'],
		options: ['function function', 'function class', 'object class', 'function object'],
		answer: 0,
		why: 'Una clase es una función por debajo: typeof no las distingue.',
	},
	{
		id: 'split',
		kind: 'respuesta',
		dificultad: 'facil',
		code: ['console.log("a-b-c".split("-", 2).join("+"))'],
		accept: ['a+b'],
		why: 'El segundo argumento de split corta la lista: se queda en ["a", "b"].',
	},
];

/* ---------- El día ---------- */

const DAY = 24 * 60 * 60 * 1000;

/** El día en tu hora, como AAAA-MM-DD: es la llave de lo guardado. */
export function dayKey(date: Date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** Un número por día, contando desde 1970. De aquí sale el reto que toca. */
function dayNumber(key: string) {
	const [y, m, d] = key.split('-').map(Number);
	return Math.round(Date.UTC(y, m - 1, d) / DAY);
}

function keyOf(number: number) {
	return new Date(number * DAY).toISOString().slice(0, 10);
}

export function retoDelDia(key: string) {
	return CATALOGO[dayNumber(key) % CATALOGO.length];
}

/** Lo escrito se compara sin espacios de más ni comillas alrededor. */
function normalize(text: string) {
	return text
		.trim()
		.replace(/^(['"`])(.*)\1$/, '$2')
		.replace(/\s+/g, ' ');
}

export function isRight(reto: Reto, value: string | number) {
	if (reto.kind === 'salida') return value === reto.answer;
	const given = normalize(String(value));
	return (reto.accept ?? []).some((ok) => normalize(ok) === given);
}

/** Lo que se enseña como solución, sea del tipo que sea. */
export function solution(reto: Reto) {
	return reto.kind === 'salida' ? (reto.options?.[reto.answer ?? 0] ?? '') : (reto.accept?.[0] ?? '');
}

/* ---------- Lo guardado ---------- */

export interface Dia {
	/** El id del reto, por si el catálogo cambia. */
	reto: string;
	ok: boolean;
	/** Cuántos intentos gastó. */
	tries: number;
	xp: number;
	dificultad: Dificultad;
}

export type Progress = Record<string, Dia>;

const KEY = 'tuweb:reto-diario';

export function readProgress(): Progress {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as unknown;
		if (!raw || typeof raw !== 'object') return {};
		// Lo guardado puede venir tocado a mano: se deja solo lo que cuadra.
		const out: Progress = {};
		for (const [key, value] of Object.entries(raw as Record<string, Partial<Dia>>)) {
			if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value || typeof value !== 'object') continue;
			const dificultad = value.dificultad && Object.hasOwn(DIFICULTADES, value.dificultad) ? value.dificultad : 'facil';
			out[key] = {
				reto: String(value.reto ?? ''),
				ok: value.ok === true,
				tries: Math.min(Math.max(Number(value.tries) || 0, 0), TRIES),
				xp: Math.min(Math.max(Number(value.xp) || 0, 0), DIFICULTADES.dificil.xp),
				dificultad,
			};
		}
		return out;
	} catch {
		return {};
	}
}

export function saveProgress(progress: Progress) {
	try {
		localStorage.setItem(KEY, JSON.stringify(progress));
	} catch {
		// Si no deja guardar, dura lo que dure la visita.
	}
}

/** Un día está cerrado cuando se acierta o se gastan los intentos. */
export function isClosed(dia: Dia | undefined) {
	return !!dia && (dia.ok || dia.tries >= TRIES);
}

/** Los días seguidos acertados hasta hoy. Si hoy aún no has jugado, cuenta desde ayer. */
export function currentStreak(progress: Progress, today: string) {
	let n = dayNumber(today);
	if (!progress[today]?.ok) {
		if (isClosed(progress[today])) return 0;
		n -= 1;
	}
	let streak = 0;
	while (progress[keyOf(n)]?.ok) {
		streak += 1;
		n -= 1;
	}
	return streak;
}

export function bestStreak(progress: Progress) {
	const days = Object.keys(progress)
		.filter((key) => progress[key].ok)
		.map(dayNumber)
		.sort((a, b) => a - b);
	let best = 0;
	let run = 0;
	days.forEach((n, i) => {
		run = i > 0 && n === days[i - 1] + 1 ? run + 1 : 1;
		best = Math.max(best, run);
	});
	return best;
}

/** Los últimos días, del más viejo a hoy, para la tira de la racha. */
export function lastDays(today: string, count: number) {
	const n = dayNumber(today);
	return Array.from({ length: count }, (_, i) => keyOf(n - count + 1 + i));
}

/* ---------- Niveles e insignias ---------- */

export const NIVELES: readonly { title: string; xp: number }[] = [
	{ title: 'Novato', xp: 0 },
	{ title: 'Aprendiz', xp: 30 },
	{ title: 'Junior', xp: 80 },
	{ title: 'Mid', xp: 160 },
	{ title: 'Senior', xp: 280 },
	{ title: 'Staff', xp: 450 },
	{ title: 'Principal', xp: 700 },
	{ title: 'Leyenda', xp: 1000 },
];

export function levelOf(xp: number) {
	let index = 0;
	NIVELES.forEach((nivel, i) => {
		if (xp >= nivel.xp) index = i;
	});
	return { index, current: NIVELES[index], next: NIVELES[index + 1] ?? null };
}

export interface Stats {
	xp: number;
	solved: number;
	firstTry: number;
	hard: number;
	streak: number;
	best: number;
	level: number;
}

export function statsOf(progress: Progress, today: string): Stats {
	const days = Object.values(progress);
	const xp = days.reduce((sum, dia) => sum + dia.xp, 0);
	return {
		xp,
		solved: days.filter((dia) => dia.ok).length,
		firstTry: days.filter((dia) => dia.ok && dia.tries === 1).length,
		hard: days.filter((dia) => dia.ok && dia.dificultad === 'dificil').length,
		streak: currentStreak(progress, today),
		best: bestStreak(progress),
		level: levelOf(xp).index + 1,
	};
}

export interface Insignia {
	key: string;
	title: string;
	detail: string;
	icon: string;
	goal: number;
	count: (stats: Stats) => number;
}

export const INSIGNIAS: readonly Insignia[] = [
	{ key: 'primero', title: 'Primer reto', detail: 'Resuelves tu primer reto.', icon: 'circle-check', goal: 1, count: (s) => s.solved },
	{ key: 'diez', title: 'Diez retos', detail: 'Resuelves diez retos.', icon: 'medal', goal: 10, count: (s) => s.solved },
	{ key: 'treinta', title: 'Treinta retos', detail: 'Resuelves treinta retos.', icon: 'award', goal: 30, count: (s) => s.solved },
	{ key: 'certero', title: 'A la primera', detail: 'Cinco retos sin fallar ni una.', icon: 'target-arrow', goal: 5, count: (s) => s.firstTry },
	{ key: 'duro', title: 'Sin miedo', detail: 'Resuelves un reto difícil.', icon: 'stairs-up', goal: 1, count: (s) => s.hard },
	{ key: 'racha-3', title: 'Tres seguidos', detail: 'Racha de tres días.', icon: 'flame', goal: 3, count: (s) => s.best },
	{ key: 'racha-7', title: 'Una semana', detail: 'Racha de siete días.', icon: 'calendar-check', goal: 7, count: (s) => s.best },
	{ key: 'racha-30', title: 'Un mes', detail: 'Racha de treinta días.', icon: 'trophy', goal: 30, count: (s) => s.best },
	{ key: 'nivel-4', title: 'Mid', detail: 'Llegas al nivel 4.', icon: 'badge', goal: 4, count: (s) => s.level },
];
