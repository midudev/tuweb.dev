/*
 * El golf de código: un problema al día y gana quien lo resuelve en menos
 * líneas. Aquí no se ejecuta nada —ni eval ni new Function—: tu código se
 * cuenta, no se corre. Las pruebas las pasas tú, en el playground o donde
 * quieras, y lo dices con un clic. La clasificación se arma con códigos que
 * se pasan de mano en mano, como la del reto diario.
 */

import { dayKey } from './diario';

export { dayKey };

export interface Hoyo {
	id: string;
	titulo: string;
	/** Lo que tiene que hacer la función. */
	enunciado: string;
	/** El coste que se pide: no vale cualquier solución. */
	coste: string;
	/** Llamadas y lo que tienen que devolver. */
	pruebas: string[];
	/** Una solución limpia, línea a línea. Sus líneas son el par. */
	solucion: string[];
}

export const HOYOS: readonly Hoyo[] = [
	{
		id: 'suma-pares',
		titulo: 'Suma de pares',
		enunciado: 'Devuelve la suma de los números pares del array.',
		coste: 'O(n)',
		pruebas: ['sumaPares([1, 2, 3, 4]) → 6', 'sumaPares([7, 9]) → 0', 'sumaPares([]) → 0'],
		solucion: [
			'function sumaPares(nums) {',
			'  return nums.filter((n) => n % 2 === 0).reduce((s, n) => s + n, 0)',
			'}',
		],
	},
	{
		id: 'fizzbuzz',
		titulo: 'FizzBuzz',
		enunciado: 'Del 1 al n, como texto: Fizz si es múltiplo de 3, Buzz si de 5 y FizzBuzz si de los dos.',
		coste: 'O(n)',
		pruebas: ["fizzBuzz(5) → ['1', '2', 'Fizz', '4', 'Buzz']", "fizzBuzz(15).at(-1) → 'FizzBuzz'"],
		solucion: [
			'function fizzBuzz(n) {',
			'  return Array.from({ length: n }, (_, i) => {',
			'    const k = i + 1',
			"    return (k % 3 ? '' : 'Fizz') + (k % 5 ? '' : 'Buzz') || String(k)",
			'  })',
			'}',
		],
	},
	{
		id: 'max-subarray',
		titulo: 'El mejor tramo',
		enunciado: 'La suma más alta de un tramo seguido del array, con al menos un número.',
		coste: 'O(n), sin probar todos los tramos',
		pruebas: ['maxSubarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) → 6', 'maxSubarray([-3, -1]) → -1'],
		solucion: [
			'function maxSubarray(nums) {',
			'  let mejor = nums[0], actual = 0',
			'  for (const n of nums) {',
			'    actual = Math.max(n, actual + n)',
			'    mejor = Math.max(mejor, actual)',
			'  }',
			'  return mejor',
			'}',
		],
	},
	{
		id: 'dos-sumas',
		titulo: 'Dos que suman',
		enunciado: 'Los índices de los dos números que suman el objetivo, o null si no hay.',
		coste: 'O(n), una sola pasada',
		pruebas: ['dosSumas([2, 7, 11, 15], 9) → [0, 1]', 'dosSumas([3, 2, 4], 6) → [1, 2]', 'dosSumas([1, 2], 7) → null'],
		solucion: [
			'function dosSumas(nums, objetivo) {',
			'  const vistos = new Map()',
			'  for (let i = 0; i < nums.length; i++) {',
			'    const falta = objetivo - nums[i]',
			'    if (vistos.has(falta)) return [vistos.get(falta), i]',
			'    vistos.set(nums[i], i)',
			'  }',
			'  return null',
			'}',
		],
	},
	{
		id: 'criba',
		titulo: 'Criba de primos',
		enunciado: 'Todos los primos hasta n, de menor a mayor.',
		coste: 'O(n log log n), nada de probar divisores uno a uno',
		pruebas: ['primosHasta(20) → [2, 3, 5, 7, 11, 13, 17, 19]', 'primosHasta(1) → []'],
		solucion: [
			'function primosHasta(n) {',
			'  const es = Array(n + 1).fill(true)',
			'  const primos = []',
			'  for (let i = 2; i <= n; i++) {',
			'    if (!es[i]) continue',
			'    primos.push(i)',
			'    for (let j = i * i; j <= n; j += i) es[j] = false',
			'  }',
			'  return primos',
			'}',
		],
	},
	{
		id: 'comprimir',
		titulo: 'Comprimir',
		enunciado: 'Cada tramo de letras iguales pasa a la letra y cuántas veces sale.',
		coste: 'O(n)',
		pruebas: ["comprimir('aaabcc') → 'a3b1c2'", "comprimir('') → ''"],
		solucion: [
			'function comprimir(texto) {',
			'  return texto.replace(/(.)\\1*/g, (tramo, c) => c + tramo.length)',
			'}',
		],
	},
	{
		id: 'fibonacci',
		titulo: 'Fibonacci',
		enunciado: 'El número n de Fibonacci, empezando en fib(0) = 0.',
		coste: 'O(n), sin recursión que repita cuentas',
		pruebas: ['fib(10) → 55', 'fib(0) → 0'],
		solucion: [
			'function fib(n) {',
			'  let a = 0, b = 1',
			'  for (let i = 0; i < n; i++) [a, b] = [b, a + b]',
			'  return a',
			'}',
		],
	},
	{
		id: 'equilibrado',
		titulo: 'Paréntesis',
		enunciado: 'Di si los (), [] y {} del texto abren y cierran bien.',
		coste: 'O(n), con una pila',
		pruebas: ["equilibrado('([]{})') → true", "equilibrado('(]') → false", "equilibrado('((') → false"],
		solucion: [
			'function equilibrado(texto) {',
			'  const pila = []',
			"  const pares = { ')': '(', ']': '[', '}': '{' }",
			'  for (const c of texto) {',
			"    if ('([{'.includes(c)) pila.push(c)",
			'    else if (pares[c] && pila.pop() !== pares[c]) return false',
			'  }',
			'  return pila.length === 0',
			'}',
		],
	},
	{
		id: 'primero-unico',
		titulo: 'El primero solo',
		enunciado: 'La primera letra que sale una sola vez, o null si no hay.',
		coste: 'O(n), nada de comparar todas con todas',
		pruebas: ["primeroUnico('aabccdb') → 'd'", "primeroUnico('aa') → null"],
		solucion: [
			'function primeroUnico(texto) {',
			'  const veces = new Map()',
			'  for (const c of texto) veces.set(c, (veces.get(c) ?? 0) + 1)',
			'  for (const c of texto) if (veces.get(c) === 1) return c',
			'  return null',
			'}',
		],
	},
];

const DAY = 24 * 60 * 60 * 1000;

export function hoyoDelDia(key: string) {
	const [y, m, d] = key.split('-').map(Number);
	return HOYOS[Math.round(Date.UTC(y, m - 1, d) / DAY) % HOYOS.length];
}

export function hoyoPorId(id: string) {
	return HOYOS.find((hoyo) => hoyo.id === id);
}

/* ---------- La cuenta ---------- */

/** Una línea de más de 80 caracteres cuenta por cada 80: meterlo todo en una no sale gratis. */
export const ANCHO = 80;
export const CODIGO_MAX = 4000;

/** Las líneas en blanco y los comentarios de línea no cuentan. Los caracteres, sin espacios. */
export function medir(codigo: string) {
	let lineas = 0;
	let caracteres = 0;
	for (const linea of codigo.split(/\r\n|\r|\n/)) {
		const limpia = linea.trim();
		if (!limpia || limpia.startsWith('//')) continue;
		lineas += Math.ceil(linea.trimEnd().length / ANCHO);
		caracteres += limpia.replace(/\s+/g, '').length;
	}
	return { lineas, caracteres };
}

export function par(hoyo: Hoyo) {
	return medir(hoyo.solucion.join('\n')).lineas;
}

/** -2, par o +1. */
export function contraPar(lineas: number, hoyo: Hoyo) {
	const diferencia = lineas - par(hoyo);
	return diferencia === 0 ? 'par' : diferencia > 0 ? `+${diferencia}` : String(diferencia);
}

/* ---------- Lo guardado ---------- */

export interface Tarjeta {
	hoyo: string;
	codigo: string;
	/** Lo dices tú: aquí no se ejecuta nada. */
	probado: boolean;
}

export type Tarjetas = Record<string, Tarjeta>;

export const KEY = 'tuweb:golf';
export const LIGA_KEY = 'tuweb:golf-liga';

export function readTarjetas(): Tarjetas {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Partial<Tarjeta>>;
		const out: Tarjetas = {};
		for (const [key, value] of Object.entries(raw ?? {})) {
			if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value || typeof value !== 'object') continue;
			out[key] = {
				hoyo: String(value.hoyo ?? ''),
				codigo: String(value.codigo ?? '').slice(0, CODIGO_MAX),
				probado: value.probado === true,
			};
		}
		return out;
	} catch {
		return {};
	}
}

export function saveTarjetas(tarjetas: Tarjetas) {
	try {
		localStorage.setItem(KEY, JSON.stringify(tarjetas));
	} catch {
		// Sin almacenamiento, dura lo que dure la visita.
	}
}

/* ---------- La clasificación ---------- */

export interface Golpe {
	nombre: string;
	hoyo: string;
	dia: string;
	lineas: number;
	caracteres: number;
}

export interface Liga {
	nombre: string;
	rivales: Golpe[];
}

/** Una liga de amigos y unos cuantos días, no un archivo. */
export const RIVALES_MAX = 60;

const CODIGO = /^golf\.([\p{L}\p{N}_-]{1,20})\.([a-z0-9-]{1,30})\.(\d{4}-\d{2}-\d{2})\.(\d{1,3})\.(\d{1,5})$/u;

export function codigoDe(golpe: Golpe) {
	return `golf.${golpe.nombre || 'anon'}.${golpe.hoyo}.${golpe.dia}.${golpe.lineas}.${golpe.caracteres}`;
}

/** Un código pegado, o null si no cuadra. Lo imposible tampoco entra. */
export function leeCodigo(text: string): Golpe | null {
	const match = CODIGO.exec(text.trim());
	if (!match) return null;
	const [, nombre, hoyo, dia, lineas, caracteres] = match;
	const golpe = { nombre, hoyo, dia, lineas: Number(lineas), caracteres: Number(caracteres) };
	if (!hoyoPorId(hoyo) || golpe.lineas < 1 || golpe.caracteres < golpe.lineas) return null;
	if (golpe.caracteres > golpe.lineas * ANCHO) return null;
	return golpe;
}

export function readLiga(): Liga {
	try {
		const raw = JSON.parse(localStorage.getItem(LIGA_KEY) ?? '{}') as Partial<Liga>;
		const rivales = Array.isArray(raw.rivales)
			? raw.rivales
					.map((item) => (item && typeof item === 'object' ? leeCodigo(codigoDe(item)) : null))
					.filter((item): item is Golpe => item !== null)
					.slice(-RIVALES_MAX)
			: [];
		return { nombre: String(raw.nombre ?? ''), rivales };
	} catch {
		return { nombre: '', rivales: [] };
	}
}

export function saveLiga(liga: Liga) {
	try {
		localStorage.setItem(LIGA_KEY, JSON.stringify(liga));
	} catch {
		// Sin almacenamiento, la liga dura lo que dure la visita.
	}
}

const mismo = (a: Golpe, b: Golpe) =>
	a.nombre.toLowerCase() === b.nombre.toLowerCase() && a.hoyo === b.hoyo && a.dia === b.dia;

/** Mete o actualiza a alguien: una fila por persona y día. Si pasa del tope, se van los más viejos. */
export function addRival(liga: Liga, golpe: Golpe): Liga | string {
	if (golpe.nombre.toLowerCase() === (liga.nombre || 'anon').toLowerCase()) return 'Ese código es el tuyo.';
	const otros = liga.rivales.filter((item) => !mismo(item, golpe));
	return { ...liga, rivales: [...otros, golpe].slice(-RIVALES_MAX) };
}

export interface Puesto extends Golpe {
	position: number;
	yo: boolean;
}

/** Los del hoyo de hoy, por líneas y luego por caracteres. Mismo todo, mismo puesto. */
export function clasificacion(liga: Liga, yo: Golpe | null, hoyo: string, dia: string): Puesto[] {
	const filas = [
		...(yo ? [{ ...yo, yo: true }] : []),
		...liga.rivales.filter((item) => item.hoyo === hoyo && item.dia === dia).map((item) => ({ ...item, yo: false })),
	].sort((a, b) => a.lineas - b.lineas || a.caracteres - b.caracteres || Number(b.yo) - Number(a.yo));
	let position = 0;
	return filas.map((fila, i) => {
		const antes = filas[i - 1];
		if (!antes || antes.lineas !== fila.lineas || antes.caracteres !== fila.caracteres) position = i + 1;
		return { ...fila, position };
	});
}
