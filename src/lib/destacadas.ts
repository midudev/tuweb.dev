/*
 * Las ideas destacadas: las que ganaron su ventana y acabaron publicadas. No las
 * elige nadie a mano, salen de lo que ya está guardado: cada versión de esta web
 * es una idea que pidió la gente.
 *
 * Lo que se hace encima —votar y comentar— se guarda en el servidor y lo ve todo
 * el mundo. Leer no pide nada; votar y comentar piden entrar con GitHub, para que
 * cada voto y cada comentario tengan dueño. Pero lo que se enseña no es tu
 * nombre: el alias es un número que tiras cuando quieras.
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

export interface Comentario {
	/** El número que le da la base: no dice de quién es. */
	id: number;
	/** La idea de la que habla. */
	idea: number;
	alias: string;
	/** Cuándo se escribió, en milisegundos. */
	at: number;
	text: string;
	/** Si lo escribiste tú, que es lo único que deja borrarlo. */
	mine: boolean;
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
	if (horas < 48) return horas === 1 ? 'hace 1 h' : `hace ${horas} h`;

	// Ahora los comentarios se quedan, así que también los hay de hace días.
	return `hace ${Math.floor(horas / 24)} días`;
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
 * Lo que se dice cuando la API dice que no. Va por estado y, en el 404, por el
 * código que trae: no es lo mismo que falte la idea que el comentario.
 */
export function errorTexto(status: number, error?: string) {
	if (status === 401) return 'Para votar o comentar hay que entrar con GitHub.';
	if (status === 403) return 'Eso no ha llegado desde esta web. Recarga la página y prueba otra vez.';
	if (status === 404) {
		return error === 'comentario'
			? 'Ese comentario ya no está.'
			: 'Esa idea ya no está entre las publicadas.';
	}
	if (status === 422) return 'Eso parece spam. Dilo con otras palabras.';
	if (status === 429) return 'Vas muy rápido. Espera unos segundos.';
	if (status === 400) return `El comentario tiene que llevar texto y no pasar de ${COMMENT_MAX} caracteres.`;
	return 'No se ha podido hablar con el servidor. Prueba otra vez en un momento.';
}
