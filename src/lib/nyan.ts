/*
 * El NyanCat de la casa: el gato galleta que cruza la web volando y va dejando
 * el arcoíris detrás. Es la mascota que se pidió en la ventana, y va en todas
 * las páginas, no en una sección suya.
 *
 * Se dibuja con píxeles gordos, como el bicho de src/lib/pet.ts: cada fila es
 * una tira de caracteres y cada carácter, un píxel. Los colores no son los del
 * gato original: salen todos de src/styles/global.css, así que el arcoíris
 * cambia con el tema y de noche se sigue leyendo.
 *
 * Aquí no hay servidor ni tabla: si alguien lo apaga, se apunta en su navegador
 * y no sale de ahí.
 */

/** El lienzo del gato: 20 píxeles de ancho por 12 de alto. */
export const COLS = 20;
export const ROWS = 12;

/** Los trozos de arcoíris que van detrás. Cada uno ocupa dos píxeles de ancho. */
export const SEGMENTOS = 8;

/**
 * La tinta de cada carácter. «l» es el contorno, «t» la galleta, «f» el
 * glaseado, «c» el pelo, «w» los ojos y «m» los mofletes. Cada una se declara
 * una vez como variable CSS y los píxeles solo la nombran.
 */
export const INK: Record<string, string> = {
	l: 'var(--color-fg)',
	t: 'color-mix(in oklab, var(--color-heart) 30%, var(--color-panel))',
	f: 'var(--color-heart)',
	c: 'color-mix(in oklab, var(--color-muted) 60%, var(--color-panel))',
	w: 'var(--color-bg)',
	m: 'var(--color-accent)',
};

/**
 * Los dos cuadros de la animación. Cambia la cola —arriba y abajo— y las patas,
 * que se encogen: con eso solo, el gato ya parece que corre.
 */
export const FRAMES: readonly (readonly string[])[] = [
	[
		'....................',
		'....................',
		'.............l...l..',
		'...llllllll..lc.cl..',
		'cclttttttttllcccccl.',
		'..ltfttttftllcwcwcl.',
		'..lttttttttllcclccl.',
		'..ltfttttftllmcccml.',
		'..lttttttttl.lllll..',
		'...llllllll.........',
		'...c.c..c.c.........',
		'...l.l..l.l.........',
	],
	[
		'....................',
		'....................',
		'.............l...l..',
		'...llllllll..lc.cl..',
		'..lttttttttllcccccl.',
		'..ltfttttftllcwcwcl.',
		'..lttttttttllcclccl.',
		'ccltfttttftllmcccml.',
		'..lttttttttl.lllll..',
		'...llllllll.........',
		'...l.l..l.l.........',
		'....................',
	],
];

/**
 * Las seis franjas del arcoíris, de arriba abajo. El original va del rojo al
 * morado; aquí se hace la misma rampa con lo que hay en casa, que es cálido y
 * acaba en verde.
 */
export const BANDAS = [
	'var(--color-heart)',
	'color-mix(in oklab, var(--color-heart) 50%, var(--color-building))',
	'var(--color-accent)',
	'var(--color-building)',
	'var(--color-ok)',
	'color-mix(in oklab, var(--color-ok) 60%, var(--color-fg))',
];

/** Un trozo de fila del mismo color: dónde empieza, cuánto mide y de qué es. */
export interface Run {
	x: number;
	y: number;
	w: number;
	/** El carácter de la tinta, que es también el nombre de su variable. */
	ink: string;
}

/**
 * El cuadro convertido en tiras. Píxel a píxel salen doscientas cajas por
 * cuadro; juntando los que van seguidos y son del mismo color se quedan en unas
 * cuantas, y el HTML no engorda por estar en todas las páginas.
 */
export function runsOf(frame: readonly string[]): Run[] {
	const runs: Run[] = [];

	frame.forEach((row, y) => {
		let x = 0;

		while (x < row.length) {
			const ink = row[x];
			if (!INK[ink]) {
				x += 1;
				continue;
			}

			let w = 1;
			while (row[x + w] === ink) w += 1;

			runs.push({ x, y, w, ink });
			x += w;
		}
	});

	return runs;
}

/** El degradado del rastro: seis franjas planas, sin difuminar. */
export function trailCss() {
	const paso = 100 / BANDAS.length;
	const stops = BANDAS.map(
		(color, index) => `${color} ${(index * paso).toFixed(4)}% ${((index + 1) * paso).toFixed(4)}%`,
	);

	return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

const KEY = 'tuweb:nyan';

/** Viene encendido: es la mascota de la web, no un adorno escondido. */
export const DEFAULT_NYAN = true;

export function readNyan(): boolean {
	try {
		return localStorage.getItem(KEY) !== 'no';
	} catch {
		// Sin localStorage (modo privado o permisos): el gato vuela igual.
		return DEFAULT_NYAN;
	}
}

export function saveNyan(on: boolean) {
	try {
		if (on === DEFAULT_NYAN) localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, 'no');
	} catch {
		// Si no deja guardar, la elección dura lo que dure la visita.
	}
}

/**
 * Lo enciende o lo apaga en el <html>, que es de donde tira el CSS, y avisa por
 * si hay más de un interruptor en la página.
 */
export function applyNyan(on: boolean) {
	document.documentElement.dataset.nyan = on ? 'si' : 'no';
	document.dispatchEvent(new CustomEvent('tuweb:nyan', { detail: { on } }));
}
