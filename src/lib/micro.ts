/*
 * Los micro-retos: tres al día, generados con la fecha como semilla, así que
 * todo el mundo tiene los mismos números. Cada uno es un algoritmo optimizado
 * y se pregunta qué sale por consola. Aquí no se ejecuta nada: la respuesta la
 * calcula este fichero con su propia copia del algoritmo. La clasificación se
 * arma con códigos que se pasan de mano en mano, como la del reto diario.
 */

import { limpiaNombre } from './diario';

export interface Micro {
	titulo: string;
	code: string[];
	respuesta: number;
	porque: string;
}

type Azar = () => number;

/** mulberry32: el mismo día da los mismos números en todos los navegadores. */
function semilla(key: string): Azar {
	const [y, m, d] = key.split('-').map(Number);
	let a = Math.round(Date.UTC(y, m - 1, d) / 86400000) * 2654435761;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const entre = (azar: Azar, min: number, max: number) => min + Math.floor(azar() * (max - min + 1));

function ordenados(azar: Azar, largo: number) {
	const nums = [entre(azar, 1, 5)];
	while (nums.length < largo) nums.push(nums[nums.length - 1] + entre(azar, 1, 6));
	return nums;
}

const lista = (nums: number[]) => `const nums = [${nums.join(', ')}]`;

const GENERADORES: ((azar: Azar) => Micro)[] = [
	function binaria(azar) {
		const nums = ordenados(azar, entre(azar, 9, 15));
		const indice = entre(azar, 0, nums.length - 1);
		const t = nums[indice];
		let [lo, hi, vueltas] = [0, nums.length - 1, 0];
		while (lo <= hi) {
			vueltas++;
			const mid = Math.floor((lo + hi) / 2);
			if (nums[mid] === t) break;
			if (nums[mid] < t) lo = mid + 1;
			else hi = mid - 1;
		}
		return {
			titulo: 'Búsqueda binaria',
			code: [
				lista(nums),
				'let lo = 0, hi = nums.length - 1, vueltas = 0',
				'while (lo <= hi) {',
				'  vueltas++',
				'  const mid = Math.floor((lo + hi) / 2)',
				`  if (nums[mid] === ${t}) break`,
				`  if (nums[mid] < ${t}) lo = mid + 1`,
				'  else hi = mid - 1',
				'}',
				'console.log(vueltas)',
			],
			respuesta: vueltas,
			porque: `Cada vuelta descarta la mitad. Buscando uno a uno habrían sido ${indice + 1}.`,
		};
	},
	function memo(azar) {
		const n = entre(azar, 7, 14);
		const vistos = new Map<number, number>();
		let llamadas = 0;
		const fib = (k: number): number => {
			llamadas++;
			if (k < 2) return k;
			const visto = vistos.get(k);
			if (visto !== undefined) return visto;
			const r = fib(k - 1) + fib(k - 2);
			vistos.set(k, r);
			return r;
		};
		fib(n);
		// Sin memoria, fib(n) hace 2 · fib(n + 1) - 1 llamadas.
		let [a, b] = [0, 1];
		for (let i = 0; i <= n; i++) [a, b] = [b, a + b];
		return {
			titulo: 'Fibonacci con memoria',
			code: [
				'const memo = new Map()',
				'let llamadas = 0',
				'function fib(n) {',
				'  llamadas++',
				'  if (n < 2) return n',
				'  if (memo.has(n)) return memo.get(n)',
				'  const r = fib(n - 1) + fib(n - 2)',
				'  memo.set(n, r)',
				'  return r',
				'}',
				`fib(${n})`,
				'console.log(llamadas)',
			],
			respuesta: llamadas,
			porque: `Sin la memoria serían ${2 * a - 1}: cada valor se calcula una vez y el resto se lee del Map.`,
		};
	},
	function ventana(azar) {
		const nums = Array.from({ length: entre(azar, 8, 11) }, () => entre(azar, -6, 9));
		const k = entre(azar, 3, 4);
		let suma = nums.slice(0, k).reduce((s, n) => s + n, 0);
		let mejor = suma;
		for (let i = k; i < nums.length; i++) {
			suma += nums[i] - nums[i - k];
			mejor = Math.max(mejor, suma);
		}
		return {
			titulo: 'Ventana deslizante',
			code: [
				lista(nums),
				'let suma = 0',
				`for (let i = 0; i < ${k}; i++) suma += nums[i]`,
				'let mejor = suma',
				`for (let i = ${k}; i < nums.length; i++) {`,
				`  suma += nums[i] - nums[i - ${k}]`,
				'  mejor = Math.max(mejor, suma)',
				'}',
				'console.log(mejor)',
			],
			respuesta: mejor,
			porque: `Sumar cada tramo entero son ${(nums.length - k + 1) * k} sumas; la ventana mete uno y saca otro en ${nums.length} pasos.`,
		};
	},
	function criba(azar) {
		const n = entre(azar, 25, 60);
		const cuenta = (desde: (i: number) => number) => {
			const es = Array(n + 1).fill(true);
			let tachados = 0;
			for (let i = 2; i * i <= n; i++) {
				if (!es[i]) continue;
				for (let j = desde(i); j <= n; j += i) {
					es[j] = false;
					tachados++;
				}
			}
			return tachados;
		};
		return {
			titulo: 'Criba de Eratóstenes',
			code: [
				`const es = Array(${n + 1}).fill(true)`,
				'let tachados = 0',
				`for (let i = 2; i * i <= ${n}; i++) {`,
				'  if (!es[i]) continue',
				`  for (let j = i * i; j <= ${n}; j += i) {`,
				'    es[j] = false',
				'    tachados++',
				'  }',
				'}',
				'console.log(tachados)',
			],
			respuesta: cuenta((i) => i * i),
			porque: `Empezar en i * i se salta lo que ya tachó un primo menor. Desde 2 * i serían ${cuenta((i) => 2 * i)}.`,
		};
	},
];

export const POR_DIA = 3;

/** Los tres del día: qué algoritmos tocan y con qué números. */
export function retosDelDia(key: string): Micro[] {
	const azar = semilla(key);
	const orden = GENERADORES.map((_, i) => i);
	for (let i = orden.length - 1; i > 0; i--) {
		const j = Math.floor(azar() * (i + 1));
		[orden[i], orden[j]] = [orden[j], orden[i]];
	}
	return orden.slice(0, POR_DIA).map((i) => GENERADORES[i](azar));
}

/** Solo vale un entero: «7», « 7 » o «-3». */
export const acierta = (micro: Micro, texto: string) =>
	/^\s*-?\d+\s*$/.test(texto) && Number(texto) === micro.respuesta;

/* ---------- Los puntos ---------- */

export const TRIES = 2;
export const PUNTOS = 100;
/** Un punto por cada segundo que te sobre de los tres minutos, si aciertas alguno. */
export const BONO_MAX = 180;

export interface Dia {
	inicio: number;
	tries: number[];
	ok: boolean[];
	/** Se apunta al cerrar los tres. */
	segundos?: number;
}

export type Progreso = Record<string, Dia>;

export const cerrado = (dia: Dia, i: number) => dia.ok[i] || dia.tries[i] >= TRIES;
export const terminado = (dia: Dia | undefined): dia is Dia =>
	!!dia && dia.ok.every((_, i) => cerrado(dia, i));

export function puntosDe(dia: Dia) {
	const aciertos = dia.ok.filter(Boolean).length;
	const base = dia.ok.reduce((s, ok, i) => s + (ok ? (dia.tries[i] === 1 ? PUNTOS : PUNTOS / 2) : 0), 0);
	const bono = aciertos && dia.segundos !== undefined ? Math.max(0, BONO_MAX - dia.segundos) : 0;
	return { aciertos, base, bono, total: base + bono };
}

export const KEY = 'tuweb:micro';
export const LIGA_KEY = 'tuweb:micro-liga';

function guarda(key: string, value: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Sin almacenamiento, dura lo que dure la visita.
	}
}

export function readProgreso(): Progreso {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Partial<Dia>>;
		const out: Progreso = {};
		for (const [key, value] of Object.entries(raw ?? {})) {
			if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value || typeof value !== 'object') continue;
			const tries = Array.isArray(value.tries) ? value.tries : [];
			const ok = Array.isArray(value.ok) ? value.ok : [];
			out[key] = {
				inicio: Number(value.inicio) || 0,
				tries: Array.from({ length: POR_DIA }, (_, i) => Math.min(TRIES, Math.max(0, Number(tries[i]) || 0))),
				ok: Array.from({ length: POR_DIA }, (_, i) => ok[i] === true),
				segundos: typeof value.segundos === 'number' ? Math.max(0, Math.floor(value.segundos)) : undefined,
			};
		}
		return out;
	} catch {
		return {};
	}
}

export const saveProgreso = (progreso: Progreso) => guarda(KEY, progreso);

/* ---------- La clasificación ---------- */

/** Lo que dice un código: quién, qué día, cuántos puntos, en cuánto tiempo y cuántos acertó. */
export type Marca = { nombre: string; dia: string; puntos: number; segundos: number; aciertos: number };
export type Liga = { nombre: string; rivales: Marca[] };

/** Unos cuantos días de una liga de amigos, no un archivo. */
export const RIVALES_MAX = 120;

const CODIGO = /^micro\.([\p{L}\p{N}_-]{1,20})\.(\d{4}-\d{2}-\d{2})\.(\d{1,3})\.(\d{1,5})\.(\d)$/u;

export const codigoDe = (marca: Marca) =>
	`micro.${marca.nombre || 'anon'}.${marca.dia}.${marca.puntos}.${marca.segundos}.${marca.aciertos}`;

/** Un código pegado, o null si no cuadra. Lo imposible tampoco entra. */
export function leeCodigo(text: string): Marca | null {
	const match = CODIGO.exec(text.trim());
	if (!match) return null;
	const [, nombre, dia, puntos, segundos, aciertos] = match;
	const marca = { nombre, dia, puntos: Number(puntos), segundos: Number(segundos), aciertos: Number(aciertos) };
	if (marca.aciertos > POR_DIA) return null;
	if (marca.puntos > marca.aciertos * PUNTOS + (marca.aciertos ? BONO_MAX : 0)) return null;
	return marca;
}

export function readLiga(): Liga {
	try {
		const raw = JSON.parse(localStorage.getItem(LIGA_KEY) ?? '{}') as Partial<Liga>;
		const rivales = Array.isArray(raw.rivales)
			? raw.rivales
					.map((item) => (item && typeof item === 'object' ? leeCodigo(codigoDe(item)) : null))
					.filter((item): item is Marca => item !== null)
					.slice(-RIVALES_MAX)
			: [];
		return { nombre: limpiaNombre(String(raw.nombre ?? '')), rivales };
	} catch {
		return { nombre: '', rivales: [] };
	}
}

export const saveLiga = (liga: Liga) => guarda(LIGA_KEY, liga);

export const quien = (nombre: string) => (nombre || 'anon').toLowerCase();

/** Mete o actualiza a alguien: una fila por persona y día. */
export function addRival(liga: Liga, marca: Marca): Liga | string {
	if (quien(marca.nombre) === quien(liga.nombre)) return 'Ese código es el tuyo.';
	const otros = liga.rivales.filter((item) => !(quien(item.nombre) === quien(marca.nombre) && item.dia === marca.dia));
	return { ...liga, rivales: [...otros, marca].slice(-RIVALES_MAX) };
}

export type Modo = 'hoy' | 'siempre';

export interface Fila extends Omit<Marca, 'dia'> {
	/** Tú eres ''; los demás, su nombre en minúsculas. */
	id: string;
	dias: number;
	yo: boolean;
	position: number;
}

/** Hoy: por puntos y luego por tiempo. Siempre: los puntos de todos los días, y luego los días. */
export function clasificacion(liga: Liga, progreso: Progreso, hoy: string, modo: Modo): Fila[] {
	const nombre = liga.nombre || 'anon';
	const marcas = [
		...Object.entries(progreso)
			.filter(([, d]) => terminado(d))
			.map(([dia, d]) => ({ nombre, dia, puntos: puntosDe(d).total, segundos: d.segundos ?? 0, aciertos: puntosDe(d).aciertos, yo: true })),
		...liga.rivales.map((marca) => ({ ...marca, yo: false })),
	].filter((marca) => modo === 'siempre' || marca.dia === hoy);

	const filas = new Map<string, Fila>();
	for (const marca of marcas) {
		const id = marca.yo ? '' : quien(marca.nombre);
		const fila = filas.get(id) ?? { id, nombre: marca.nombre, puntos: 0, segundos: 0, dias: 0, aciertos: 0, yo: marca.yo, position: 0 };
		fila.puntos += marca.puntos;
		fila.segundos += marca.segundos;
		fila.aciertos += marca.aciertos;
		fila.dias += 1;
		filas.set(id, fila);
	}

	const desempate = (a: Fila, b: Fila) => (modo === 'hoy' ? a.segundos - b.segundos : b.dias - a.dias);
	const orden = [...filas.values()].sort((a, b) => b.puntos - a.puntos || desempate(a, b) || Number(b.yo) - Number(a.yo));
	let position = 0;
	return orden.map((fila, i) => {
		const antes = orden[i - 1];
		if (!antes || antes.puntos !== fila.puntos || desempate(antes, fila) !== 0) position = i + 1;
		return { ...fila, position };
	});
}
