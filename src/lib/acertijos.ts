/*
 * Acertijos en equipo: tres acertijos de lógica al día, los mismos para todo el
 * mundo, que se resuelven entre varias pestañas a la vez y contra el reloj. Aquí
 * están el catálogo, las insignias y las cuentas; la sala, el directo y el
 * enlace viven en el componente. No hay servidor.
 */

export interface Acertijo {
	id: string;
	texto: string;
	/** Un número o una sola palabra, sin tildes ni mayúsculas. */
	respuesta: string;
	pista: string;
}

/** Id, enunciado, respuesta y pista: uno por línea. */
const FILAS: readonly [string, string, string, string][] = [
	['ovejas', 'Un pastor tiene 17 ovejas. Se le escapan todas menos 9. ¿Cuántas le quedan?', '9', 'Lee otra vez «todas menos».'],
	['maquinas', 'Si 5 máquinas hacen 5 piezas en 5 minutos, ¿cuántos minutos tardan 100 máquinas en hacer 100 piezas?', '5', 'Cada máquina hace una pieza en el mismo tiempo.'],
	['bate', 'Un bate y una pelota cuestan 1,10 €. El bate cuesta 1 € más que la pelota. ¿Cuántos céntimos cuesta la pelota?', '5', 'Si la pelota costase 10, el bate costaría 1,10.'],
	['alturas', 'Ana es más alta que Bea. Bea es más alta que Carla. Dani es más alta que Ana. ¿Quién es la segunda más baja?', 'bea', 'Ordénalas de la más baja a la más alta.'],
	['nenufares', 'Los nenúfares de un estanque doblan su superficie cada día y tardan 48 días en cubrirlo. ¿Qué día cubren la mitad?', '47', 'Piensa hacia atrás desde el día 48.'],
	['cajas', 'Tres cajas: «manzanas», «naranjas» y «mezcla». Todas las etiquetas mienten. ¿De cuál sacas una sola fruta para saber qué hay en las tres?', 'mezcla', 'Solo una caja tiene seguro una sola clase de fruta.'],
	['fibonacci', '¿Qué número sigue? 1, 1, 2, 3, 5, 8, 13, …', '21', 'Cada uno sale de los dos de antes.'],
	['serie', '¿Qué número sigue? 2, 6, 12, 20, 30, …', '42', 'Mira cuánto crece de uno a otro.'],
	['caracol', 'Un caracol sube un pozo de 10 m: 3 m de día y resbala 2 m de noche. ¿En cuántos días sale?', '8', 'El último día sube y ya no resbala.'],
	['campanadas', 'Un reloj da 6 campanadas en 5 segundos. ¿Cuántos segundos tarda en dar 12?', '11', 'Cuenta los huecos, no los golpes.'],
	['gatos', 'Tres gatos cazan tres ratones en tres minutos. ¿Cuántos gatos hacen falta para cazar 100 ratones en 100 minutos?', '3', '¿Cuánto tarda un gato en cazar un ratón?'],
	['binaria', 'Una lista ordenada de 8 elementos. ¿Cuántas comparaciones hace, como mucho, una búsqueda binaria?', '4', '8, 4, 2, 1: cuenta los pasos.'],
	['binario', '¿Cuánto es 1011 en binario pasado a decimal?', '11', '8 + 0 + 2 + 1.'],
	['hermanos', 'Luis tiene 4 hermanas y cada hermana tiene un hermano. ¿Cuántos hijos hay en la familia?', '5', 'El hermano de las hermanas es el mismo.'],
	['velas', 'Había 10 velas encendidas y se apagaron 3. ¿Cuántas quedan al final?', '3', 'Las encendidas se consumen.'],
];

export const CATALOGO: readonly Acertijo[] = FILAS.map(([id, texto, respuesta, pista]) => ({ id, texto, respuesta, pista }));

export const POR_DIA = 3;
/** Lo que dura una ronda desde que alguien le da a empezar. */
export const DURACION = 10 * 60_000;
export const PUNTOS = 100;
export const CON_PISTA = 50;
/** Lo que sobra del reloj al hacer pleno: un punto cada cinco segundos. */
const BONO_CADA = 5_000;
export const MAX_INTENTOS = 30;
export const MAX_EQUIPO = 12;
export const MAX_PARTIDAS = 200;

const DIA = 86_400_000;

/** El número del día en tu calendario: cambia a medianoche de aquí. */
export function diaDe(now: number) {
	const d = new Date(now);
	return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DIA);
}

/** Los tres de un día: el catálogo entero, rotando sin repetir. */
export function acertijosDe(dia: number) {
	const total = CATALOGO.length;
	const offset = (((dia * POR_DIA) % total) + total) % total;
	return Array.from({ length: POR_DIA }, (_, i) => CATALOGO[(offset + i) % total]);
}

function normalizar(texto: string) {
	return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

/** Para los números vale el primero que escribas; para las palabras, una frase corta que la lleve. */
export function acierta(acertijo: Acertijo, texto: string) {
	const limpio = normalizar(texto);
	if (/^\d+$/.test(acertijo.respuesta)) return limpio.match(/\d+/)?.[0] === acertijo.respuesta;
	const palabras = limpio.split(/[^a-z0-9]+/).filter(Boolean);
	return palabras.length <= 3 && palabras.includes(acertijo.respuesta);
}

export const limpiarFirma = (s: unknown) =>
	typeof s === 'string' ? s.replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 20) : '';

const firmasDe = (lista: unknown, max: number) =>
	Array.isArray(lista) ? [...new Set(lista.map(limpiarFirma).filter(Boolean))].slice(0, max) : [];

// --- La sala ---

export interface Resuelto {
	por: string;
	at: number;
	pista: boolean;
}

export interface Intento {
	id: string;
	por: string;
	acertijo: string;
	texto: string;
	ok: boolean;
	at: number;
}

export interface Sala {
	dia: number;
	inicio: number | null;
	resueltos: Record<string, Resuelto>;
	pistas: string[];
	intentos: Intento[];
	equipo: string[];
}

export const salaVacia = (dia: number): Sala => ({ dia, inicio: null, resueltos: {}, pistas: [], intentos: [], equipo: [] });

const numero = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Una sala tal como llega de otra pestaña o del almacenamiento, o null si viene rara. */
export function limpiarSala(raw: unknown): Sala | null {
	if (!raw || typeof raw !== 'object') return null;
	const s = raw as Record<string, unknown>;
	if (!numero(s.dia)) return null;
	const ids = new Set(acertijosDe(s.dia).map((a) => a.id));

	const resueltos: Record<string, Resuelto> = {};
	if (s.resueltos && typeof s.resueltos === 'object') {
		for (const [id, r] of Object.entries(s.resueltos as Record<string, Record<string, unknown>>)) {
			if (!ids.has(id) || !r || !numero(r.at)) continue;
			resueltos[id] = { por: limpiarFirma(r.por) || 'alguien', at: r.at, pista: r.pista === true };
		}
	}

	const intentos = (Array.isArray(s.intentos) ? s.intentos : [])
		.filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
		.filter((i) => typeof i.id === 'string' && typeof i.acertijo === 'string' && ids.has(i.acertijo) && numero(i.at))
		.map((i) => ({
			id: String(i.id).slice(0, 24),
			por: limpiarFirma(i.por) || 'alguien',
			acertijo: String(i.acertijo),
			texto: typeof i.texto === 'string' ? i.texto.slice(0, 40) : '',
			ok: i.ok === true,
			at: Number(i.at),
		}))
		.slice(-MAX_INTENTOS);

	return {
		dia: s.dia,
		inicio: numero(s.inicio) ? s.inicio : null,
		resueltos,
		pistas: Array.isArray(s.pistas) ? s.pistas.filter((id): id is string => typeof id === 'string' && ids.has(id)) : [],
		intentos,
		equipo: firmasDe(s.equipo, MAX_EQUIPO),
	};
}

/** Dos salas del mismo día se juntan: gana lo primero que pasó y no se pierde nada. */
export function juntarSalas(a: Sala, b: Sala): Sala {
	if (a.dia !== b.dia) return a.dia > b.dia ? a : b;
	const inicio = a.inicio === null ? b.inicio : b.inicio === null ? a.inicio : Math.min(a.inicio, b.inicio);

	const resueltos = { ...b.resueltos };
	for (const [id, r] of Object.entries(a.resueltos)) {
		if (!resueltos[id] || r.at < resueltos[id].at) resueltos[id] = r;
	}

	const vistos = new Map<string, Intento>();
	[...a.intentos, ...b.intentos].forEach((i) => vistos.set(i.id, i));

	return {
		dia: a.dia,
		inicio,
		resueltos,
		pistas: [...new Set([...a.pistas, ...b.pistas])],
		intentos: [...vistos.values()].sort((x, y) => x.at - y.at).slice(-MAX_INTENTOS),
		equipo: [...new Set([...a.equipo, ...b.equipo])].slice(0, MAX_EQUIPO),
	};
}

export type Estado = 'espera' | 'jugando' | 'pleno' | 'tiempo';

export function estadoDe(sala: Sala, now: number): Estado {
	if (sala.inicio === null) return 'espera';
	if (acertijosDe(sala.dia).every((a) => sala.resueltos[a.id])) return 'pleno';
	return now >= sala.inicio + DURACION ? 'tiempo' : 'jugando';
}

export function puntosDe(sala: Sala) {
	const ids = acertijosDe(sala.dia).map((a) => a.id);
	const base = ids.reduce((suma, id) => {
		const r = sala.resueltos[id];
		return r ? suma + (r.pista ? CON_PISTA : PUNTOS) : suma;
	}, 0);
	if (sala.inicio === null || !ids.every((id) => sala.resueltos[id])) return base;
	const ultimo = Math.max(...ids.map((id) => sala.resueltos[id].at));
	return base + Math.floor(Math.max(0, sala.inicio + DURACION - ultimo) / BONO_CADA);
}

// --- Partidas y ranking colaborativo ---

export interface Partida {
	dia: number;
	equipo: string[];
	puntos: number;
	aciertos: number;
}

/** Un equipo juega una vez al día: su clave es el día y quién estaba. */
export const claveDe = (p: Partida) => `${p.dia}:${[...p.equipo].sort().join(',')}`;

export function limpiarPartidas(lista: unknown): Partida[] {
	if (!Array.isArray(lista)) return [];
	return lista
		.filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
		.filter((p) => Number.isInteger(p.dia) && Number.isInteger(p.puntos) && Number.isInteger(p.aciertos))
		.map((p) => ({
			dia: Number(p.dia),
			equipo: firmasDe(p.equipo, MAX_EQUIPO),
			puntos: Math.min(Math.max(Number(p.puntos), 0), POR_DIA * PUNTOS + DURACION / BONO_CADA),
			aciertos: Math.min(Math.max(Number(p.aciertos), 0), POR_DIA),
		}))
		.filter((p) => p.equipo.length > 0)
		.slice(0, MAX_PARTIDAS);
}

/** Las partidas de dos sitios, juntas: de cada equipo y día se queda la mejor. */
export function juntarPartidas(a: Partida[], b: Partida[]) {
	const mapa = new Map<string, Partida>();
	[...a, ...b].forEach((p) => {
		const otra = mapa.get(claveDe(p));
		if (!otra || p.puntos > otra.puntos) mapa.set(claveDe(p), p);
	});
	return [...mapa.values()].sort((x, y) => y.dia - x.dia).slice(0, MAX_PARTIDAS);
}

export interface Fila {
	firma: string;
	puntos: number;
	aciertos: number;
	partidas: number;
}

/** Cada partida suma entera a todo su equipo: aquí se gana juntos. */
export function rankingDe(partidas: Partida[]): Fila[] {
	const filas = new Map<string, Fila>();
	partidas.forEach((p) =>
		p.equipo.forEach((firma) => {
			const fila = filas.get(firma) ?? { firma, puntos: 0, aciertos: 0, partidas: 0 };
			fila.puntos += p.puntos;
			fila.aciertos += p.aciertos;
			fila.partidas += 1;
			filas.set(firma, fila);
		}),
	);
	return [...filas.values()].sort((x, y) => y.puntos - x.puntos || y.aciertos - x.aciertos);
}

// --- Insignias ---

export interface Insignia {
	id: string;
	titulo: string;
	detalle: string;
	icono: string;
}

export const INSIGNIAS: readonly Insignia[] = [
	{ id: 'primera', titulo: 'Primera luz', detalle: 'Resolver un acertijo.', icono: 'puzzle' },
	{ id: 'pleno', titulo: 'Pleno', detalle: 'Los tres del día dentro del tiempo.', icono: 'medal' },
	{ id: 'sin-pistas', titulo: 'A pelo', detalle: 'Pleno sin pedir ninguna pista.', icono: 'bulb-off' },
	{ id: 'rayo', titulo: 'Rayo', detalle: 'Pleno en menos de tres minutos.', icono: 'bolt' },
	{ id: 'equipo', titulo: 'En equipo', detalle: 'Pleno con dos firmas o más en la sala.', icono: 'users-group' },
	{ id: 'racha', titulo: 'Racha', detalle: 'Pleno tres días seguidos.', icono: 'flame' },
];

/** Días seguidos con pleno, hasta hoy o hasta ayer. */
export function rachaDe(plenos: number[], hoy: number) {
	const dias = new Set(plenos);
	let cursor = dias.has(hoy) ? hoy : hoy - 1;
	let racha = 0;
	while (dias.has(cursor)) {
		racha += 1;
		cursor -= 1;
	}
	return racha;
}

/** Las insignias que la sala de ahora ya merece. */
export function insigniasDe(sala: Sala, plenos: number[]) {
	const ganadas: string[] = [];
	const resueltos = Object.values(sala.resueltos);
	if (resueltos.length > 0) ganadas.push('primera');
	if (estadoDe(sala, Date.now()) === 'pleno' && sala.inicio !== null) {
		ganadas.push('pleno');
		if (!resueltos.some((r) => r.pista)) ganadas.push('sin-pistas');
		if (Math.max(...resueltos.map((r) => r.at)) - sala.inicio < 3 * 60_000) ganadas.push('rayo');
		if (sala.equipo.length > 1) ganadas.push('equipo');
	}
	if (rachaDe(plenos, sala.dia) >= 3) ganadas.push('racha');
	return ganadas;
}
