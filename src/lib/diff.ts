/*
 * El comparador de textos. Aquí está la cuenta y nada más: se trocea cada texto
 * —por líneas, por palabras o por caracteres— y sale la lista de trozos con lo
 * que se queda, lo que se quita y lo que se pone. El algoritmo es el de Myers,
 * el mismo que hay detrás de un `git diff`: recorre las diagonales y se queda
 * con el camino más corto. Antes se recortan el principio y el final comunes,
 * que es lo que hace que dos textos casi iguales salgan al momento.
 */

export type Unidad = 'lineas' | 'palabras' | 'caracteres';
export type Tipo = 'igual' | 'quita' | 'pon';

export const UNIDADES: readonly { id: Unidad; label: string; icon: string }[] = [
	{ id: 'lineas', label: 'Por líneas', icon: 'align-left' },
	{ id: 'palabras', label: 'Por palabras', icon: 'abc' },
	{ id: 'caracteres', label: 'Por caracteres', icon: 'letter-case' },
];

export interface Opciones {
	/** Que «Hola» y «hola» cuenten como lo mismo. */
	mayusculas: boolean;
	/** Que sobre o falte un espacio no cuente como diferencia. */
	espacios: boolean;
	/** Las líneas en blanco ni se miran. Solo pinta cuando se compara por líneas. */
	vacias: boolean;
}

export const OPCIONES: readonly { id: keyof Opciones; label: string }[] = [
	{ id: 'mayusculas', label: 'Ignorar mayúsculas' },
	{ id: 'espacios', label: 'Ignorar espacios' },
	{ id: 'vacias', label: 'Ignorar líneas en blanco' },
];

export interface Pieza {
	/** El texto tal cual, que es lo que se pinta. */
	texto: string;
	/** Con lo que se compara: el mismo texto con las opciones ya aplicadas. */
	clave: string;
	/** La línea de la que salió, desde 1. Cero cuando no viene al caso. */
	num: number;
}

export interface Trozo {
	tipo: Tipo;
	texto: string;
	/** La línea en el texto de la izquierda, o 0 si el trozo no está ahí. */
	a: number;
	/** La línea en el texto de la derecha, o 0 si el trozo no está ahí. */
	b: number;
}

/**
 * El tope de diferencias que se persigue: Myers tarda lo distintos que son los
 * textos. Pasado el tope se responde a lo bruto: fuera lo viejo, dentro lo nuevo.
 */
const TOPE = 1200;

/** El texto con el que se compara de verdad, ya con las opciones puestas. */
function clave(texto: string, opciones: Opciones) {
	let salida = texto;
	if (opciones.espacios) salida = salida.replace(/\s+/g, ' ').trim();
	if (opciones.mayusculas) salida = salida.toLowerCase();
	return salida;
}

/** De un texto a la lista de piezas que se comparan. */
export function trocear(texto: string, unidad: Unidad, opciones: Opciones): Pieza[] {
	if (texto === '') return [];

	if (unidad === 'lineas') {
		const piezas = texto
			.split(/\r\n|\r|\n/)
			.map((linea, i) => ({ texto: linea, clave: clave(linea, opciones), num: i + 1 }));
		// El último salto de línea del campo no es una línea más.
		if (piezas.length > 1 && piezas[piezas.length - 1].texto === '') piezas.pop();
		return opciones.vacias ? piezas.filter((pieza) => pieza.texto.trim() !== '') : piezas;
	}

	// Por palabras los espacios también son piezas: así el texto se vuelve a
	// armar tal cual estaba, con sus saltos y su sangría.
	const partes = unidad === 'palabras' ? (texto.match(/\s+|\S+/g) ?? []) : [...texto];
	return partes.map((parte) => ({ texto: parte, clave: clave(parte, opciones), num: 0 }));
}

function igual(a: Pieza, b: Pieza): Trozo {
	return { tipo: 'igual', texto: a.texto, a: a.num, b: b.num };
}

function quita(a: Pieza): Trozo {
	return { tipo: 'quita', texto: a.texto, a: a.num, b: 0 };
}

function pon(b: Pieza): Trozo {
	return { tipo: 'pon', texto: b.texto, a: 0, b: b.num };
}

/** El camino más corto entre las dos listas: el orden es el del texto. */
export function comparar(a: Pieza[], b: Pieza[]): Trozo[] {
	// Lo que empieza y acaba igual sale sin pensarlo: solo se persigue el medio.
	let inicio = 0;
	while (inicio < a.length && inicio < b.length && a[inicio].clave === b[inicio].clave) inicio++;

	let fin = 0;
	while (
		fin < a.length - inicio &&
		fin < b.length - inicio &&
		a[a.length - 1 - fin].clave === b[b.length - 1 - fin].clave
	) {
		fin++;
	}

	const medioA = a.slice(inicio, a.length - fin);
	const medioB = b.slice(inicio, b.length - fin);

	return [
		...a.slice(0, inicio).map((pieza, i) => igual(pieza, b[i])),
		...medio(medioA, medioB),
		...a.slice(a.length - fin).map((pieza, i) => igual(pieza, b[b.length - fin + i])),
	];
}

function medio(a: Pieza[], b: Pieza[]): Trozo[] {
	if (a.length === 0) return b.map(pon);
	if (b.length === 0) return a.map(quita);
	return myers(a, b) ?? [...a.map(quita), ...b.map(pon)];
}

/**
 * Myers a pelo: en cada paso `d` se mira hasta dónde llega cada diagonal `k` y
 * se guarda la foto para volver luego sobre los pasos. Todas las diagonales van
 * en un array: los pasos pares y los impares nunca escriben en la misma casilla.
 */
function myers(a: Pieza[], b: Pieza[]): Trozo[] | null {
	const n = a.length;
	const m = b.length;
	const max = n + m;
	const v = new Int32Array(2 * max + 1);
	const traza: Int32Array[] = [];

	for (let d = 0; d <= max && d <= TOPE; d++) {
		// De cada paso solo se guardan las diagonales que existen: la foto entera
		// para textos grandes no cabe en ningún sitio.
		traza.push(v.slice(max - d, max + d + 1));

		for (let k = -d; k <= d; k += 2) {
			// O se baja desde la diagonal de arriba —eso es poner— o se avanza
			// desde la de al lado —eso es quitar—. Se coge la que llega más lejos.
			let x =
				k === -d || (k !== d && v[max + k - 1] < v[max + k + 1])
					? v[max + k + 1]
					: v[max + k - 1] + 1;
			let y = x - k;

			// Y desde ahí, todo lo que va igual es de balde.
			while (x < n && y < m && a[x].clave === b[y].clave) {
				x++;
				y++;
			}

			v[max + k] = x;
			if (x >= n && y >= m) return rehacer(traza, a, b);
		}
	}

	return null;
}

/** Del rastro de Myers a la lista de trozos, andando el camino del revés. */
function rehacer(traza: Int32Array[], a: Pieza[], b: Pieza[]): Trozo[] {
	const trozos: Trozo[] = [];
	let x = a.length;
	let y = b.length;

	for (let d = traza.length - 1; d >= 0; d--) {
		const v = traza[d];
		const k = x - y;
		let desdeX = 0;
		let desdeY = 0;

		if (d > 0) {
			// La misma decisión que en la ida, pero mirando de dónde se vino.
			const anterior = k === -d || (k !== d && v[k - 1 + d] < v[k + 1 + d]) ? k + 1 : k - 1;
			desdeX = v[anterior + d];
			desdeY = desdeX - anterior;
		}

		while (x > desdeX && y > desdeY) {
			x--;
			y--;
			trozos.push(igual(a[x], b[y]));
		}

		if (d > 0) {
			if (x === desdeX) trozos.push(pon(b[--y]));
			else trozos.push(quita(a[--x]));
		}
	}

	return trozos.reverse();
}

export interface Cuenta {
	iguales: number;
	quitadas: number;
	puestas: number;
	/** Cuánto se parecen los dos textos, de 0 a 100. */
	parecido: number;
}

export function contar(trozos: Trozo[]): Cuenta {
	let iguales = 0;
	let quitadas = 0;
	let puestas = 0;
	for (const trozo of trozos) {
		if (trozo.tipo === 'igual') iguales++;
		else if (trozo.tipo === 'quita') quitadas++;
		else puestas++;
	}
	const total = iguales * 2 + quitadas + puestas;
	const parecido = total === 0 ? 100 : Math.round((iguales * 200) / total);
	return { iguales, quitadas, puestas, parecido };
}

export interface Fila {
	/** La pieza de la izquierda: la que se queda o la que se quita. */
	izq: Trozo | null;
	/** La de la derecha: la que se queda o la que se pone. */
	der: Trozo | null;
	/** Si las dos son la misma línea cambiada, para marcar solo lo que cambió. */
	pareja: boolean;
}

/**
 * De la lista de trozos a filas de dos columnas. Lo quitado y lo puesto que van
 * seguidos se emparejan línea a línea: así, al cambiar una palabra, las dos
 * versiones salen enfrentadas y no una debajo de la otra.
 */
export function filas(trozos: Trozo[]): Fila[] {
	const salida: Fila[] = [];
	let i = 0;

	while (i < trozos.length) {
		if (trozos[i].tipo === 'igual') {
			salida.push({ izq: trozos[i], der: trozos[i], pareja: false });
			i++;
			continue;
		}

		const quitadas: Trozo[] = [];
		const puestas: Trozo[] = [];
		while (i < trozos.length && trozos[i].tipo === 'quita') quitadas.push(trozos[i++]);
		while (i < trozos.length && trozos[i].tipo === 'pon') puestas.push(trozos[i++]);

		const largo = Math.max(quitadas.length, puestas.length);
		for (let j = 0; j < largo; j++) {
			const izq = quitadas[j] ?? null;
			const der = puestas[j] ?? null;
			salida.push({ izq, der, pareja: Boolean(izq && der) });
		}
	}

	return salida;
}

/**
 * Lo que cambió dentro de una línea, palabra a palabra. Si las dos versiones no
 * se parecen lo bastante, nada: la línea entera se lee mejor que un confeti.
 */
export function dentro(izq: string, der: string, opciones: Opciones): Trozo[] | null {
	const trozos = comparar(trocear(izq, 'palabras', opciones), trocear(der, 'palabras', opciones));
	return contar(trozos).parecido >= 40 ? trozos : null;
}

/** El resultado en texto plano, para llevárselo. */
export function comoTexto(trozos: Trozo[], unidad: Unidad): string {
	// Por líneas, el diff de toda la vida; por dentro de la línea, marcas.
	if (unidad === 'lineas') {
		const signo = { igual: '  ', quita: '- ', pon: '+ ' };
		return trozos.map((trozo) => `${signo[trozo.tipo]}${trozo.texto}`).join('\n');
	}

	const marca = { igual: ['', ''], quita: ['[-', '-]'], pon: ['{+', '+}'] };
	return trozos
		.map((trozo) => `${marca[trozo.tipo][0]}${trozo.texto}${marca[trozo.tipo][1]}`)
		.join('');
}
