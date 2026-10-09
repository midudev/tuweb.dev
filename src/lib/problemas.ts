/*
 * El problema algorítmico de la semana. Cada lunes toca uno del catálogo, con
 * una entrada que sale de una semilla: la misma para todo el mundo esa semana.
 * Se resuelve fuera, con tu código y en tu máquina; aquí solo se compara la
 * respuesta con la que calcula la casa. Nada se ejecuta: ni eval ni Function.
 * Lo que llevas, los intentos y las medallas se quedan en tu navegador.
 */
import { weekStart } from './retos';

export interface Problema {
	id: string;
	title: string;
	/** Qué hay que calcular, en dos o tres frases. */
	enunciado: string;
	/** El formato de la entrada, en una línea. */
	formato: string;
	ejemplo: { entrada: string; salida: string };
	/** La idea que lo saca en tiempo, para quien se atasque. */
	pista: string;
	generar: (azar: () => number) => string;
	resolver: (entrada: string) => number;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Las primeras horas de la semana: acertar a la primera dentro de ellas da oro. */
export const ORO_HORAS = 48;
/** Hasta cuántos intentos hay plata. */
export const PLATA_INTENTOS = 3;

/** Un generador con semilla (mulberry32): misma semana, misma entrada para todos. */
function semilla(texto: string) {
	let h = 2166136261;
	for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
	let a = h >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const entero = (azar: () => number, min: number, max: number) => min + Math.floor(azar() * (max - min + 1));
const lista = (azar: () => number, n: number, min: number, max: number) =>
	Array.from({ length: n }, () => entero(azar, min, max));
const numeros = (linea: string) => linea.trim().split(/\s+/).filter(Boolean).map(Number);
const lineas = (entrada: string) => entrada.trim().split('\n');

export const CATALOGO: readonly Problema[] = [
	{
		id: 'subarray',
		title: 'La racha más rentable',
		enunciado:
			'Te dan las ganancias de cada día, positivas o negativas. ¿Cuánto suma el tramo de días seguidos que más suma? El tramo tiene al menos un día.',
		formato: '200 enteros entre -100 y 100, separados por espacios.',
		ejemplo: { entrada: '-2 1 -3 4 -1 2 1 -5 4', salida: '6' },
		pista: 'Kadane: recorre una vez y, en cada día, decide si sigues el tramo o empiezas otro.',
		generar: (azar) => lista(azar, 200, -100, 100).join(' '),
		resolver: (entrada) => {
			let mejor = -Infinity;
			let actual = 0;
			for (const n of numeros(entrada)) {
				actual = Math.max(n, actual + n);
				mejor = Math.max(mejor, actual);
			}
			return mejor;
		},
	},
	{
		id: 'parejas',
		title: 'Parejas que suman',
		enunciado:
			'La primera línea es un objetivo K. ¿Cuántas parejas de posiciones distintas (i < j) de la lista suman exactamente K?',
		formato: 'K en la primera línea; en la segunda, 300 enteros entre 1 y 100.',
		ejemplo: { entrada: '6\n1 5 3 3 2 4', salida: '3' },
		pista: 'Con dos bucles va, pero con un Map de lo ya visto basta una pasada.',
		generar: (azar) => `${entero(azar, 60, 140)}\n${lista(azar, 300, 1, 100).join(' ')}`,
		resolver: (entrada) => {
			const [cabecera, resto = ''] = lineas(entrada);
			const k = Number(cabecera);
			const vistos = new Map<number, number>();
			let parejas = 0;
			for (const n of numeros(resto)) {
				parejas += vistos.get(k - n) ?? 0;
				vistos.set(n, (vistos.get(n) ?? 0) + 1);
			}
			return parejas;
		},
	},
	{
		id: 'creciente',
		title: 'La escalera más larga',
		enunciado:
			'¿Cuántos números tiene la subsecuencia estrictamente creciente más larga? No tienen que ir seguidos, pero sí en su orden.',
		formato: '150 enteros entre 1 y 1000, separados por espacios.',
		ejemplo: { entrada: '10 9 2 5 3 7 101 18', salida: '4' },
		pista: 'Programación dinámica en n², o en n log n guardando el menor final de cada longitud.',
		generar: (azar) => lista(azar, 150, 1, 1000).join(' '),
		resolver: (entrada) => {
			const finales: number[] = [];
			for (const n of numeros(entrada)) {
				let lo = 0;
				let hi = finales.length;
				while (lo < hi) {
					const mid = (lo + hi) >> 1;
					if (finales[mid] < n) lo = mid + 1;
					else hi = mid;
				}
				finales[lo] = n;
			}
			return finales.length;
		},
	},
	{
		id: 'parentesis',
		title: 'Paréntesis que cierran',
		enunciado:
			'Una cadena de paréntesis. ¿Cuánto mide el trozo seguido más largo que está bien cerrado?',
		formato: 'Una línea de 400 caracteres, solo ( y ).',
		ejemplo: { entrada: '(()))())(', salida: '4' },
		pista: 'Una pila con las posiciones: cuando se vacía, la última que no cerró marca el principio.',
		generar: (azar) => Array.from({ length: 400 }, () => (azar() < 0.55 ? '(' : ')')).join(''),
		resolver: (entrada) => {
			const pila = [-1];
			let mejor = 0;
			[...entrada.trim()].forEach((c, i) => {
				if (c === '(') return pila.push(i);
				pila.pop();
				if (pila.length === 0) pila.push(i);
				else mejor = Math.max(mejor, i - pila[pila.length - 1]);
			});
			return mejor;
		},
	},
	{
		id: 'islas',
		title: 'Cuenta las islas',
		enunciado:
			'Un mapa de tierra (#) y agua (.). Una isla es tierra unida por arriba, abajo, izquierda o derecha; en diagonal no cuenta. ¿Cuántas islas hay?',
		formato: '30 líneas de 40 caracteres, # o punto.',
		ejemplo: { entrada: '##..\n#..#\n..##', salida: '2' },
		pista: 'Recorre el mapa y, cada vez que pises tierra nueva, húndela entera con una búsqueda en anchura.',
		generar: (azar) =>
			Array.from({ length: 30 }, () =>
				Array.from({ length: 40 }, () => (azar() < 0.4 ? '#' : '.')).join(''),
			).join('\n'),
		resolver: (entrada) => {
			const mapa = lineas(entrada).map((fila) => [...fila.trim()]);
			let islas = 0;
			mapa.forEach((fila, y) =>
				fila.forEach((celda, x) => {
					if (celda !== '#') return;
					islas += 1;
					const cola = [[y, x]];
					mapa[y][x] = '.';
					while (cola.length > 0) {
						const [cy, cx] = cola.pop()!;
						for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
							const ny = cy + dy;
							const nx = cx + dx;
							if (mapa[ny]?.[nx] !== '#') continue;
							mapa[ny][nx] = '.';
							cola.push([ny, nx]);
						}
					}
				}),
			);
			return islas;
		},
	},
	{
		id: 'escalera',
		title: 'Subir la escalera',
		enunciado:
			'Subes N escalones dando pasos de 1, 2 o 3. ¿De cuántas formas distintas puedes llegar arriba? Da el resultado módulo 1000000007.',
		formato: 'Un entero N, entre 50 y 99.',
		ejemplo: { entrada: '4', salida: '7' },
		pista: 'Las formas de llegar a un escalón son la suma de las de los tres de antes.',
		generar: (azar) => String(entero(azar, 50, 99)),
		resolver: (entrada) => {
			const MOD = 1_000_000_007;
			const n = Number(entrada.trim());
			const formas = [1, 1, 2];
			for (let i = 3; i <= n; i++) formas[i] = (formas[i - 1] + formas[i - 2] + formas[i - 3]) % MOD;
			return formas[n];
		},
	},
	{
		id: 'intervalos',
		title: 'Lo que tapan los toldos',
		enunciado:
			'Cada línea es un toldo que tapa de A a B en una calle, sin incluir B. Algunos se pisan. ¿Cuántos metros de calle quedan tapados en total?',
		formato: '100 líneas con dos enteros A y B, con A < B ≤ 10300.',
		ejemplo: { entrada: '1 4\n2 6\n8 10', salida: '7' },
		pista: 'Ordena por donde empiezan y ve fundiendo los que se pisan con el anterior.',
		generar: (azar) =>
			Array.from({ length: 100 }, () => {
				const a = entero(azar, 0, 10000);
				return `${a} ${a + entero(azar, 1, 300)}`;
			}).join('\n'),
		resolver: (entrada) => {
			const tramos = lineas(entrada)
				.map((linea) => numeros(linea))
				.sort((x, y) => x[0] - y[0]);
			let total = 0;
			let fin = -Infinity;
			for (const [a, b] of tramos) {
				if (b <= fin) continue;
				total += b - Math.max(a, fin);
				fin = b;
			}
			return total;
		},
	},
];

export function problemaDe(week: number) {
	const n = CATALOGO.length;
	return CATALOGO[((week % n) + n) % n];
}

export function entradaDe(week: number) {
	const problema = problemaDe(week);
	return problema.generar(semilla(`tuweb:${week}:${problema.id}`));
}

export function respuestaDe(week: number) {
	return String(problemaDe(week).resolver(entradaDe(week)));
}

/** El lunes de una semana por su número: el jueves en UTC siempre cae dentro. */
export function lunesDe(week: number) {
	return weekStart(Date.UTC(1970, 0, 5) + week * 7 * DAY + 3 * DAY);
}

/** Lo escrito, sin espacios ni separadores de miles: «1.234» vale como 1234. */
export function limpiaRespuesta(texto: string) {
	return texto.trim().replace(/[\s.,_]/g, '');
}

/* ---------- Lo guardado ---------- */

export type Medalla = 'oro' | 'plata' | 'bronce';

export const MEDALLAS: Record<Medalla, { label: string; icon: string; detail: string }> = {
	oro: { label: 'Destacada', icon: 'crown', detail: `A la primera y en las primeras ${ORO_HORAS} horas.` },
	plata: { label: 'Plata', icon: 'medal', detail: `En ${PLATA_INTENTOS} intentos o menos.` },
	bronce: { label: 'Bronce', icon: 'award', detail: 'Resuelto, aunque costara.' },
};

export interface Intento {
	intentos: number;
	ok: boolean;
	/** Cuándo acertaste. */
	at: number;
	/** Cuántas horas pasaron desde el lunes hasta el acierto. */
	horas: number;
}

export type Registro = Record<string, Intento>;

const KEY = 'tuweb:problema-semana';

export function readRegistro(): Registro {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as unknown;
		if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
		const out: Registro = {};
		for (const [week, value] of Object.entries(raw as Record<string, Partial<Intento>>)) {
			if (!/^-?\d+$/.test(week) || !value || typeof value !== 'object') continue;
			const intentos = Math.min(Math.max(Math.floor(Number(value.intentos) || 0), 0), 999);
			if (intentos === 0) continue;
			out[week] = {
				intentos,
				ok: value.ok === true,
				at: Number.isFinite(value.at) ? Number(value.at) : 0,
				horas: Math.min(Math.max(Number(value.horas) || 0, 0), 7 * 24),
			};
		}
		return out;
	} catch {
		return {};
	}
}

export function saveRegistro(registro: Registro) {
	try {
		localStorage.setItem(KEY, JSON.stringify(registro));
	} catch {
		// Sin almacenamiento, dura lo que dura la visita.
	}
}

/** Prueba una respuesta. Una vez acertado, no se cuentan más intentos. */
export function intentar(registro: Registro, week: number, texto: string, now: number) {
	const key = String(week);
	const antes = registro[key];
	if (antes?.ok) return { registro, ok: true };

	const ok = limpiaRespuesta(texto) === respuestaDe(week);
	const horas = Math.floor((now - lunesDe(week)) / HOUR);
	const nuevo: Intento = { intentos: (antes?.intentos ?? 0) + 1, ok, at: ok ? now : 0, horas: ok ? horas : 0 };
	return { registro: { ...registro, [key]: nuevo }, ok };
}

export function medallaDe(intento: Intento | undefined): Medalla | null {
	if (!intento?.ok) return null;
	if (intento.intentos === 1 && intento.horas < ORO_HORAS) return 'oro';
	if (intento.intentos <= PLATA_INTENTOS) return 'plata';
	return 'bronce';
}

/** Las semanas resueltas, de la más nueva a la más vieja, con su medalla. */
export function palmares(registro: Registro) {
	return Object.entries(registro)
		.map(([week, intento]) => ({ week: Number(week), intento, medalla: medallaDe(intento) }))
		.filter((item): item is { week: number; intento: Intento; medalla: Medalla } => item.medalla !== null)
		.sort((a, b) => b.week - a.week);
}
