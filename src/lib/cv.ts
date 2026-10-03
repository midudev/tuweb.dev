/**
 * Currículum: cabecera, resumen y secciones libres, pintado como SVG en tamaño
 * A4. Tres plantillas —clásica, lateral y compacta— comparten la forma de
 * pintar cada sección. Del SVG salen el PNG y el PDF, como en las infografías.
 */
import { MONO, esc } from './chart';

export type Plantilla = 'clasica' | 'lateral' | 'compacta';
export type Fuente = 'pixel' | 'mono';
export type Cuerpo = 'pequeno' | 'normal' | 'grande';

export interface Seccion {
	titulo: string;
	/** Una entrada por línea. «Algo | fecha» pone la fecha a la derecha; «- algo», una viñeta. */
	cuerpo: string;
}

export interface Cv {
	nombre: string;
	puesto: string;
	/** Correo, teléfono, web, ciudad: uno por línea. */
	contacto: string;
	resumen: string;
	plantilla: Plantilla;
	fuente: Fuente;
	cuerpo: Cuerpo;
	fondo: string;
	texto: string;
	acento: string;
	secciones: Seccion[];
}

export const PLANTILLAS: { id: Plantilla; label: string }[] = [
	{ id: 'clasica', label: 'Clásica' },
	{ id: 'lateral', label: 'Lateral' },
	{ id: 'compacta', label: 'Compacta' },
];

export const CUERPOS: { id: Cuerpo; label: string; size: number }[] = [
	{ id: 'pequeno', label: 'Pequeña', size: 11 },
	{ id: 'normal', label: 'Normal', size: 12.5 },
	{ id: 'grande', label: 'Grande', size: 14 },
];

export const MAX_SECCIONES = 10;
export const CLAVE = 'tuweb:cv';

export const EJEMPLO: Cv = {
	nombre: 'Ada Sánchez',
	puesto: 'Desarrolladora frontend',
	contacto: 'ada@ejemplo.dev\n+34 600 000 000\nejemplo.dev\nValencia',
	resumen:
		'Seis años haciendo interfaces que cargan rápido y se entienden a la primera. Me gusta el CSS bien hecho, los tests que sirven y explicar lo que hago.',
	plantilla: 'clasica',
	fuente: 'pixel',
	cuerpo: 'normal',
	fondo: '#ffffff',
	texto: '#1f2328',
	acento: '#2563eb',
	secciones: [
		{
			titulo: 'Experiencia',
			cuerpo:
				'Frontend en Acme | 2021 - hoy\n- Rehíce el panel de clientes en Astro: la carga bajó a la mitad.\n- Monté la librería de componentes del equipo.\nDesarrolladora web en Estudio Norte | 2018 - 2021\n- Webs para comercio local, de la maqueta a producción.',
		},
		{
			titulo: 'Formación',
			cuerpo: 'Grado en Ingeniería Informática, UPV | 2014 - 2018',
		},
		{
			titulo: 'Habilidades',
			cuerpo: 'TypeScript, Astro, React, CSS, SQL, accesibilidad, tests',
		},
		{
			titulo: 'Idiomas',
			cuerpo: 'Español | nativo\nInglés | C1',
		},
	],
};

/** Una sección vacía con su pista, para el botón de añadir. */
export const NUEVAS: Seccion[] = [
	{ titulo: 'Proyectos', cuerpo: 'Nombre del proyecto | 2024\n- Qué hiciste y qué salió.' },
	{ titulo: 'Certificados', cuerpo: 'Nombre del certificado | 2023' },
	{ titulo: 'Voluntariado', cuerpo: 'Dónde | 2022\n- Qué hacías.' },
	{ titulo: 'Otra sección', cuerpo: '' },
];

const PIXEL = 'Geist Pixel, Geist Mono Variable, monospace';
/** A4 a 96 puntos por pulgada. */
export const ANCHO = 794;
export const ALTO = 1123;
/** Las dos letras son de ancho fijo, así que medir un texto es contar. */
const CHAR = 0.6;

const r1 = (n: number) => Math.round(n * 10) / 10;
const color = (value: unknown, fallback: string) =>
	typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
const texto = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '');

/** Lo que venga de localStorage se revisa campo a campo: si algo no cuadra, va el de serie. */
export function sanea(datos: unknown): Cv {
	if (!datos || typeof datos !== 'object') return structuredClone(EJEMPLO);
	const d = datos as Record<string, unknown>;
	const secciones = Array.isArray(d.secciones) ? d.secciones : [];
	return {
		nombre: texto(d.nombre, 80),
		puesto: texto(d.puesto, 80),
		contacto: texto(d.contacto, 300),
		resumen: texto(d.resumen, 800),
		plantilla: PLANTILLAS.some((p) => p.id === d.plantilla) ? (d.plantilla as Plantilla) : 'clasica',
		fuente: d.fuente === 'mono' ? 'mono' : 'pixel',
		cuerpo: CUERPOS.some((c) => c.id === d.cuerpo) ? (d.cuerpo as Cuerpo) : 'normal',
		fondo: color(d.fondo, EJEMPLO.fondo),
		texto: color(d.texto, EJEMPLO.texto),
		acento: color(d.acento, EJEMPLO.acento),
		secciones: secciones.slice(0, MAX_SECCIONES).map((s) => ({
			titulo: texto((s as Seccion)?.titulo, 60),
			cuerpo: texto((s as Seccion)?.cuerpo, 2000),
		})),
	};
}

/** Parte el texto en líneas que caben en el ancho; las palabras largas se cortan. */
function lineas(valor: string, size: number, ancho: number) {
	const max = Math.max(4, Math.floor(ancho / (size * CHAR)));
	const salida: string[] = [];
	for (const parrafo of valor.split('\n')) {
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
	titular: string;
	size: number;
}

function linea(x: number, y: number, valor: string, size: number, fill: string, familia = MONO, extra = '') {
	return `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-family="${familia}" fill="${fill}"${extra}>${esc(valor)}</text>`;
}

/** Un bloque de texto que se parte solo; devuelve el SVG y lo que ocupa. */
function parrafo(x: number, y: number, ancho: number, valor: string, size: number, fill: string, extra = '') {
	const filas = lineas(valor, size, ancho);
	const alto = size * 1.5;
	return { svg: filas.map((f, i) => linea(x, y + size + i * alto, f, size, fill, MONO, extra)).join(''), alto: filas.length * alto };
}

/** El cuerpo de una sección: entradas con su fecha a la derecha, viñetas o texto suelto. */
function cuerpo(valor: string, x: number, y: number, ancho: number, ctx: Ctx) {
	const partes: string[] = [];
	const s = ctx.size;
	let cy = y;
	for (const fila of valor.split('\n')) {
		const limpia = fila.trim();
		if (!limpia) {
			cy += s * 0.6;
			continue;
		}
		if (/^[-*]\s/.test(limpia)) {
			partes.push(`<rect x="${r1(x + 2)}" y="${r1(cy + s * 0.55)}" width="${r1(s * 0.35)}" height="${r1(s * 0.35)}" fill="${ctx.acento}"/>`);
			const p = parrafo(x + s * 1.2, cy, ancho - s * 1.2, limpia.slice(2).trim(), s, ctx.tinta, ' fill-opacity="0.85"');
			partes.push(p.svg);
			cy += p.alto + 2;
			continue;
		}
		const [izquierda, ...resto] = limpia.split('|');
		const fecha = resto.join('|').trim();
		const huecoFecha = fecha ? fecha.length * s * CHAR + s : 0;
		const p = parrafo(x, cy, ancho - huecoFecha, izquierda.trim(), s, ctx.tinta, fecha ? ' font-weight="600"' : '');
		partes.push(p.svg);
		if (fecha) {
			partes.push(linea(x + ancho, cy + s, fecha, s, ctx.acento, MONO, ' text-anchor="end"'));
			cy += 3;
		}
		cy += p.alto + 2;
	}
	return { svg: partes.join(''), alto: cy - y };
}

/** Título de sección arriba y cuerpo debajo, con su raya. */
function seccion(s: Seccion, x: number, y: number, ancho: number, ctx: Ctx, fill = ctx.acento) {
	const t = ctx.size + 3;
	const partes = [
		linea(x, y + t, s.titulo.toUpperCase() || 'SIN TÍTULO', t, fill, ctx.titular, ' letter-spacing="1"'),
		`<rect x="${r1(x)}" y="${r1(y + t + 8)}" width="${r1(ancho)}" height="1" fill="${fill}" fill-opacity="0.4"/>`,
	];
	const hecho = cuerpo(s.cuerpo, x, y + t + 16, ancho, ctx);
	partes.push(hecho.svg);
	return { svg: partes.join(''), alto: t + 16 + hecho.alto };
}

function contactos(cv: Cv) {
	return cv.contacto
		.split('\n')
		.map((c) => c.trim())
		.filter(Boolean);
}

export function construye(cv: Cv, opciones: { fontCss?: string } = {}) {
	const ctx: Ctx = {
		tinta: color(cv.texto, EJEMPLO.texto),
		acento: color(cv.acento, EJEMPLO.acento),
		titular: cv.fuente === 'mono' ? MONO : PIXEL,
		size: CUERPOS.find((c) => c.id === cv.cuerpo)?.size ?? 12.5,
	};
	const fondo = color(cv.fondo, EJEMPLO.fondo);
	const W = ANCHO;
	const P = 48;
	const partes: string[] = [];
	const nombre = cv.nombre.trim() || 'Tu nombre';
	const hueco = ctx.size * 2;
	let y = P;
	let fondoLateral = '';

	if (cv.plantilla === 'lateral') {
		// Columna de color a la izquierda con el nombre y el contacto; el resto, a la derecha.
		const L = 240;
		const dentro = L - 2 * 32;
		let ly = P;
		const nSize = 26;
		lineas(nombre, nSize, dentro).forEach((fila) => {
			partes.push(linea(32, ly + nSize, fila, nSize, fondo, ctx.titular));
			ly += nSize * 1.2;
		});
		if (cv.puesto.trim()) {
			const p = parrafo(32, ly + 6, dentro, cv.puesto, ctx.size + 1, fondo, ' fill-opacity="0.85"');
			partes.push(p.svg);
			ly += 6 + p.alto;
		}
		ly += 28;
		for (const c of contactos(cv)) {
			const p = parrafo(32, ly, dentro, c, ctx.size - 1, fondo);
			partes.push(p.svg);
			ly += p.alto + 4;
		}
		const x = L + 40;
		const ancho = W - x - P;
		if (cv.resumen.trim()) {
			const r = parrafo(x, y, ancho, cv.resumen, ctx.size, ctx.tinta);
			partes.push(r.svg);
			y += r.alto + hueco;
		}
		for (const s of cv.secciones) {
			const hecho = seccion(s, x, y, ancho, ctx);
			partes.push(hecho.svg);
			y += hecho.alto + hueco;
		}
		y = Math.max(y, ly);
		fondoLateral = `<rect width="${L}" height="__ALTO__" fill="${ctx.acento}"/>`;
	} else {
		const ancho = W - 2 * P;
		const nSize = cv.plantilla === 'compacta' ? 30 : 38;
		if (cv.plantilla === 'clasica') {
			partes.push(`<rect x="${P}" y="${y}" width="48" height="6" fill="${ctx.acento}"/>`);
			y += 22;
		}
		lineas(nombre, nSize, ancho).forEach((fila) => {
			partes.push(linea(P, y + nSize, fila, nSize, ctx.tinta, ctx.titular));
			y += nSize * 1.15;
		});
		if (cv.puesto.trim()) {
			const p = parrafo(P, y + 4, ancho, cv.puesto, ctx.size + 3, ctx.acento);
			partes.push(p.svg);
			y += 4 + p.alto;
		}
		const lista = contactos(cv);
		if (lista.length) {
			const p = parrafo(P, y + 8, ancho, lista.join('  ·  '), ctx.size - 1, ctx.tinta, ' fill-opacity="0.7"');
			partes.push(p.svg);
			y += 8 + p.alto;
		}
		y += hueco;
		if (cv.plantilla === 'compacta') {
			// El título de cada sección va en el margen izquierdo, el cuerpo a su lado.
			const G = 150;
			partes.push(`<rect x="${P}" y="${r1(y - hueco / 2)}" width="${ancho}" height="2" fill="${ctx.acento}"/>`);
			const t = ctx.size + 1;
			const margen = (titulo: string, hecho: { svg: string; alto: number }) => {
				partes.push(linea(P, y + t, titulo.toUpperCase() || 'SIN TÍTULO', t, ctx.acento, ctx.titular), hecho.svg);
				y += Math.max(hecho.alto, t * 1.5) + hueco;
			};
			if (cv.resumen.trim()) margen('Perfil', parrafo(P + G, y, ancho - G, cv.resumen, ctx.size, ctx.tinta));
			for (const s of cv.secciones) margen(s.titulo, cuerpo(s.cuerpo, P + G, y, ancho - G, ctx));
		} else {
			if (cv.resumen.trim()) {
				const r = parrafo(P, y, ancho, cv.resumen, ctx.size, ctx.tinta);
				partes.push(r.svg);
				y += r.alto + hueco;
			}
			for (const s of cv.secciones) {
				const hecho = seccion(s, P, y, ancho, ctx);
				partes.push(hecho.svg);
				y += hecho.alto + hueco;
			}
		}
	}

	// Una hoja A4 como mínimo; si no cabe, la hoja crece.
	const H = Math.max(ALTO, Math.ceil(y - hueco + P));
	const estilo = opciones.fontCss ? `<style>${opciones.fontCss}</style>` : '';
	const lateral = fondoLateral.replace('__ALTO__', String(H));
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${estilo}<rect width="${W}" height="${H}" fill="${fondo}"/>${lateral}${partes.join('')}</svg>`;
	return { svg, width: W, height: H };
}
