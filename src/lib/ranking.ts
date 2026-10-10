/*
 * El ranking de los problemas de la semana. No hay servidor que lleve la
 * cuenta: cada uno comparte su perfil en un enlace y quien lo recibe lo suma a
 * su tabla. Aquí se guardan esos enlaces y se ordenan por puntos, contigo
 * dentro. Es la palabra de cada uno, no un registro: lo pone en la tabla.
 */
import { decodificaPerfil, palmares, puntosDe, type Medalla, type Registro } from './problemas';
import { FIRMA_MAX } from './soluciones';

export interface Rival {
	nombre: string;
	/** Lo resuelto tal cual viene en el enlace: «semana.intentos.horas». */
	p: string;
	at: number;
}

export interface Fila {
	nombre: string;
	puntos: number;
	medallas: Record<Medalla, number>;
	/** Si ha resuelto el de esta semana. */
	semana: boolean;
	tu: boolean;
}

/** Una tabla de la gente que conoces, no una liga entera. */
export const RIVALES_MAX = 30;

const KEY = 'tuweb:retos-ranking';
/** El evento que lanza saveRivales en la propia pestaña. */
export const CAMBIO_RANKING = 'tuweb:ranking';

const limpiaNombre = (texto: string) => texto.replace(/\s+/g, ' ').trim().slice(0, FIRMA_MAX);

export function readRivales(): Rival[] {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
		if (!Array.isArray(raw)) return [];
		return raw
			.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
			.map((item) => ({
				nombre: limpiaNombre(String(item.nombre ?? '')),
				p: String(item.p ?? '').slice(0, 1000),
				at: typeof item.at === 'number' && Number.isFinite(item.at) ? item.at : 0,
			}))
			.filter((item) => item.nombre)
			.slice(0, RIVALES_MAX);
	} catch {
		return [];
	}
}

export function saveRivales(rivales: Rival[]) {
	try {
		if (rivales.length === 0) localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, JSON.stringify(rivales.slice(0, RIVALES_MAX)));
	} catch {
		// Sin almacenamiento, la tabla dura lo que dura la visita.
	}
	window.dispatchEvent(new Event(CAMBIO_RANKING));
}

/**
 * Un rival a partir de un enlace de perfil, o el motivo por el que no vale.
 * Sirve el enlace entero o solo lo que va tras la almohadilla.
 */
export function rivalDeEnlace(texto: string, now: number): Rival | string {
	const hash = texto.includes('#') ? texto.slice(texto.indexOf('#') + 1) : texto;
	const params = new URLSearchParams(hash.trim());
	const p = params.get('p');
	if (p === null) return 'Ese enlace no es de un perfil. Se copia desde el perfil de cada uno.';

	const nombre = limpiaNombre(params.get('de') ?? '');
	if (!nombre) return 'Ese perfil no lleva firma: pídele que se ponga una y te lo vuelva a pasar.';

	return { nombre, p: p.slice(0, 1000), at: now };
}

/** Lo añade o, si ya estaba con ese nombre, lo pone al día. */
export function addRival(rivales: Rival[], rival: Rival) {
	const resto = rivales.filter((item) => item.nombre.toLowerCase() !== rival.nombre.toLowerCase());
	if (resto.length >= RIVALES_MAX) return null;
	return [rival, ...resto];
}

export function removeRival(rivales: Rival[], nombre: string) {
	return rivales.filter((item) => item.nombre !== nombre);
}

function filaDe(nombre: string, registro: Registro, week: number, tu: boolean): Fila {
	const medallas: Record<Medalla, number> = { oro: 0, plata: 0, bronce: 0 };
	for (const item of palmares(registro)) medallas[item.medalla] += 1;
	return { nombre, puntos: puntosDe(registro), medallas, semana: Boolean(registro[String(week)]?.ok), tu };
}

/** La tabla: por puntos, luego por destacadas y luego por plata. Tú vas dentro. */
export function tablaDe(rivales: Rival[], mio: Registro, miNombre: string, week: number): Fila[] {
	return [
		filaDe(miNombre || 'Tú', mio, week, true),
		...rivales
			.filter((rival) => rival.nombre !== miNombre)
			.map((rival) => filaDe(rival.nombre, decodificaPerfil(rival.p), week, false)),
	].sort(
		(a, b) =>
			b.puntos - a.puntos ||
			b.medallas.oro - a.medallas.oro ||
			b.medallas.plata - a.medallas.plata ||
			Number(b.tu) - Number(a.tu),
	);
}
