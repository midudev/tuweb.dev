/*
 * Las plantillas del generador de memes. No son fotos: cada una se dibuja en el
 * lienzo con cuatro rectángulos y los colores de la casa, así que no pesan nada
 * y no hay que traer ninguna imagen de fuera.
 */

type Ctx = CanvasRenderingContext2D;

export interface Template {
	id: string;
	label: string;
	icon: string;
	width: number;
	height: number;
	/** Los textos con los que arranca; luego se cambian como cualquier otro. */
	arriba: string;
	abajo: string;
	draw: (ctx: Ctx, width: number, height: number) => void;
}

const C = {
	bg: '#fdf6ef',
	fg: '#3b2d24',
	muted: '#7a6152',
	line: '#e8d9c8',
	panel: '#f7ece1',
	accent: '#c2410c',
	naranja: '#fc784b',
	amarillo: '#f5b041',
	ok: '#2f7a3b',
	noche: '#17110d',
};

const MONO = '"Geist Mono Variable", monospace';

function rect(ctx: Ctx, color: string, x: number, y: number, w: number, h: number) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, w, h);
}

/** Una llama: una gota puesta del revés, con la punta un poco torcida. */
function llama(ctx: Ctx, x: number, base: number, ancho: number, alto: number, color: string) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(x - ancho / 2, base);
	ctx.quadraticCurveTo(x - ancho / 2, base - alto * 0.6, x + ancho * 0.1, base - alto);
	ctx.quadraticCurveTo(x + ancho / 2, base - alto * 0.5, x + ancho / 2, base);
	ctx.closePath();
	ctx.fill();
}

function fuego(ctx: Ctx, w: number, h: number) {
	rect(ctx, C.panel, 0, 0, w, h);
	rect(ctx, C.line, 0, h * 0.72, w, h * 0.28);

	// La ventana del fondo.
	rect(ctx, C.fg, 120, 230, 260, 220);
	rect(ctx, C.naranja, 135, 245, 230, 190);
	rect(ctx, C.fg, 245, 245, 10, 190);

	// Llamas por la pared y por el suelo, repartidas sin azar para que salgan siempre igual.
	for (let i = 0; i < 12; i++) {
		const x = i * 90 + 20;
		const alto = 220 + ((i * 73) % 160);
		llama(ctx, x, h, 130, alto, C.accent);
		llama(ctx, x + 10, h, 80, alto * 0.65, C.naranja);
		llama(ctx, x + 14, h, 40, alto * 0.35, C.amarillo);
	}
	for (let i = 0; i < 4; i++) {
		llama(ctx, 860 + i * 30, 620 - i * 40, 90, 200, i % 2 ? C.naranja : C.accent);
	}

	// La mesa, la taza y quien dice que todo va bien.
	rect(ctx, C.fg, 400, 640, 380, 26);
	rect(ctx, C.fg, 420, 666, 20, 130);
	rect(ctx, C.fg, 740, 666, 20, 130);
	rect(ctx, C.accent, 640, 580, 56, 60);
	ctx.strokeStyle = C.accent;
	ctx.lineWidth = 10;
	ctx.strokeRect(696, 596, 22, 26);
	rect(ctx, C.muted, 480, 470, 110, 170);
	rect(ctx, C.amarillo, 490, 360, 90, 100);
	rect(ctx, C.fg, 510, 395, 12, 12);
	rect(ctx, C.fg, 548, 395, 12, 12);
	rect(ctx, C.fg, 515, 428, 40, 6);

	// El humo pega arriba.
	ctx.fillStyle = 'rgba(23, 17, 13, 0.35)';
	ctx.fillRect(0, 0, w, 200);
	ctx.fillStyle = 'rgba(23, 17, 13, 0.18)';
	ctx.fillRect(0, 200, w, 80);
}

function botones(ctx: Ctx, w: number, h: number) {
	rect(ctx, C.panel, 0, 0, w, h);
	rect(ctx, C.fg, 130, 320, 740, 380);
	rect(ctx, C.muted, 130, 680, 740, 20);

	const boton = (x: number, color: string, letra: string) => {
		rect(ctx, C.noche, x, 470, 240, 150);
		rect(ctx, color, x, 420, 240, 150);
		ctx.fillStyle = C.bg;
		ctx.font = `700 90px ${MONO}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(letra, x + 120, 497);
	};
	boton(210, C.accent, 'A');
	boton(550, C.ok, 'B');

	// La gota de sudor de quien no sabe cuál pulsar.
	ctx.fillStyle = C.muted;
	ctx.beginPath();
	ctx.moveTo(500, 250);
	ctx.quadraticCurveTo(470, 300, 500, 310);
	ctx.quadraticCurveTo(530, 300, 500, 250);
	ctx.fill();
}

function comparar(ctx: Ctx, w: number, h: number) {
	const mitad = h / 2;
	rect(ctx, C.panel, 0, 0, w, mitad);
	rect(ctx, C.bg, 0, mitad, w, mitad);
	rect(ctx, C.line, 0, mitad - 4, w, 8);
	rect(ctx, C.line, w / 2 - 4, 0, 8, h);

	const lado = 260;
	const x = w / 4 - lado / 2;
	ctx.lineWidth = 42;
	ctx.lineCap = 'square';

	// Arriba, lo que no.
	const y1 = mitad / 2 - lado / 2 + 40;
	ctx.strokeStyle = C.accent;
	ctx.beginPath();
	ctx.moveTo(x, y1);
	ctx.lineTo(x + lado, y1 + lado);
	ctx.moveTo(x + lado, y1);
	ctx.lineTo(x, y1 + lado);
	ctx.stroke();

	// Abajo, lo que sí.
	const y2 = mitad + mitad / 2 - lado / 2 - 40;
	ctx.strokeStyle = C.ok;
	ctx.beginPath();
	ctx.moveTo(x, y2 + lado * 0.55);
	ctx.lineTo(x + lado * 0.38, y2 + lado);
	ctx.lineTo(x + lado, y2);
	ctx.stroke();
	ctx.lineCap = 'butt';
}

function grafica(ctx: Ctx, w: number, h: number) {
	rect(ctx, C.bg, 0, 0, w, h);

	ctx.strokeStyle = C.line;
	ctx.lineWidth = 2;
	for (let x = 100; x < w; x += 100) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, h);
		ctx.stroke();
	}
	for (let y = 100; y < h; y += 100) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(w, y);
		ctx.stroke();
	}

	ctx.strokeStyle = C.fg;
	ctx.lineWidth = 8;
	ctx.beginPath();
	ctx.moveTo(100, 160);
	ctx.lineTo(100, h - 100);
	ctx.lineTo(w - 60, h - 100);
	ctx.stroke();

	const puntos: [number, number][] = [
		[120, 640],
		[300, 520],
		[450, 560],
		[600, 330],
		[720, 280],
		[820, 380],
		[900, 350],
		[1060, 740],
	];
	ctx.strokeStyle = C.accent;
	ctx.lineWidth = 16;
	ctx.lineJoin = 'miter';
	ctx.beginPath();
	puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
	ctx.stroke();

	// La punta de flecha, apuntando hacia donde cae.
	const [ax, ay] = puntos[puntos.length - 2];
	const [bx, by] = puntos[puntos.length - 1];
	const angulo = Math.atan2(by - ay, bx - ax);
	ctx.fillStyle = C.accent;
	ctx.beginPath();
	ctx.moveTo(bx + Math.cos(angulo) * 30, by + Math.sin(angulo) * 30);
	ctx.lineTo(bx + Math.cos(angulo + 2.4) * 50, by + Math.sin(angulo + 2.4) * 50);
	ctx.lineTo(bx + Math.cos(angulo - 2.4) * 50, by + Math.sin(angulo - 2.4) * 50);
	ctx.closePath();
	ctx.fill();
}

function terminal(ctx: Ctx, w: number, h: number) {
	rect(ctx, C.noche, 0, 0, w, h);
	rect(ctx, C.fg, 0, 0, w, 56);
	[C.accent, C.amarillo, C.ok].forEach((color, i) => rect(ctx, color, 28 + i * 40, 18, 22, 22));

	const lineas: [string, string][] = [
		[C.naranja, '$ git push --force origin main'],
		[C.muted, 'Enumerating objects: 1337, done.'],
		[C.muted, 'Writing objects: 100% (1337/1337)'],
		[C.bg, '+ 4f2a9c1...b7e0d3a (forced update)'],
		[C.naranja, '$ _'],
	];
	ctx.font = `400 34px ${MONO}`;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	lineas.forEach(([color, texto], i) => {
		ctx.fillStyle = color;
		ctx.fillText(texto, 60, 320 + i * 64, w - 120);
	});
}

const BICHO = [
	'..X.....X..',
	'...X...X...',
	'..XXXXXXX..',
	'.XX.XXX.XX.',
	'XXXXXXXXXXX',
	'X.XXXXXXX.X',
	'X.X.....X.X',
	'...XX.XX...',
];

function bicho(ctx: Ctx, w: number, h: number) {
	rect(ctx, C.bg, 0, 0, w, h);

	ctx.strokeStyle = C.line;
	ctx.lineWidth = 2;
	for (let i = 0; i <= w; i += 50) {
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i, h);
		ctx.moveTo(0, i);
		ctx.lineTo(w, i);
		ctx.stroke();
	}

	const celda = 60;
	const x0 = (w - BICHO[0].length * celda) / 2;
	const y0 = (h - BICHO.length * celda) / 2;
	BICHO.forEach((fila, y) => {
		[...fila].forEach((c, x) => {
			if (c === 'X') rect(ctx, C.accent, x0 + x * celda, y0 + y * celda, celda, celda);
		});
	});
}

export const TEMPLATES: readonly Template[] = [
	{
		id: 'fuego',
		label: 'Todo bien',
		icon: 'flame',
		width: 1000,
		height: 1000,
		arriba: 'PRODUCCIÓN EN LLAMAS',
		abajo: 'TODO BIEN',
		draw: fuego,
	},
	{
		id: 'botones',
		label: 'Dos botones',
		icon: 'hand-click',
		width: 1000,
		height: 1000,
		arriba: 'A: ARREGLARLO BIEN',
		abajo: 'B: OTRO PARCHE',
		draw: botones,
	},
	{
		id: 'comparar',
		label: 'No y sí',
		icon: 'layout-columns',
		width: 1000,
		height: 1000,
		arriba: 'LEER LA DOCUMENTACIÓN',
		abajo: 'PROBAR HASTA QUE VAYA',
		draw: comparar,
	},
	{
		id: 'grafica',
		label: 'Gráfica',
		icon: 'trending-down',
		width: 1200,
		height: 900,
		arriba: 'MI MOTIVACIÓN',
		abajo: 'EL VIERNES A LAS 18:00',
		draw: grafica,
	},
	{
		id: 'terminal',
		label: 'Terminal',
		icon: 'terminal-2',
		width: 1000,
		height: 1000,
		arriba: 'NADIE:',
		abajo: 'YO UN VIERNES:',
		draw: terminal,
	},
	{
		id: 'bicho',
		label: 'Bicho',
		icon: 'bug',
		width: 1000,
		height: 1000,
		arriba: 'NO ES UN BUG',
		abajo: 'ES UNA FEATURE',
		draw: bicho,
	},
];

export function templateOf(id: string) {
	return TEMPLATES.find((template) => template.id === id) ?? null;
}
