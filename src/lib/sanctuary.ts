/*
 * El santuario: un templo para devs con midudev de piedra en el centro.
 *
 * La estatua se pinta con píxeles gordos, como la mascota: aquí no hay
 * imágenes, solo un lienzo de cuadrados con los colores de global.css. Lo que
 * deja cada uno a los pies —las ofrendas y las velas— se queda en su navegador;
 * para que la peana las lleve para todo el mundo hay que copiarlas y
 * proponerlas como idea, que es como se cambia esta web.
 */

/** El lienzo de la estatua: 20 píxeles de ancho por 26 de alto. */
export const W = 20;
export const H = 26;

/*
 * La piedra, en tres tonos. Salen del texto y del fondo, así que la estatua se
 * lee igual en oscuro y en claro sin repetir la paleta a mano.
 */
const INK: Record<string, string> = {
	l: 'var(--color-fg)',
	s: 'var(--color-muted)',
	d: 'color-mix(in oklab, var(--color-muted) 55%, var(--color-bg))',
	a: 'var(--color-accent)',
};

/**
 * midudev tallado: melena, gafas, barba, y debajo la peana. Cada carácter es un
 * píxel —«.» no pinta, «l» la luz, «s» la piedra, «d» la sombra y «a» el
 * acento, que son las gafas y la placa del pecho—.
 */
const ESTATUA = [
	'.......ssssss.......',
	'.....ssssssssss.....',
	'....ssssssssssss....',
	'...ssssssssssssss...',
	'...ssllllllllllss...',
	'...slllllllllllls...',
	'...sllaaallaaalls...',
	'...slladaaaadalls...',
	'...sllaaallaaalls...',
	'...slllllddllllls...',
	'...slllddddddllls...',
	'...slldddlldddlls...',
	'...sllddddddddlls...',
	'....sllddddddlls....',
	'.....sdddddddds.....',
	'......ssssssss......',
	'........ssss........',
	'........sdds........',
	'...llllllllllllll...',
	'..llllllaaaallllll..',
	'..llllllaaaallllll..',
	'.dddddddddddddddddd.',
	'..ssssssssssssssss..',
	'..sdddddddddddddds..',
	'..ssssssssssssssss..',
	'.llllllllllllllllll.',
];

/** La estatua entera, píxel a píxel, para pintarla en una rejilla. */
export function paintStatue(): (string | null)[] {
	const grid: (string | null)[] = new Array(W * H).fill(null);

	ESTATUA.forEach((row, y) => {
		for (let x = 0; x < W && x < row.length; x += 1) {
			const color = INK[row[x]];
			if (color) grid[y * W + x] = color;
		}
	});

	return grid;
}

/** Lo que se puede dejar a los pies. La lista es esta y no hay más. */
export const OFRENDAS = [
	{ key: 'cafe', label: 'un café', icon: 'coffee' },
	{ key: 'bug', label: 'un bug', icon: 'bug' },
	{ key: 'pizza', label: 'una pizza', icon: 'pizza' },
	{ key: 'teclado', label: 'un teclado', icon: 'keyboard' },
	{ key: 'portatil', label: 'un portátil', icon: 'device-laptop' },
	{ key: 'merge', label: 'un merge limpio', icon: 'git-merge' },
	{ key: 'terminal', label: 'una terminal abierta', icon: 'terminal-2' },
	{ key: 'cascos', label: 'unos cascos', icon: 'headphones' },
	{ key: 'galleta', label: 'una galleta', icon: 'cookie' },
	{ key: 'idea', label: 'una idea sin proponer', icon: 'bulb' },
] as const;

export type OfrendaKey = (typeof OFRENDAS)[number]['key'];

export function getOfrenda(key: string) {
	return OFRENDAS.find((item) => item.key === key);
}

/** Lo que contesta la estatua cuando se le pide consejo. */
export const CONSEJOS = [
	'Si no está en producción, no está terminado.',
	'El mejor código es el que no has tenido que escribir.',
	'Nómbralo bien y no harás falta comentarlo.',
	'Antes de optimizar, mide. Después también.',
	'Un test que no falla nunca no te está contando nada.',
	'Bórralo. Si hace falta, está en el historial.',
	'Lo que no entiendas mañana, explícalo hoy.',
	'No hay deuda técnica pequeña, hay deuda joven.',
	'Léete el error entero antes de buscarlo por ahí.',
	'Si te da miedo desplegar un viernes, el problema no es el viernes.',
	'Copia y pega con cuidado: lo que pegas lo mantienes tú.',
	'Duda de la caché antes de dudar de ti.',
];

/** Una ofrenda dejada: qué es y cuándo se dejó. */
export interface Ofrenda {
	id: string;
	key: string;
	at: number;
}

export interface Altar {
	ofrendas: Ofrenda[];
	/** Las velas que has encendido en este navegador. */
	velas: number;
}

/** Una peana, no un mercadillo. */
export const MAX_OFRENDAS = 12;
export const MAX_VELAS = 999;

const KEY = 'tuweb:santuario';

export function emptyAltar(): Altar {
	return { ofrendas: [], velas: 0 };
}

function nextId() {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Una ofrenda a partir de lo elegido, o el motivo por el que no vale. Sirve
 * igual para lo que se pulsa ahora y para lo que se lee del localStorage, que
 * podría venir tocado a mano.
 */
export function toOfrenda(draft: Partial<Record<keyof Ofrenda, unknown>>): Ofrenda | string {
	const ofrenda = getOfrenda(String(draft.key ?? ''));
	if (!ofrenda) return 'Elige una ofrenda de la lista.';

	const at = typeof draft.at === 'number' && Number.isFinite(draft.at) ? draft.at : Date.now();
	const id = typeof draft.id === 'string' && draft.id ? draft.id.slice(0, 32) : nextId();

	return { id, key: ofrenda.key, at };
}

export function readAltar(): Altar {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return emptyAltar();

		const parsed = JSON.parse(saved) as Partial<Altar> | null;
		if (!parsed || typeof parsed !== 'object') return emptyAltar();

		const guardadas: unknown[] = Array.isArray(parsed.ofrendas) ? parsed.ofrendas : [];
		const ofrendas = guardadas
			.map((item) => (item && typeof item === 'object' ? toOfrenda(item as Partial<Ofrenda>) : ''))
			.filter((item): item is Ofrenda => typeof item !== 'string')
			.slice(0, MAX_OFRENDAS);

		const velas =
			typeof parsed.velas === 'number' && Number.isFinite(parsed.velas)
				? Math.max(0, Math.min(MAX_VELAS, Math.round(parsed.velas)))
				: 0;

		return { ofrendas, velas };
	} catch {
		// Sin almacenamiento, o con basura dentro: santuario vacío y a seguir.
		return emptyAltar();
	}
}

export function saveAltar(altar: Altar) {
	try {
		localStorage.setItem(KEY, JSON.stringify(altar));
	} catch {
		// Si no deja guardar, lo dejado dura lo que dure la visita.
	}
}

/** Cuánto alumbran las velas, de 0 a 100. Doce velas dejan el templo lleno. */
export function glowOf(velas: number) {
	return Math.max(0, Math.min(100, Math.round(velas * (100 / 12))));
}

/** Las ofrendas escritas en cristiano: «un café, un bug y una pizza». */
export function listOfrendas(ofrendas: Ofrenda[]) {
	const nombres = ofrendas.map((item) => getOfrenda(item.key)?.label ?? item.key);
	if (nombres.length < 2) return nombres.join('');

	return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** El santuario escrito para pegarlo en el formulario de ideas. */
export function altarPitch(altar: Altar) {
	const dejado = listOfrendas(altar.ofrendas);
	const velas = altar.velas
		? `${altar.velas} ${altar.velas === 1 ? 'vela encendida' : 'velas encendidas'}`
		: '';

	const partes = [dejado, velas].filter(Boolean).join(' y ');
	const base = partes
		? `En el santuario dejo ${partes}.`
		: 'En el santuario no dejo nada todavía.';

	return `${base} Ponedlo en la peana de midudev para todo el mundo.`.slice(0, 280);
}
