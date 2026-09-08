/*
 * Las ideas destacadas: las que ganaron su ventana y acabaron publicadas. No las
 * elige nadie a mano, salen de lo que ya está guardado: cada versión de esta web
 * es una idea que pidió la gente.
 *
 * Lo que se hace encima —votar y comentar— no toca la base ni pide entrar. No
 * hay perfiles: el alias es un número que tiras cuando quieras. Y no se guarda
 * nada, tampoco en el navegador: los votos y los comentarios viven en la memoria
 * de la pestaña, viajan por BroadcastChannel a las demás que tengas abiertas y
 * se van con la última.
 *
 * Aquí están las cuentas y los textos, que no saben de pantallas.
 */

/** Una idea publicada, tal como la pinta la sección. */
export interface Destacada {
	id: number;
	/** La versión que trajo: la v1 es la más vieja. */
	version: number;
	title: string;
	summary: string;
	/** Cuándo se publicó, en ISO. */
	at: string;
}

/** Lo que cabe en un comentario. Es un apunte, no un hilo. */
export const COMMENT_MAX = 240;

/** Comentarios que se llevan a la vez. Al llenarse, lo más viejo se cae. */
export const TOPE_COMENTARIOS = 300;

/** Lo que se espera de un comentario al siguiente. */
export const ESPERA_MS = 900;

export interface Comentario {
	/** Un identificador al azar: no dice de quién es. */
	id: string;
	/** La idea de la que habla. */
	idea: number;
	alias: string;
	/** Cuándo se escribió, en milisegundos. */
	at: number;
	text: string;
}

/** Cómo se lee la lista. */
export type Orden = 'votos' | 'comentarios' | 'nuevas';

export function isOrden(value: unknown): value is Orden {
	return value === 'votos' || value === 'comentarios' || value === 'nuevas';
}

/** Letras al azar de las de verdad, que aquí no vale un contador. */
export function azar(largo: number) {
	const bytes = new Uint8Array(largo);
	crypto.getRandomValues(bytes);
	return [...bytes]
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('')
		.slice(0, largo);
}

/** El nombre de la casa: un número y nada más. */
export function nuevoAlias() {
	return `visitante#${azar(4)}`;
}

/** Lo que lleva una idea, para quien lee con el oído. */
export function resumenTexto(votos: number, comentarios: number) {
	const unos = votos === 0 ? 'Sin votos' : votos === 1 ? '1 voto' : `${votos} votos`;
	const otros =
		comentarios === 0
			? 'sin comentarios'
			: comentarios === 1
				? '1 comentario'
				: `${comentarios} comentarios`;

	return `${unos} · ${otros}`;
}

/** Cuánto hace que se dijo, en corto. */
export function cuandoTexto(at: number, ahora: number) {
	const minutos = Math.floor(Math.max(0, ahora - at) / 60_000);
	if (minutos < 1) return 'ahora mismo';
	if (minutos < 60) return `hace ${minutos} min`;

	const horas = Math.floor(minutos / 60);
	return horas === 1 ? 'hace 1 h' : `hace ${horas} h`;
}

/** El buscador: por palabras sueltas, sin acentos y sin mirar mayúsculas. */
export function coincide(texto: string, busca: string) {
	const limpio = (valor: string) =>
		valor
			.toLowerCase()
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '');

	const palabras = limpio(busca).split(/\s+/).filter(Boolean);
	if (palabras.length === 0) return true;

	const donde = limpio(texto);
	return palabras.every((palabra) => donde.includes(palabra));
}

/**
 * El orden que se pide. Las nuevas ya vienen así del servidor —la última versión
 * primero—, así que ahí no se toca nada; en los otros dos el desempate lo gana
 * ese mismo orden, porque ordenar en JavaScript respeta el de entrada.
 */
export function ordenarFilas<T extends { votos: number; comentarios: number }>(
	filas: T[],
	orden: Orden,
) {
	if (orden === 'nuevas') return [...filas];

	const clave = (fila: T) => (orden === 'votos' ? fila.votos : fila.comentarios);
	return [...filas].sort((a, b) => clave(b) - clave(a));
}

/** Lo que se escribe, en limpio: una línea y sin pasarse de largo. */
export function limpiar(texto: string) {
	return texto.replace(/\s+/g, ' ').trim().slice(0, COMMENT_MAX);
}

/**
 * Un comentario que llega de otra pestaña, puesto en limpio. Eso no lo escribe
 * esta página, así que se comprueba todo: que hable de una idea que existe, que
 * traiga texto y que no venga del futuro.
 */
export function saneaComentario(raw: unknown, ideas: number[], ahora: number): Comentario | null {
	if (!raw || typeof raw !== 'object') return null;

	const dato = raw as Partial<Comentario>;
	const id = String(dato.id ?? '').slice(0, 32);
	const idea = Number(dato.idea);
	const text = limpiar(String(dato.text ?? ''));
	if (!id || !text || !ideas.includes(idea)) return null;

	// Un reloj adelantado en otra pestaña no puede colar algo que todavía no ha
	// pasado: como mucho, es de ahora mismo.
	const at = Math.min(Number(dato.at) || ahora, ahora);

	return { id, idea, alias: String(dato.alias ?? 'visitante').slice(0, 24), at, text };
}

/** Los votos que llegan de otra pestaña: ids de la base y de las ideas de aquí. */
export function saneaVotos(raw: unknown, ideas: number[]) {
	if (!Array.isArray(raw)) return new Set<number>();
	return new Set(raw.map(Number).filter((id) => ideas.includes(id)));
}

/** El rótulo de arriba: con cuántas pestañas se está compartiendo esto. */
export function notaTexto(vecinos: number) {
	if (vecinos === 0) return 'Nada de esto se guarda: se va al cerrar la pestaña.';
	if (vecinos === 1) return 'Tienes otra pestaña abierta: ahí se ve lo mismo que aquí.';
	return `Tienes ${vecinos} pestañas más abiertas: ahí se ve lo mismo que aquí.`;
}
