/*
 * La liga de eficiencia del problema de la semana. Resolverlo da medalla;
 * aquí se compite por cómo: qué coste tiene tu algoritmo, cuánta memoria pide
 * y cuánto tarda con la entrada de la semana en tu máquina. Nada se ejecuta:
 * cada marca es la palabra de quien la firma. Se pasa en un enlace, y quien lo
 * abre la suma a su tabla. Solo vale mejorar: una marca peor no pisa la tuya.
 */
import { FIRMA_MAX } from './soluciones';

/** De mejor a peor: el índice es lo que se compara y lo que viaja en el enlace. */
export const TIEMPOS = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)'] as const;
export const MEMORIAS = ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'] as const;
export const LENGUAJES = { js: 'JavaScript', py: 'Python', otro: 'Otro' } as const;
export type Lenguaje = keyof typeof LENGUAJES;

export const ALGO_MAX = 80;
/** Diez minutos: si tarda más, no es una marca, es una siesta. */
export const MS_MAX = 600_000;
/** Una tabla por semana con la gente que conoces, no una liga entera. */
export const MARCAS_MAX = 30;

export interface Marca {
	nombre: string;
	/** Índice en TIEMPOS. */
	tiempo: number;
	/** Índice en MEMORIAS. */
	memoria: number;
	ms: number;
	lang: Lenguaje;
	/** El algoritmo en una línea: «Kadane, una pasada». */
	algo: string;
	/** Cuántas veces ha mejorado su propia marca esta semana. */
	mejoras: number;
	at: number;
}

interface Guardado {
	/** Tu marca, semana a semana. */
	mias: Record<string, Marca>;
	/** Las que te han pasado, semana a semana. */
	otras: Record<string, Marca[]>;
}

const KEY = 'tuweb:retos-eficiencia';
/** Las semanas que se guardan: más atrás ya no se ven. */
const SEMANAS = 8;
/** El evento que lanza saveEficiencia en la propia pestaña. */
export const CAMBIO_EFICIENCIA = 'tuweb:eficiencia';

const linea = (texto: string, max: number) => texto.replace(/\s+/g, ' ').trim().slice(0, max);
const esLenguaje = (valor: unknown): valor is Lenguaje => valor === 'js' || valor === 'py' || valor === 'otro';
const indice = (valor: unknown, total: number) => {
	const n = Number(valor);
	return Number.isInteger(n) && n >= 0 && n < total ? n : null;
};

/** Los milisegundos con tres decimales como mucho, dentro de lo razonable. */
export function limpiaMs(valor: unknown) {
	const n = Number(String(valor ?? '').replace(',', '.'));
	const redondo = Math.round(n * 1000) / 1000;
	return Number.isFinite(redondo) && redondo > 0 && redondo <= MS_MAX ? redondo : null;
}

/** Una marca leída de donde sea, o null si no tiene buena forma. */
function marcaDe(raw: unknown): Marca | null {
	if (!raw || typeof raw !== 'object') return null;
	const item = raw as Record<string, unknown>;
	const nombre = linea(String(item.nombre ?? ''), FIRMA_MAX);
	const tiempo = indice(item.tiempo, TIEMPOS.length);
	const memoria = indice(item.memoria, MEMORIAS.length);
	const ms = limpiaMs(item.ms);
	if (!nombre || tiempo === null || memoria === null || ms === null) return null;
	return {
		nombre,
		tiempo,
		memoria,
		ms,
		lang: esLenguaje(item.lang) ? item.lang : 'otro',
		algo: linea(String(item.algo ?? ''), ALGO_MAX),
		mejoras: Math.min(Math.max(Math.floor(Number(item.mejoras) || 0), 0), 99),
		at: typeof item.at === 'number' && Number.isFinite(item.at) ? item.at : 0,
	};
}

function semanas<T>(raw: unknown, leer: (valor: unknown) => T | null): Record<string, T> {
	const out: Record<string, T> = {};
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
	for (const [week, valor] of Object.entries(raw as Record<string, unknown>)) {
		if (!/^-?\d+$/.test(week)) continue;
		const limpio = leer(valor);
		if (limpio !== null) out[week] = limpio;
	}
	return out;
}

export function readEficiencia(): Guardado {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown> | null;
		return {
			mias: semanas(raw?.mias, marcaDe),
			otras: semanas(raw?.otras, (valor) =>
				Array.isArray(valor)
					? valor
							.map(marcaDe)
							.filter((item): item is Marca => item !== null)
							.slice(0, MARCAS_MAX)
					: null,
			),
		};
	} catch {
		return { mias: {}, otras: {} };
	}
}

export function saveEficiencia(guardado: Guardado) {
	const recientes = <T>(mapa: Record<string, T>) =>
		Object.fromEntries(
			Object.keys(mapa)
				.sort((a, b) => Number(b) - Number(a))
				.slice(0, SEMANAS)
				.map((week) => [week, mapa[week]]),
		);
	try {
		localStorage.setItem(KEY, JSON.stringify({ mias: recientes(guardado.mias), otras: recientes(guardado.otras) }));
	} catch {
		// Sin almacenamiento, la tabla dura lo que dura la visita.
	}
	window.dispatchEvent(new Event(CAMBIO_EFICIENCIA));
}

/** Menor es mejor: primero el coste, luego la memoria, luego el reloj y luego quien llegó antes. */
export function compara(a: Marca, b: Marca) {
	return a.tiempo - b.tiempo || a.memoria - b.memoria || a.ms - b.ms || a.at - b.at;
}

/**
 * Tu marca nueva, o el motivo por el que no entra. La primera entra siempre;
 * después, solo si mejora la que tenías.
 */
export function nuevaMarca(antes: Marca | undefined, draft: Record<string, unknown>, now: number): Marca | string {
	const ms = limpiaMs(draft.ms);
	if (ms === null) return `El tiempo va en milisegundos, de 0 a ${MS_MAX.toLocaleString('es-ES')}.`;
	const algo = linea(String(draft.algo ?? ''), ALGO_MAX);
	if (!algo) return 'Cuenta en una línea qué algoritmo usas.';

	const marca = marcaDe({ ...draft, ms, algo, mejoras: antes ? antes.mejoras + 1 : 0, at: now });
	if (!marca) return 'Ponte una firma en los retos para entrar en la tabla.';
	// El reloj de cada máquina va a su aire: empatar en coste y memoria pide bajar el tiempo.
	if (antes && compara({ ...marca, at: 0 }, { ...antes, at: 0 }) >= 0) return 'No mejora tu marca. Afina y vuelve.';
	return marca;
}

/* ---------- El enlace ---------- */

/** «semana.tiempo.memoria.ms.lenguaje.mejoras», con la firma y el algoritmo aparte. */
export function enlaceDe(marca: Marca, week: number) {
	const params = new URLSearchParams();
	params.set('de', marca.nombre);
	params.set('ef', [week, marca.tiempo, marca.memoria, marca.ms, marca.lang, marca.mejoras].join('.'));
	params.set('algo', marca.algo);
	return params.toString();
}

/** Lo contrario: sirve el enlace entero o solo lo que va tras la almohadilla. */
export function marcaDeEnlace(texto: string, now: number): { week: number; marca: Marca } | string {
	const hash = texto.includes('#') ? texto.slice(texto.indexOf('#') + 1) : texto;
	const params = new URLSearchParams(hash.trim());
	const partes = /^(-?\d{1,6})\.(\d)\.(\d)\.(\d{1,6}(?:\.\d{1,3})?)\.(js|py|otro)\.(\d{1,2})$/.exec(params.get('ef') ?? '');
	if (!partes) return 'Ese enlace no es de una marca. Se copia desde la liga de eficiencia.';

	const marca = marcaDe({
		nombre: params.get('de') ?? '',
		tiempo: partes[2],
		memoria: partes[3],
		ms: partes[4],
		lang: partes[5],
		algo: params.get('algo') ?? '',
		mejoras: partes[6],
		at: now,
	});
	if (!marca) return 'A esa marca le falta algo: pide que te la vuelvan a pasar.';
	return { week: Number(partes[1]), marca };
}

/** La suma o, si ya estaba con esa firma, la pone al día. Null si no cabe. */
export function addMarca(guardado: Guardado, week: number, marca: Marca): Guardado | null {
	const key = String(week);
	const lista = guardado.otras[key] ?? [];
	const resto = lista.filter((item) => item.nombre.toLowerCase() !== marca.nombre.toLowerCase());
	if (resto.length >= MARCAS_MAX) return null;
	return { ...guardado, otras: { ...guardado.otras, [key]: [marca, ...resto] } };
}

export function removeMarca(guardado: Guardado, week: number, nombre: string): Guardado {
	const key = String(week);
	const lista = (guardado.otras[key] ?? []).filter((item) => item.nombre !== nombre);
	return { ...guardado, otras: { ...guardado.otras, [key]: lista } };
}

/** La tabla de una semana, tú dentro. Si alguien firma como tú, manda la tuya. */
export function tablaEficiencia(guardado: Guardado, week: number) {
	const mia = guardado.mias[String(week)];
	const filas = (guardado.otras[String(week)] ?? [])
		.filter((item) => !mia || item.nombre.toLowerCase() !== mia.nombre.toLowerCase())
		.map((marca) => ({ marca, tu: false }));
	if (mia) filas.push({ marca: mia, tu: true });
	return filas.sort((a, b) => compara(a.marca, b.marca));
}

/** «0,42 ms», «1,2 s»: lo que se lee de un vistazo. */
export function msTexto(ms: number) {
	if (ms >= 1000) return `${(ms / 1000).toLocaleString('es-ES', { maximumFractionDigits: 2 })} s`;
	return `${ms.toLocaleString('es-ES', { maximumFractionDigits: 3 })} ms`;
}
