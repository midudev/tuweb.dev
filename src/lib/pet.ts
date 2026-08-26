/*
 * La mascota comunitaria: un bicho de píxeles que vive en esta web.
 *
 * Su ánimo no lo decide nadie a mano. Sale de lo que hace la gente: las ideas
 * de la ventana abierta la despiertan, las versiones publicadas la hacen
 * crecer. Si nadie propone nada, se duerme.
 *
 * Las piezas que le pone cada uno se quedan en su navegador, igual que el
 * escaparate o el chat: aquí no hay servidor ni tabla nueva. Para que una pieza
 * sea de todos hay que copiarla y proponerla como idea, que es como se cambia
 * esta web.
 */

/** El lienzo es cuadrado: 16 por 16 píxeles gordos. */
export const SIZE = 16;

/** Los tonos con los que se pinta una pieza. Todos salen de global.css. */
export const TONES = [
	{ key: 'accent', label: 'morado' },
	{ key: 'mark', label: 'lila' },
	{ key: 'heart', label: 'rojo' },
	{ key: 'ok', label: 'verde' },
	{ key: 'building', label: 'ámbar' },
	{ key: 'fg', label: 'tinta' },
] as const;

export type ToneKey = (typeof TONES)[number]['key'];

export function isTone(value: unknown): value is ToneKey {
	return typeof value === 'string' && TONES.some((tone) => tone.key === value);
}

export function toneCss(key: string) {
	return `var(--color-${isTone(key) ? key : 'accent'})`;
}

export function toneLabel(key: string) {
	return TONES.find((tone) => tone.key === key)?.label ?? TONES[0].label;
}

/**
 * Un dibujo: las filas que ocupa y desde qué altura empieza. Cada carácter es
 * un píxel —«.» no pinta, «c» es el cuerpo, «l» la luz, «h» el hueco del fondo
 * y «x» el tono que haya elegido quien pone la pieza.
 */
export interface Mask {
	y: number;
	rows: string[];
}

export interface Part {
	key: string;
	label: string;
	mask: Mask;
}

const INK: Record<string, string> = {
	c: 'var(--color-accent)',
	l: 'var(--color-mark)',
	h: 'var(--color-bg)',
};

/** El cuerpo: un bichejo redondo con dos patas. */
const CUERPO: Mask = {
	y: 2,
	rows: [
		'.....cccccc.....',
		'....cccccccc....',
		'...cccccccccc...',
		'..cccccccccccc..',
		'..cccccccccccc..',
		'..cccccccccccc..',
		'..cccccccccccc..',
		'..cccccccccccc..',
		'..cccccccccccc..',
		'...cccccccccc...',
		'....cccccccc....',
		'....cc....cc....',
	],
};

const OJOS: Record<string, Mask> = {
	cerrados: { y: 7, rows: ['....hh....hh....'] },
	abiertos: { y: 6, rows: ['....hh....hh....', '....hl....hl....'] },
	grandes: { y: 5, rows: ['....hh....hh....', '....hh....hh....', '....hl....hl....'] },
};

const BOCAS: Record<string, Mask> = {
	linea: { y: 10, rows: ['.......hh.......'] },
	sonrisa: { y: 9, rows: ['......hhhh......'] },
	ancha: { y: 9, rows: ['.....hhhhhh.....', '......hhhh......'] },
	risa: { y: 9, rows: ['.....hhhhhh.....', '.....hhhhhh.....', '......hhhh......'] },
};

export type MoodKey = 'dormida' | 'atenta' | 'contenta' | 'euforica';

/** Cada ánimo es una cara y una frase que explica por qué está así. */
export const MOODS: Record<MoodKey, { label: string; ojos: string; boca: string; hint: string }> = {
	dormida: {
		label: 'dormida',
		ojos: 'cerrados',
		boca: 'linea',
		hint: 'Nadie ha propuesto nada en esta ventana. Se ha echado a dormir.',
	},
	atenta: {
		label: 'atenta',
		ojos: 'abiertos',
		boca: 'sonrisa',
		hint: 'Han llegado las primeras ideas y ha abierto los ojos.',
	},
	contenta: {
		label: 'contenta',
		ojos: 'abiertos',
		boca: 'ancha',
		hint: 'La ventana va animada y se le nota.',
	},
	euforica: {
		label: 'eufórica',
		ojos: 'grandes',
		boca: 'risa',
		hint: 'Esto está lleno de ideas. No para quieta.',
	},
};

/** Las piezas que se le pueden poner. La lista es esta y no hay más. */
export const PARTS: Part[] = [
	{ key: 'antenas', label: 'antenas', mask: { y: 0, rows: ['.....x....x.....', '.....x....x.....'] } },
	{ key: 'cuernos', label: 'cuernos', mask: { y: 1, rows: ['...x........x...', '....x......x....'] } },
	{ key: 'sombrero', label: 'sombrero', mask: { y: 0, rows: ['......xxxx......', '....xxxxxxxx....'] } },
	{
		key: 'gafas',
		label: 'gafas',
		mask: {
			y: 5,
			rows: ['...xxxx..xxxx...', '...x..xxxx..x...', '...x..x..x..x...', '...xxxx..xxxx...'],
		},
	},
	{
		key: 'bufanda',
		label: 'bufanda',
		mask: { y: 11, rows: ['...xxxxxxxxxx...', '............x...', '............x...'] },
	},
	{
		key: 'alas',
		label: 'alas',
		mask: {
			y: 5,
			rows: ['.x............x.', 'xx............xx', 'xx............xx', '.x............x.'],
		},
	},
	{ key: 'cola', label: 'cola', mask: { y: 9, rows: ['...............x', '..............x.', '.............xx.'] } },
	{ key: 'botas', label: 'botas', mask: { y: 14, rows: ['....xx....xx....'] } },
	{ key: 'lunares', label: 'lunares', mask: { y: 10, rows: ['...x........x...', '......x..x......'] } },
	{
		key: 'corazon',
		label: 'corazón',
		mask: { y: 0, rows: ['...........x.x..', '..........xxxxx.', '...........xxx..', '............x...'] },
	},
];

export function getPart(key: string) {
	return PARTS.find((part) => part.key === key);
}

/** Una pieza puesta: qué es, de qué color y cuándo se puso. */
export interface Adorno {
	id: string;
	part: string;
	tone: string;
	at: number;
}

/** Un bicho, no un árbol de navidad. */
export const MAX_ADORNOS = 10;

export const NAME_MAX = 18;
export const DEFAULT_NAME = 'Píxel';

const KEY = 'tuweb:mascota';

/** Estampa un dibujo sobre el lienzo. Lo último que se pinta, manda. */
function stamp(grid: (string | null)[], mask: Mask, tone?: string) {
	mask.rows.forEach((row, offset) => {
		const y = mask.y + offset;
		if (y < 0 || y >= SIZE) return;

		for (let x = 0; x < SIZE && x < row.length; x += 1) {
			const char = row[x];
			if (char === '.') continue;

			const color = char === 'x' ? (tone ?? INK.c) : INK[char];
			if (color) grid[y * SIZE + x] = color;
		}
	});
}

/**
 * El bicho entero, píxel a píxel: primero el cuerpo, luego la cara que toque
 * por el ánimo y encima las piezas, en el orden en que se pusieron.
 */
export function paint(adornos: Adorno[], mood: MoodKey, blink = false): (string | null)[] {
	const grid: (string | null)[] = new Array(SIZE * SIZE).fill(null);
	const face = MOODS[mood] ?? MOODS.atenta;

	stamp(grid, CUERPO);
	stamp(grid, OJOS[blink ? 'cerrados' : face.ojos]);
	stamp(grid, BOCAS[face.boca]);

	for (const adorno of adornos) {
		const part = getPart(adorno.part);
		if (part) stamp(grid, part.mask, toneCss(adorno.tone));
	}

	return grid;
}

/** Las ideas de la ventana abierta son su energía. Diez ideas la llenan. */
export function energyOf(ideas: number) {
	return Math.max(0, Math.min(100, Math.round(ideas * 10)));
}

export function moodOf(ideas: number): MoodKey {
	if (ideas <= 0) return 'dormida';
	if (ideas < 4) return 'atenta';
	if (ideas < 9) return 'contenta';
	return 'euforica';
}

/** Espacios de más fuera y nada de saltos de línea. */
function oneLine(text: string, max: number) {
	return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

function nextId() {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Una pieza a partir de lo elegido en el formulario, o el motivo por el que no
 * vale. Sirve igual para lo que se pulsa ahora y para lo que se lee del
 * localStorage, que podría venir tocado a mano.
 */
export function toAdorno(draft: Partial<Record<keyof Adorno, unknown>>): Adorno | string {
	const part = getPart(String(draft.part ?? ''));
	if (!part) return 'Elige una pieza de la lista.';

	const tone = isTone(draft.tone) ? draft.tone : 'accent';
	const at = typeof draft.at === 'number' && Number.isFinite(draft.at) ? draft.at : Date.now();
	const id = typeof draft.id === 'string' && draft.id ? draft.id.slice(0, 32) : nextId();

	return { id, part: part.key, tone, at };
}

export interface Pet {
	name: string;
	adornos: Adorno[];
	/** Las caricias que le has hecho en este navegador. */
	mimos: number;
}

export function emptyPet(): Pet {
	return { name: DEFAULT_NAME, adornos: [], mimos: 0 };
}

export function cleanName(raw: string) {
	return oneLine(raw, NAME_MAX) || DEFAULT_NAME;
}

export function readPet(): Pet {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return emptyPet();

		const parsed = JSON.parse(saved) as Partial<Pet> | null;
		if (!parsed || typeof parsed !== 'object') return emptyPet();

		const guardadas: unknown[] = Array.isArray(parsed.adornos) ? parsed.adornos : [];
		const adornos = guardadas
			.map((item) => (item && typeof item === 'object' ? toAdorno(item as Partial<Adorno>) : ''))
			.filter((item): item is Adorno => typeof item !== 'string')
			.slice(0, MAX_ADORNOS);

		const mimos =
			typeof parsed.mimos === 'number' && Number.isFinite(parsed.mimos)
				? Math.max(0, Math.min(9999, Math.round(parsed.mimos)))
				: 0;

		return { name: cleanName(String(parsed.name ?? '')), adornos, mimos };
	} catch {
		// Sin almacenamiento, o con basura dentro: mascota de fábrica y a seguir.
		return emptyPet();
	}
}

export function savePet(pet: Pet) {
	try {
		localStorage.setItem(KEY, JSON.stringify(pet));
	} catch {
		// Si no deja guardar, la mascota dura lo que dure la visita.
	}
}

/** Las piezas escritas en cristiano: «antenas en morado, alas en lila». */
export function listAdornos(adornos: Adorno[]) {
	return adornos
		.map((adorno) => `${getPart(adorno.part)?.label ?? adorno.part} en ${toneLabel(adorno.tone)}`)
		.join(', ');
}

/** La mascota escrita para pegarla en el formulario de ideas. */
export function petPitch(pet: Pet) {
	const piezas = listAdornos(pet.adornos);
	const base = `La mascota de la web se llama ${pet.name}`;

	return (piezas ? `${base} y lleva ${piezas}. Ponédsela a todo el mundo.` : `${base}.`).slice(0, 280);
}
