/*
 * De HTML a PHP. Aquí no se interpreta nada: entra el marcado de una página y
 * sale un fichero .php que, servido por PHP, escupe exactamente el mismo HTML.
 * Tres formas de hacerlo, que son las tres que se ven por ahí:
 *
 * - plantilla: el HTML tal cual dentro del .php, con el título en una variable.
 * - echo:      una línea, un echo, con las comillas y los dólares escapados.
 * - heredoc:   un nowdoc de una pieza, sin escapar nada.
 *
 * Todo son cadenas de texto: esto corre en el navegador y no ejecuta ni pide
 * nada. La web sigue siendo Astro; esto solo te da el PHP para llevártelo.
 */

export type Modo = 'plantilla' | 'echo' | 'heredoc';

export interface Salida {
	codigo: string;
	/** Lo que conviene mirar a mano antes de subir el fichero. Vacío si nada. */
	aviso: string;
}

export const MODOS: readonly { id: Modo; label: string; icon: string; nota: string }[] = [
	{
		id: 'plantilla',
		label: 'Plantilla',
		icon: 'file-code',
		nota: 'El HTML se queda tal cual y el título sale a una variable. Es lo que hace todo el mundo.',
	},
	{
		id: 'echo',
		label: 'echo por línea',
		icon: 'terminal-2',
		nota: 'Una línea, un echo. Se lee peor, pero deja meter PHP en cualquier punto.',
	},
	{
		id: 'heredoc',
		label: 'Heredoc',
		icon: 'blockquote',
		nota: 'Un nowdoc de una pieza: no hay que escapar nada y las comillas quedan intactas.',
	},
];

const CABECERA = `<?php
declare(strict_types=1);

// Salido de tuweb.dev/herramientas#php`;

const TIPO = "header('Content-Type: text/html; charset=utf-8');";

/** Sin retornos de carro: si no, cada línea acaba con un byte de más. */
function limpiar(html: string) {
	return html.replace(/\r\n?/g, '\n');
}

/** Para una cadena entre comillas dobles: la barra, la comilla y el dólar. */
function escaparDobles(linea: string) {
	return linea.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
}

/** Para una cadena entre comillas simples: solo la barra y la comilla. */
function escaparSimples(texto: string) {
	return texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Una etiqueta de heredoc que no aparezca ya al principio de ninguna línea del
 * documento; si HTML está pillado, se prueba HTML2, HTML3 y así.
 */
function etiquetaLibre(html: string) {
	const lineas = html.split('\n');
	for (let intento = 1; intento < 100; intento += 1) {
		const etiqueta = intento === 1 ? 'HTML' : `HTML${intento}`;
		if (!lineas.some((linea) => linea.trimStart().startsWith(etiqueta))) return etiqueta;
	}
	return 'HTML_TUWEB';
}

/**
 * El texto del primer <title> del documento, si lo hay. En una sola línea: va a
 * parar a una cadena entre comillas simples y un salto la partiría en dos.
 */
function titulo(html: string) {
	const texto = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '';
	return texto.replace(/\s+/g, ' ').trim();
}

/**
 * Lo que hay que revisar a ojo. En plantilla, PHP se come cualquier `<?` que ya
 * viniera en el marcado; dentro de un echo o de un nowdoc no pasa. Se avisa y
 * ya: el HTML de nadie se toca.
 */
function avisar(html: string, modo: Modo) {
	if (modo === 'plantilla' && /<\?/.test(html)) {
		return 'El HTML ya trae un «<?»: en modo plantilla PHP se lo comerá. Usa heredoc para esa parte.';
	}
	if (!html.includes('<')) return 'Eso no parece HTML, pero el PHP sale igual.';
	return '';
}

function comoPlantilla(html: string) {
	const texto = titulo(html);
	const cuerpo = texto
		? html.replace(/(<title[^>]*>)([\s\S]*?)(<\/title>)/i, '$1<?= h($titulo) ?>$3')
		: html;

	// Sin <title> no hay nada que sacar a variable, así que tampoco hace falta
	// la función que lo escapa: el preludio se queda en la cabecera y el tipo.
	const variable = texto
		? [
				'',
				`$titulo = '${escaparSimples(texto)}';`,
				'',
				'function h(string $texto): string {',
				"\treturn htmlspecialchars($texto, ENT_QUOTES, 'UTF-8');",
				'}',
			]
		: [];

	return `${[CABECERA, ...variable, '', TIPO, '?>'].join('\n')}\n${cuerpo}`;
}

function comoEcho(html: string) {
	const lineas = html.split('\n');
	// La última línea sin salto: si el HTML no acaba en \n, el PHP tampoco.
	const echos = lineas
		.map((linea, indice) => {
			const salto = indice === lineas.length - 1 ? '' : '\\n';
			return `echo "${escaparDobles(linea)}${salto}";`;
		})
		.join('\n');

	return `${CABECERA}\n\n${TIPO}\n\n${echos}\n`;
}

function comoHeredoc(html: string) {
	const etiqueta = etiquetaLibre(html);
	// El nowdoc no interpola: dentro va el HTML letra por letra, sin escapes.
	return `${CABECERA}\n\n${TIPO}\n\necho <<<'${etiqueta}'\n${html}\n${etiqueta};\n`;
}

export function toPhp(html: string, modo: Modo): Salida {
	const limpio = limpiar(html).replace(/\n+$/, '');
	if (!limpio.trim()) return { codigo: '', aviso: '' };

	const codigo =
		modo === 'echo' ? comoEcho(limpio) : modo === 'heredoc' ? comoHeredoc(limpio) : comoPlantilla(limpio);

	return { codigo, aviso: avisar(limpio, modo) };
}

/** «3 líneas · 118 caracteres», para el pie de cada campo. */
export function medir(texto: string) {
	if (!texto) return '';
	const lineas = texto.split('\n').length;
	const letras = texto.length;
	return `${lineas} ${lineas === 1 ? 'línea' : 'líneas'} · ${letras} ${letras === 1 ? 'carácter' : 'caracteres'}`;
}

/** El HTML de ejemplo con el que arranca el panel. */
export const EJEMPLO = `<!doctype html>
<html lang="es">
	<head>
		<meta charset="utf-8" />
		<title>tuweb.dev</title>
	</head>
	<body>
		<h1>Una web que cambia con lo que pide la gente</h1>
		<p>Propón una idea: la que más gusta se implementa.</p>
	</body>
</html>`;
