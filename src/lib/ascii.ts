/**
 * Letras grandes de ASCII art para la caja de herramientas. Hay una sola
 * fuente de mapa de bits (5 filas, ancho variable) y cada estilo es una forma
 * distinta de pintarla: con bloques, con almohadillas, con sombra, en cursiva,
 * a media altura o con la propia letra. Todo es texto: no se dibuja nada.
 */

/** Alto de la fuente, en filas. */
const ALTO = 5;

/** Límite de lo que se convierte: más no cabe en ninguna pantalla. */
export const MAX_CHARS = 200;

// Cada glifo son sus filas separadas por «|»: «#» es tinta y «.» es hueco.
const GLIFOS: Record<string, string> = {
	A: '.###.|#...#|#####|#...#|#...#',
	B: '####.|#...#|####.|#...#|####.',
	C: '.####|#....|#....|#....|.####',
	D: '####.|#...#|#...#|#...#|####.',
	E: '#####|#....|####.|#....|#####',
	F: '#####|#....|####.|#....|#....',
	G: '.####|#....|#..##|#...#|.###.',
	H: '#...#|#...#|#####|#...#|#...#',
	I: '###|.#.|.#.|.#.|###',
	J: '..###|...#.|...#.|#..#.|.##..',
	K: '#...#|#..#.|###..|#..#.|#...#',
	L: '#....|#....|#....|#....|#####',
	M: '#...#|##.##|#.#.#|#...#|#...#',
	N: '#...#|##..#|#.#.#|#..##|#...#',
	Ñ: '.###.|.....|##..#|#.#.#|#..##',
	O: '.###.|#...#|#...#|#...#|.###.',
	P: '####.|#...#|####.|#....|#....',
	Q: '.###.|#...#|#.#.#|#..#.|.##.#',
	R: '####.|#...#|####.|#..#.|#...#',
	S: '.####|#....|.###.|....#|####.',
	T: '#####|..#..|..#..|..#..|..#..',
	U: '#...#|#...#|#...#|#...#|.###.',
	V: '#...#|#...#|#...#|.#.#.|..#..',
	W: '#...#|#...#|#.#.#|##.##|#...#',
	X: '#...#|.#.#.|..#..|.#.#.|#...#',
	Y: '#...#|.#.#.|..#..|..#..|..#..',
	Z: '#####|...#.|..#..|.#...|#####',
	'0': '.###.|#..##|#.#.#|##..#|.###.',
	'1': '.#.|##.|.#.|.#.|###',
	'2': '####.|....#|.###.|#....|#####',
	'3': '####.|....#|.###.|....#|####.',
	'4': '#...#|#...#|#####|....#|....#',
	'5': '#####|#....|####.|....#|####.',
	'6': '.###.|#....|####.|#...#|.###.',
	'7': '#####|....#|...#.|..#..|..#..',
	'8': '.###.|#...#|.###.|#...#|.###.',
	'9': '.###.|#...#|.####|....#|.###.',
	' ': '...|...|...|...|...',
	'!': '#|#|#|.|#',
	'¡': '#|.|#|#|#',
	'?': '###.|...#|.##.|....|.#..',
	'¿': '..#.|....|.##.|#...|.###',
	'.': '.|.|.|.|#',
	',': '..|..|..|.#|#.',
	':': '.|#|.|#|.',
	';': '..|.#|..|.#|#.',
	'-': '...|...|###|...|...',
	_: '....|....|....|....|####',
	'+': '...|.#.|###|.#.|...',
	'=': '...|###|...|###|...',
	'*': '#.#|.#.|#.#|...|...',
	'/': '....#|...#.|..#..|.#...|#....',
	'\\': '#....|.#...|..#..|...#.|....#',
	"'": '#|#|.|.|.',
	'"': '#.#|#.#|...|...|...',
	'(': '.#|#.|#.|#.|.#',
	')': '#.|.#|.#|.#|#.',
	'[': '##|#.|#.|#.|##',
	']': '##|.#|.#|.#|##',
	'<': '..#|.#.|#..|.#.|..#',
	'>': '#..|.#.|..#|.#.|#..',
	'#': '.#.#.|#####|.#.#.|#####|.#.#.',
	'@': '.###.|#.###|#.#.#|#.###|.###.',
	'&': '.##..|#..#.|.##.#|#..#.|.##.#',
	$: '.####|#.#..|.###.|..#.#|####.',
	'%': '##..#|##.#.|..#..|.#.##|#..##',
};

const MAPAS = new Map(
	Object.entries(GLIFOS).map(([letra, filas]) => [
		letra,
		filas.split('|').map((fila) => [...fila].map((celda) => celda === '#')),
	]),
);

export type Style = 'bloque' | 'sombra' | 'almohadilla' | 'cursiva' | 'mini' | 'letras';

export const STYLES: { id: Style; label: string }[] = [
	{ id: 'bloque', label: 'Bloque' },
	{ id: 'sombra', label: 'Sombra' },
	{ id: 'almohadilla', label: 'Almohadilla' },
	{ id: 'cursiva', label: 'Cursiva' },
	{ id: 'mini', label: 'Mini' },
	{ id: 'letras', label: 'Con su letra' },
];

/**
 * La letra que se pinta de verdad: mayúscula y sin tilde (la ñ se queda, que
 * tiene glifo propio). Lo que no está en la fuente sale como «?».
 */
function glifo(letra: string) {
	const mayuscula = letra.toUpperCase();
	if (mayuscula === 'Ñ') return 'Ñ';
	const base = mayuscula.normalize('NFD').replace(/[̀-ͯ]/g, '');
	return MAPAS.has(base) ? base : '?';
}

/** Una línea de texto a rejilla: cada celda dice si hay tinta y de qué letra. */
function rejilla(linea: string) {
	const filas: (string | null)[][] = Array.from({ length: ALTO }, () => []);
	[...linea].forEach((letra, indice) => {
		const clave = glifo(letra);
		const mapa = MAPAS.get(clave)!;
		// Una columna de aire entre letras, y ninguna al final.
		for (let fila = 0; fila < ALTO; fila++) {
			if (indice > 0) filas[fila].push(null);
			for (const tinta of mapa[fila]) filas[fila].push(tinta ? clave : null);
		}
	});
	return filas;
}

function pintar(filas: (string | null)[][], tinta: (letra: string) => string) {
	return filas.map((fila) => fila.map((celda) => (celda ? tinta(celda) : ' ')).join(''));
}

/** Sombra abajo a la derecha: cae justo en el hueco entre letras. */
function conSombra(filas: (string | null)[][]) {
	const ancho = (filas[0]?.length ?? 0) + 1;
	const hay = (fila: number, columna: number) => Boolean(filas[fila]?.[columna]);
	return Array.from({ length: ALTO + 1 }, (_, fila) =>
		Array.from({ length: ancho }, (_, columna) => {
			if (hay(fila, columna)) return '█';
			return hay(fila - 1, columna - 1) ? '░' : ' ';
		}).join(''),
	);
}

/** Media altura: dos filas de la rejilla caben en una con ▀ y ▄. */
function mini(filas: (string | null)[][]) {
	const salida: string[] = [];
	for (let fila = 0; fila < ALTO; fila += 2) {
		const arriba = filas[fila];
		const abajo = filas[fila + 1] ?? [];
		salida.push(
			arriba
				.map((celda, columna) => {
					const bajo = Boolean(abajo[columna]);
					if (celda && bajo) return '█';
					if (celda) return '▀';
					return bajo ? '▄' : ' ';
				})
				.join(''),
		);
	}
	return salida;
}

function linea(texto: string, estilo: Style) {
	const filas = rejilla(texto);
	switch (estilo) {
		case 'sombra':
			return conSombra(filas);
		case 'almohadilla':
			return pintar(filas, () => '#');
		case 'cursiva':
			// Cada fila se corre un hueco a la derecha respecto a la de abajo.
			return pintar(filas, () => '█').map((fila, indice) => ' '.repeat(ALTO - 1 - indice) + fila);
		case 'mini':
			return mini(filas);
		case 'letras':
			return pintar(filas, (letra) => letra);
		default:
			return pintar(filas, () => '█');
	}
}

/**
 * El texto entero en letras grandes. Cada línea escrita es un bloque, con una
 * línea en blanco entre bloques; los espacios del final sobran y se quitan.
 */
export function toAscii(texto: string, estilo: Style) {
	return texto
		.slice(0, MAX_CHARS)
		.split(/\r?\n/)
		.map((trozo) => trozo.trim())
		.filter(Boolean)
		.map((trozo) =>
			linea(trozo, estilo)
				.map((fila) => fila.trimEnd())
				.join('\n'),
		)
		.join('\n\n');
}

/** Letras que no tienen glifo y saldrán como «?», sin repetir. */
export function missing(texto: string) {
	const fuera = new Set<string>();
	for (const letra of texto.slice(0, MAX_CHARS)) {
		if (/\s/.test(letra)) continue;
		if (glifo(letra) === '?' && letra !== '?') fuera.add(letra);
	}
	return [...fuera];
}
