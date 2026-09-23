/*
 * Análisis de imagen para la caja de herramientas: histograma, paleta dominante
 * y medidas de brillo y contraste. Todo sale de los píxeles de un canvas en el
 * navegador; la imagen no se sube a ninguna parte. Los píxeles casi
 * transparentes no cuentan: no tienen color que medir.
 */

export type Canal = 'r' | 'g' | 'b' | 'l';

export interface Histograma {
	r: number[];
	g: number[];
	b: number[];
	/** Luma de Rec. 709, de 0 a 255. */
	l: number[];
}

export interface Medidas {
	/** Píxeles que han contado. */
	pixeles: number;
	/** Brillo medio, de 0 a 1. */
	brillo: number;
	mediana: number;
	/** Contraste RMS: la desviación típica del brillo, de 0 a 0.5. */
	contraste: number;
	/** Percentiles 1 y 99 del brillo, de 0 a 1. */
	p1: number;
	p99: number;
	/** Fracción de píxeles negros del todo y blancos del todo. */
	sombras: number;
	luces: number;
	/** Saturación media (la de HSV), de 0 a 1. */
	saturacion: number;
	/** El color medio, en hex. */
	medio: string;
}

export interface ColorDominante {
	hex: string;
	/** Qué parte de la imagen ocupa, de 0 a 1. */
	peso: number;
}

const luma = (r: number, g: number, b: number) => Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

const hex2 = (value: number) => Math.round(value).toString(16).padStart(2, '0');
export const hexDe = (r: number, g: number, b: number) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

const visible = (datos: Uint8ClampedArray, i: number) => datos[i + 3] >= 128;

export function histograma(datos: Uint8ClampedArray): Histograma {
	const h: Histograma = {
		r: new Array(256).fill(0),
		g: new Array(256).fill(0),
		b: new Array(256).fill(0),
		l: new Array(256).fill(0),
	};
	for (let i = 0; i < datos.length; i += 4) {
		if (!visible(datos, i)) continue;
		const [r, g, b] = [datos[i], datos[i + 1], datos[i + 2]];
		h.r[r]++;
		h.g[g]++;
		h.b[b]++;
		h.l[luma(r, g, b)]++;
	}
	return h;
}

/** El valor por debajo del cual queda esa fracción de píxeles. */
function percentil(cubos: number[], total: number, fraccion: number) {
	let acumulado = 0;
	const meta = total * fraccion;
	for (let i = 0; i < cubos.length; i++) {
		acumulado += cubos[i];
		if (acumulado >= meta) return i;
	}
	return cubos.length - 1;
}

export function medidas(datos: Uint8ClampedArray, h: Histograma): Medidas | null {
	const total = h.l.reduce((suma, n) => suma + n, 0);
	if (!total) return null;

	let suma = 0;
	let cuadrados = 0;
	h.l.forEach((n, valor) => {
		suma += n * valor;
		cuadrados += n * valor * valor;
	});
	const media = suma / total;
	const desviacion = Math.sqrt(Math.max(0, cuadrados / total - media * media));

	let saturacion = 0;
	let [sr, sg, sb] = [0, 0, 0];
	for (let i = 0; i < datos.length; i += 4) {
		if (!visible(datos, i)) continue;
		const [r, g, b] = [datos[i], datos[i + 1], datos[i + 2]];
		const max = Math.max(r, g, b);
		if (max) saturacion += (max - Math.min(r, g, b)) / max;
		sr += r;
		sg += g;
		sb += b;
	}

	return {
		pixeles: total,
		brillo: media / 255,
		mediana: percentil(h.l, total, 0.5) / 255,
		contraste: desviacion / 255,
		p1: percentil(h.l, total, 0.01) / 255,
		p99: percentil(h.l, total, 0.99) / 255,
		sombras: h.l[0] / total,
		luces: h.l[255] / total,
		saturacion: saturacion / total,
		medio: hexDe(sr / total, sg / total, sb / total),
	};
}

/** Tres palabras para quien no quiere leer números. */
export function veredicto(m: Medidas) {
	const luz = m.brillo < 0.3 ? 'Oscura' : m.brillo > 0.7 ? 'Clara' : 'De luz media';
	const contraste = m.contraste < 0.12 ? 'poco contraste' : m.contraste > 0.25 ? 'mucho contraste' : 'contraste normal';
	const color = m.saturacion < 0.1 ? 'casi sin color' : m.saturacion > 0.5 ? 'colores vivos' : 'colores suaves';
	const avisos: string[] = [];
	if (m.sombras > 0.02) avisos.push('sombras empastadas');
	if (m.luces > 0.02) avisos.push('luces quemadas');
	return `${luz}, ${contraste}, ${color}${avisos.length ? `. Ojo: ${avisos.join(' y ')}` : ''}.`;
}

/*
 * La paleta sale por corte de la mediana: se parte la caja de colores por su
 * lado más largo hasta tener tantas como colores se piden. Es determinista, así
 * que la misma imagen da siempre la misma paleta.
 */

type Pixel = [number, number, number];

interface Caja {
	pixeles: Pixel[];
	/** Canal con más rango y cuánto rango tiene. */
	canal: 0 | 1 | 2;
	rango: number;
}

function caja(pixeles: Pixel[]): Caja {
	const min = [255, 255, 255];
	const max = [0, 0, 0];
	for (const p of pixeles) {
		for (let c = 0; c < 3; c++) {
			if (p[c] < min[c]) min[c] = p[c];
			if (p[c] > max[c]) max[c] = p[c];
		}
	}
	const rangos = [0, 1, 2].map((c) => max[c] - min[c]);
	const canal = rangos.indexOf(Math.max(...rangos)) as 0 | 1 | 2;
	return { pixeles, canal, rango: rangos[canal] };
}

/** Como mucho unos 20 000 píxeles: de sobra para la paleta y rápido. */
const MUESTRA = 20_000;

export function paleta(datos: Uint8ClampedArray, cuantos: number): ColorDominante[] {
	const paso = Math.max(1, Math.floor(datos.length / 4 / MUESTRA));
	const pixeles: Pixel[] = [];
	for (let i = 0; i < datos.length; i += 4 * paso) {
		if (visible(datos, i)) pixeles.push([datos[i], datos[i + 1], datos[i + 2]]);
	}
	if (!pixeles.length) return [];

	const cajas = [caja(pixeles)];
	while (cajas.length < cuantos) {
		// Se parte la que más pesa por lo variada que es: así las zonas grandes
		// y revueltas se reparten antes que un detalle pequeño.
		let elegida = -1;
		let mejor = 0;
		cajas.forEach((c, i) => {
			const puntos = c.rango * c.pixeles.length;
			if (c.pixeles.length > 1 && c.rango > 0 && puntos > mejor) {
				mejor = puntos;
				elegida = i;
			}
		});
		if (elegida < 0) break;
		const { pixeles: dentro, canal } = cajas[elegida];
		dentro.sort((a, b) => a[canal] - b[canal]);
		const mitad = Math.floor(dentro.length / 2);
		cajas.splice(elegida, 1, caja(dentro.slice(0, mitad)), caja(dentro.slice(mitad)));
	}

	return cajas
		.map((c) => {
			const suma = [0, 0, 0];
			for (const p of c.pixeles) for (let k = 0; k < 3; k++) suma[k] += p[k];
			const n = c.pixeles.length;
			return { hex: hexDe(suma[0] / n, suma[1] / n, suma[2] / n), peso: n / pixeles.length };
		})
		.sort((a, b) => b.peso - a.peso);
}

/** Negro o blanco, el que se lea mejor encima. */
export function tinta(hex: string) {
	const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
	return luma(r, g, b) > 140 ? '#000000' : '#ffffff';
}

/** El contorno de un canal para un SVG de 256 × alto, en escala lineal o raíz. */
export function trazo(cubos: number[], alto: number, raiz: boolean) {
	const escala = (n: number) => (raiz ? Math.sqrt(n) : n);
	const tope = Math.max(1, ...cubos.map(escala));
	const puntos = cubos.map((n, x) => `L${x} ${(alto - (escala(n) / tope) * alto).toFixed(1)}`);
	return `M0 ${alto} ${puntos.join(' ')} L255 ${alto} Z`;
}

export function cssDe(colores: ColorDominante[]) {
	const lineas = colores.map((c, i) => `  --imagen-${i + 1}: ${c.hex}; /* ${Math.round(c.peso * 100)}% */`);
	return `/* Paleta de la imagen · tuweb.dev */\n:root {\n${lineas.join('\n')}\n}\n`;
}
