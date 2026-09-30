/**
 * Infografías: una columna de secciones (cifras, texto, pasos y barras) que se
 * pinta como SVG. Las cifras seguidas se ponen en fila, de tres en tres. De
 * aquí salen el SVG, el PNG (vía canvas) y un PDF de una página hecho a mano.
 */
import { MONO, esc, parseNumber } from './chart';

export type Tipo = 'cifra' | 'texto' | 'pasos' | 'barras';
export type Fuente = 'pixel' | 'mono';

export interface Seccion {
	tipo: Tipo;
	titulo: string;
	cuerpo: string;
}

export interface Estilo {
	fondo: string;
	texto: string;
	acento: string;
	fuente: Fuente;
	ancho: number;
	separadores: boolean;
}

export interface Infografia {
	titulo: string;
	subtitulo: string;
	pie: string;
	estilo: Estilo;
	secciones: Seccion[];
}

export const TIPOS: { id: Tipo; label: string; icon: string; titulo: string; cuerpo: string }[] = [
	{ id: 'cifra', label: 'Cifra', icon: 'number', titulo: 'Cifra', cuerpo: 'Qué significa' },
	{ id: 'texto', label: 'Texto', icon: 'align-left', titulo: 'Titular', cuerpo: 'Texto' },
	{ id: 'pasos', label: 'Pasos', icon: 'list-numbers', titulo: 'Titular', cuerpo: 'Un paso por línea' },
	{ id: 'barras', label: 'Barras', icon: 'chart-bar', titulo: 'Titular', cuerpo: 'Una por línea: Nombre: valor' },
];

export const ANCHOS = [600, 800, 1080];
export const MAX_SECCIONES = 12;

export const PLANTILLAS: { id: string; label: string; info: Infografia }[] = [
	{
		id: 'cifras',
		label: 'En cifras',
		info: {
			titulo: 'Tu proyecto en cifras',
			subtitulo: 'Datos de ejemplo: cámbialos por los tuyos',
			pie: 'Fuente: tus datos',
			estilo: { fondo: '#fdf6ef', texto: '#3b2d24', acento: '#c2410c', fuente: 'pixel', ancho: 800, separadores: true },
			secciones: [
				{ tipo: 'cifra', titulo: '12 k', cuerpo: 'visitas al mes' },
				{ tipo: 'cifra', titulo: '48 %', cuerpo: 'llegan desde el móvil' },
				{ tipo: 'cifra', titulo: '3 min', cuerpo: 'de media por visita' },
				{ tipo: 'barras', titulo: 'De dónde llegan', cuerpo: 'Buscadores: 42\nRedes: 27\nDirecto: 18\nOtros: 9' },
			],
		},
	},
	{
		id: 'proceso',
		label: 'Proceso',
		info: {
			titulo: 'Cómo sale una idea',
			subtitulo: 'De la propuesta a la web',
			pie: 'tuweb.dev',
			estilo: { fondo: '#17110d', texto: '#f3e7db', acento: '#fc784b', fuente: 'pixel', ancho: 600, separadores: false },
			secciones: [
				{ tipo: 'texto', titulo: 'La regla', cuerpo: 'Cada idea es interfaz: todo se resuelve en el navegador.' },
				{
					tipo: 'pasos',
					titulo: 'Los pasos',
					cuerpo: 'Alguien propone una idea\nLa gente vota\nSe cierra la ventana\nLa ganadora se implementa',
				},
			],
		},
	},
	{
		id: 'comparativa',
		label: 'Comparativa',
		info: {
			titulo: 'Lenguajes del equipo',
			subtitulo: 'Porcentaje del código en cada uno',
			pie: 'Datos de ejemplo',
			estilo: { fondo: '#f1f7f2', texto: '#17301f', acento: '#008300', fuente: 'mono', ancho: 800, separadores: true },
			secciones: [
				{ tipo: 'barras', titulo: 'Reparto', cuerpo: 'TypeScript: 48\nCSS: 22\nAstro: 16\nSQL: 14' },
				{ tipo: 'cifra', titulo: '4', cuerpo: 'lenguajes en uso' },
				{ tipo: 'texto', titulo: 'Conclusión', cuerpo: 'Casi la mitad es TypeScript. El SQL va a mano, sin ORM.' },
			],
		},
	},
];

const PIXEL = 'Geist Pixel, Geist Mono Variable, monospace';
/** Las dos letras son de ancho fijo, así que medir un texto es contar. */
const CHAR = 0.6;

const r1 = (n: number) => Math.round(n * 10) / 10;
const safe = (value: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(value) ? value : fallback);

/** Parte el texto en líneas que caben en el ancho; las palabras largas se cortan. */
function lineas(texto: string, size: number, ancho: number) {
	const max = Math.max(4, Math.floor(ancho / (size * CHAR)));
	const salida: string[] = [];
	for (const parrafo of texto.split('\n')) {
		let linea = '';
		for (let palabra of parrafo.split(/\s+/).filter(Boolean)) {
			while (palabra.length > max) {
				if (linea) salida.push(linea);
				linea = '';
				salida.push(palabra.slice(0, max));
				palabra = palabra.slice(max);
			}
			if (!palabra) continue;
			if (!linea) linea = palabra;
			else if (linea.length + 1 + palabra.length <= max) linea += ` ${palabra}`;
			else {
				salida.push(linea);
				linea = palabra;
			}
		}
		if (linea) salida.push(linea);
	}
	return salida;
}

interface Ctx {
	tinta: string;
	acento: string;
	fondo: string;
	titular: string;
}

/** Un bloque de líneas desde `y` (arriba). Devuelve el SVG y lo que ocupa. */
function bloque(x: number, y: number, filas: string[], size: number, alto: number, color: string, familia: string, extra = '') {
	const svg = filas
		.map(
			(fila, i) =>
				`<text x="${r1(x)}" y="${r1(y + size * 0.85 + i * alto)}" font-size="${size}" font-family="${familia}" fill="${color}"${extra}>${esc(fila)}</text>`,
		)
		.join('');
	return { svg, alto: filas.length * alto };
}

function cifras(grupo: Seccion[], x: number, y: number, ancho: number, ctx: Ctx) {
	const hueco = 24;
	const celda = (ancho - hueco * (grupo.length - 1)) / grupo.length;
	const size = grupo.length === 1 ? 72 : grupo.length === 2 ? 56 : 44;
	let alto = 0;
	const svg = grupo
		.map((seccion, i) => {
			const cx = x + i * (celda + hueco);
			const cifra = bloque(cx, y, lineas(seccion.titulo, size, celda), size, size * 1.1, ctx.acento, ctx.titular);
			const texto = bloque(cx, y + cifra.alto + 8, lineas(seccion.cuerpo, 15, celda), 15, 22, ctx.tinta, MONO, ' fill-opacity="0.75"');
			alto = Math.max(alto, cifra.alto + 8 + texto.alto);
			return cifra.svg + texto.svg;
		})
		.join('');
	return { svg, alto };
}

function seccion(s: Seccion, x: number, y: number, ancho: number, ctx: Ctx) {
	const partes: string[] = [];
	let cy = y;
	if (s.titulo.trim()) {
		const cabeza = bloque(x, cy, lineas(s.titulo, 22, ancho), 22, 29, ctx.tinta, ctx.titular);
		partes.push(cabeza.svg);
		cy += cabeza.alto + 14;
	}

	if (s.tipo === 'texto') {
		const cuerpo = bloque(x, cy, lineas(s.cuerpo, 16, ancho), 16, 25, ctx.tinta, MONO, ' fill-opacity="0.85"');
		partes.push(cuerpo.svg);
		cy += cuerpo.alto;
	}

	if (s.tipo === 'pasos') {
		const pasos = s.cuerpo.split('\n').map((p) => p.trim()).filter(Boolean).slice(0, 20);
		pasos.forEach((paso, i) => {
			partes.push(`<rect x="${x}" y="${r1(cy)}" width="32" height="32" fill="${ctx.acento}"/>`);
			partes.push(
				`<text x="${x + 16}" y="${r1(cy + 21)}" font-size="15" font-family="${ctx.titular}" fill="${ctx.fondo}" text-anchor="middle">${i + 1}</text>`,
			);
			const texto = bloque(x + 48, cy + 4, lineas(paso, 16, ancho - 48), 16, 24, ctx.tinta, MONO);
			partes.push(texto.svg);
			cy += Math.max(32, texto.alto + 8) + 12;
		});
		if (pasos.length) cy -= 12;
	}

	if (s.tipo === 'barras') {
		const filas = s.cuerpo
			.split('\n')
			.flatMap((linea) => {
				const corte = linea.lastIndexOf(':');
				if (corte < 0) return [];
				const crudo = linea.slice(corte + 1).trim();
				const valor = parseNumber(crudo);
				return valor === null ? [] : [{ nombre: linea.slice(0, corte).trim(), valor, crudo }];
			})
			.slice(0, 20);
		const max = Math.max(0, ...filas.map((f) => f.valor));
		const hueco = Math.max(...filas.map((f) => f.crudo.length), 1) * 14 * CHAR + 12;
		const largo = Math.max(40, ancho - hueco);
		if (!filas.length) {
			const aviso = bloque(x, cy, ['Escribe «Nombre: valor» en cada línea.'], 14, 20, ctx.tinta, MONO, ' fill-opacity="0.6"');
			partes.push(aviso.svg);
			cy += aviso.alto;
		}
		filas.forEach((fila, i) => {
			const nombre = lineas(fila.nombre || ' ', 14, ancho)[0] ?? '';
			partes.push(bloque(x, cy, [nombre], 14, 20, ctx.tinta, MONO, ' fill-opacity="0.75"').svg);
			const w = max > 0 ? (Math.max(0, fila.valor) / max) * largo : 0;
			partes.push(`<rect x="${x}" y="${r1(cy + 22)}" width="${r1(ancho)}" height="18" fill="${ctx.tinta}" fill-opacity="0.08"/>`);
			partes.push(`<rect x="${x}" y="${r1(cy + 22)}" width="${r1(w)}" height="18" fill="${ctx.acento}"/>`);
			partes.push(
				`<text x="${r1(x + w + 8)}" y="${r1(cy + 36)}" font-size="14" font-family="${MONO}" fill="${ctx.tinta}">${esc(fila.crudo)}</text>`,
			);
			cy += i < filas.length - 1 ? 54 : 40;
		});
	}

	return { svg: partes.join(''), alto: cy - y };
}

/** Cifras seguidas van juntas en una fila (hasta tres); el resto, cada una sola. */
function agrupa(secciones: Seccion[]) {
	const grupos: Seccion[][] = [];
	for (const s of secciones) {
		const ultimo = grupos.at(-1);
		if (s.tipo === 'cifra' && ultimo?.[0].tipo === 'cifra' && ultimo.length < 3) ultimo.push(s);
		else grupos.push([s]);
	}
	return grupos;
}

export function construye(info: Infografia, opciones: { fontCss?: string } = {}) {
	const e = info.estilo;
	const ctx: Ctx = {
		fondo: safe(e.fondo, '#fdf6ef'),
		tinta: safe(e.texto, '#3b2d24'),
		acento: safe(e.acento, '#c2410c'),
		titular: e.fuente === 'mono' ? MONO : PIXEL,
	};
	const W = ANCHOS.includes(e.ancho) ? e.ancho : 800;
	const P = W >= 1000 ? 64 : 48;
	const dentro = W - 2 * P;
	const partes: string[] = [];
	let y = P;

	partes.push(`<rect x="${P}" y="${y}" width="48" height="8" fill="${ctx.acento}"/>`);
	y += 32;
	const tSize = W >= 1000 ? 56 : W >= 800 ? 44 : 34;
	const titulo = bloque(P, y, lineas(info.titulo || 'Sin título', tSize, dentro), tSize, tSize * 1.15, ctx.tinta, ctx.titular);
	partes.push(titulo.svg);
	y += titulo.alto;
	if (info.subtitulo.trim()) {
		const sub = bloque(P, y + 12, lineas(info.subtitulo, 18, dentro), 18, 27, ctx.tinta, MONO, ' fill-opacity="0.7"');
		partes.push(sub.svg);
		y += 12 + sub.alto;
	}
	y += 48;

	agrupa(info.secciones).forEach((grupo, i) => {
		if (i > 0) {
			y += 20;
			if (e.separadores) {
				partes.push(`<rect x="${P}" y="${r1(y)}" width="${dentro}" height="1" fill="${ctx.tinta}" fill-opacity="0.2"/>`);
			}
			y += 28;
		}
		const hecho = grupo[0].tipo === 'cifra' ? cifras(grupo, P, y, dentro, ctx) : seccion(grupo[0], P, y, dentro, ctx);
		partes.push(hecho.svg);
		y += hecho.alto;
	});

	if (info.pie.trim()) {
		y += 48;
		partes.push(`<rect x="${P}" y="${r1(y)}" width="${dentro}" height="2" fill="${ctx.acento}"/>`);
		const pie = bloque(P, y + 16, lineas(info.pie, 13, dentro), 13, 20, ctx.tinta, MONO, ' fill-opacity="0.7"');
		partes.push(pie.svg);
		y += 16 + pie.alto;
	}
	y += P;

	const H = Math.ceil(y);
	const estilo = opciones.fontCss ? `<style>${opciones.fontCss}</style>` : '';
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${estilo}<rect width="${W}" height="${H}" fill="${ctx.fondo}"/>${partes.join('')}</svg>`;
	return { svg, width: W, height: H };
}

/**
 * Un PDF de una página con la infografía dentro como JPEG. Es el PDF más
 * sencillo que existe: cinco objetos y su tabla de posiciones.
 */
export function pdfDesdeJpeg(jpeg: Uint8Array, ancho: number, alto: number, pixelesAncho: number, pixelesAlto: number) {
	const cifrador = new TextEncoder();
	const partes: BlobPart[] = [];
	const posiciones: number[] = [];
	let largo = 0;
	const suma = (parte: string | Uint8Array) => {
		const bytes = typeof parte === 'string' ? cifrador.encode(parte) : parte;
		partes.push(bytes as BlobPart);
		largo += bytes.length;
	};
	const objeto = (n: number, cuerpo: string) => {
		posiciones[n] = largo;
		suma(`${n} 0 obj\n${cuerpo}\nendobj\n`);
	};

	// Puntos PDF: 72 por pulgada frente a los 96 del píxel CSS.
	const pw = r1(ancho * 0.75);
	const ph = r1(alto * 0.75);
	suma('%PDF-1.4\n');
	objeto(1, '<< /Type /Catalog /Pages 2 0 R >>');
	objeto(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
	objeto(
		3,
		`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
	);
	posiciones[4] = largo;
	suma(
		`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelesAncho} /Height ${pixelesAlto} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
	);
	suma(jpeg);
	suma('\nendstream\nendobj\n');
	const dibujo = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
	objeto(5, `<< /Length ${dibujo.length} >>\nstream\n${dibujo}\nendstream`);

	const tabla = largo;
	const filas = posiciones.slice(1).map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('');
	suma(`xref\n0 6\n0000000000 65535 f \n${filas}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${tabla}\n%%EOF\n`);
	return new Blob(partes, { type: 'application/pdf' });
}
