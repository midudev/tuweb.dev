import type { APIContext } from 'astro';
import { sameOrigin } from './http';

/**
 * Lo común de las rutas /api que usa la propia web desde el navegador: JSON
 * de ida y vuelta, sin caché, y las mismas defensas en todas.
 */

export function json(data: unknown, status = 200) {
	return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function fail(status: number, error: string) {
	return json({ error }, status);
}

/**
 * Toda escritura tiene que venir de esta web y en JSON. Un formulario de otro
 * sitio no puede mandar application/json sin pasar por CORS, que aquí no se
 * abre: es una segunda valla además del Origin.
 */
export function rejectWrite(context: APIContext) {
	if (!sameOrigin(context.request)) return fail(403, 'origen');
	const type = context.request.headers.get('content-type') ?? '';
	if (context.request.method !== 'DELETE' && !type.startsWith('application/json')) return fail(415, 'json');
	return null;
}

/** El cuerpo en JSON, con tope de tamaño para que nadie mande megas. */
export async function readJson<T = Record<string, unknown>>(request: Request, maxBytes = 4096) {
	const text = await request.text();
	if (text.length > maxBytes) return null;
	try {
		const value = JSON.parse(text);
		return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : null;
	} catch {
		return null;
	}
}

/** nginx manda la IP real; la web solo escucha en 127.0.0.1, así que es de fiar. */
export function clientIp(request: Request) {
	return request.headers.get('x-real-ip') ?? '127.0.0.1';
}

// Controles C0 y C1.
const CONTROL = new RegExp('[\\u0000-\\u001F\\u007F-\\u009F]', 'g');
// Anchos cero, marcas de dirección del texto y separadores invisibles.
const INVISIBLE = new RegExp('[\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF]', 'g');

/** Texto de una línea, limpio. null si queda vacío o se pasa del tope. */
export function cleanText(raw: unknown, max: number, { min = 1 } = {}) {
	if (typeof raw !== 'string') return null;
	const text = raw.normalize('NFC').replace(CONTROL, '').replace(INVISIBLE, '').replace(/\s+/g, ' ').trim();
	if (text.length < min || text.length > max) return null;
	return text;
}

const REPEAT_RE = /(.)\1{9,}/;
const LINK_RE = /\bhttps?:\/\/|\bwww\.\S/i;

/** Lo que se ve a la legua que es ruido: letras repetidas y enlaces colados. */
export function looksLikeSpam(text: string) {
	return REPEAT_RE.test(text) || LINK_RE.test(text);
}

/** Un número entero dentro de un rango, o null. */
export function intIn(raw: unknown, min: number, max: number) {
	const value = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
	return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : null;
}
