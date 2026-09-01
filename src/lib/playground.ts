/*
 * El playground: tres editores —HTML, CSS y JavaScript— y una vista previa que
 * se repinta según escribes. Aquí dentro está lo que no es interfaz: qué trae
 * cada plantilla, cómo se arma el documento que va a la vista previa y cómo se
 * guarda lo escrito.
 *
 * No hay servidor: lo que se teclea vive en el navegador de quien lo teclea, y
 * lo que se ejecuta va dentro de un iframe en modo sandbox, sin acceso a esta
 * página ni a lo que hay guardado en ella.
 */

export interface Sources {
	html: string;
	css: string;
	js: string;
}

/** Los tres editores, en el orden en que salen en pantalla. */
export const EDITORS = [
	{ id: 'html', label: 'HTML', icon: 'brand-html5', hint: 'El marcado que va dentro del body' },
	{ id: 'css', label: 'CSS', icon: 'brand-css3', hint: 'Los estilos de la vista previa' },
	{ id: 'js', label: 'JavaScript', icon: 'brand-javascript', hint: 'Se ejecuta al repintar' },
] as const;

/** Un editor es para probar, no para pegar medio proyecto. */
export const MAX_LENGTH = 20000;

const KEY = 'tuweb:playground';

const COUNTER: Sources = {
	html: `<main>
	<h1>Hola, tuweb.dev</h1>
	<p>Cambia el HTML, el CSS o el JS y esto se repinta solo.</p>
	<button id="boton" type="button">Llevo 0 clics</button>
</main>`,
	css: `body {
	display: grid;
	place-items: center;
	min-height: 100vh;
	margin: 0;
	background: #fdf6ef;
	color: #3b2d24;
	font-family: ui-monospace, monospace;
	text-align: center;
}

h1 {
	color: #c2410c;
	font-size: 1.5rem;
}

button {
	padding: 0.75rem 1rem;
	border: 1px solid #e8d9c8;
	background: #f7ece1;
	color: inherit;
	font: inherit;
	cursor: pointer;
}

button:hover {
	border-color: #c2410c;
	color: #c2410c;
}`,
	js: `const boton = document.querySelector('#boton');
let clics = 0;

boton.addEventListener('click', () => {
	clics += 1;
	boton.textContent = 'Llevo ' + clics + (clics === 1 ? ' clic' : ' clics');
	console.log('clic número', clics);
});`,
};

const CLOCK: Sources = {
	html: `<p id="hora">--:--:--</p>`,
	css: `body {
	display: grid;
	place-items: center;
	min-height: 100vh;
	margin: 0;
	background: #fdf6ef;
	color: #c2410c;
	font-family: ui-monospace, monospace;
}

#hora {
	font-size: 3rem;
	letter-spacing: 0.1em;
}`,
	js: `const hora = document.querySelector('#hora');

function pintar() {
	hora.textContent = new Date().toLocaleTimeString('es-ES');
}

pintar();
setInterval(pintar, 1000);`,
};

const EMPTY: Sources = { html: '', css: '', js: '' };

/** Por dónde empezar. La primera es también lo que sale la primera vez. */
export const TEMPLATES = [
	{ id: 'contador', label: 'Contador', icon: 'click', sources: COUNTER },
	{ id: 'reloj', label: 'Reloj', icon: 'clock', sources: CLOCK },
	{ id: 'vacio', label: 'En blanco', icon: 'eraser', sources: EMPTY },
] as const;

export const DEFAULT_SOURCES = COUNTER;

/**
 * El puente de la vista previa: lo que hace que los console.log y los errores
 * de dentro del iframe salgan en la consola de fuera. Va en el documento de la
 * vista previa y no en el que se copia, que ese es del que escribe.
 *
 * El iframe no lleva allow-same-origin, así que su origen es opaco y el destino
 * del postMessage tiene que ser '*'. No sale nada de la máquina: es una pestaña
 * hablando consigo misma, y quien escucha comprueba de qué marco viene.
 */
export const BRIDGE = `(function () {
	var enviar = function (tipo, texto) {
		try {
			parent.postMessage({ tuweb: 'playground', tipo: tipo, texto: String(texto).slice(0, 600) }, '*');
		} catch (error) {}
	};

	var pintar = function (valor) {
		if (typeof valor === 'string') return valor;
		if (typeof valor === 'undefined') return 'undefined';
		if (typeof valor === 'function') return 'ƒ ' + (valor.name || 'anónima');
		if (valor instanceof Error) return valor.name + ': ' + valor.message;
		if (valor instanceof Element) return '<' + valor.tagName.toLowerCase() + '>';
		try {
			var texto = JSON.stringify(valor);
			return typeof texto === 'string' ? texto : String(valor);
		} catch (error) {
			return String(valor);
		}
	};

	['log', 'info', 'warn', 'error'].forEach(function (nombre) {
		var antes = console[nombre];
		console[nombre] = function () {
			enviar(nombre === 'info' ? 'log' : nombre, Array.prototype.map.call(arguments, pintar).join(' '));
			antes.apply(console, arguments);
		};
	});

	addEventListener('error', function (evento) {
		enviar('error', evento.message + (evento.lineno ? ' (línea ' + evento.lineno + ')' : ''));
	});

	addEventListener('unhandledrejection', function (evento) {
		enviar('error', 'Promesa sin capturar: ' + pintar(evento.reason));
	});
})();`;

/**
 * Un cierre de script dentro del JS —o de style dentro del CSS— cerraría la
 * etiqueta antes de tiempo y partiría el documento en dos. Con la barra
 * escapada el navegador ya no ve el cierre y el código sigue diciendo lo mismo:
 * dentro de una cadena o de una regex, «<\/script>» es lo mismo de siempre.
 */
function escapeClose(code: string) {
	return code.replace(/<\/(script|style)/gi, '<\\/$1');
}

/*
 * El cierre va partido a propósito: este fichero acaba dentro de un script del
 * navegador, y un cierre literal ahí cortaría el script de la página.
 */
const CLOSE = `<${'/script>'}`;

/**
 * El documento entero a partir de los tres editores. Sin puente sale lo que uno
 * se llevaría a un fichero suelto; con él, lo que va a la vista previa.
 */
export function buildDocument(sources: Sources, bridge = '') {
	const head = bridge ? `\n\t\t<script>${bridge}${CLOSE}` : '';

	return `<!doctype html>
<html lang="es">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Playground</title>${head}
		<style>
${escapeClose(sources.css)}
		</style>
	</head>
	<body>
${sources.html}
		<script>
${escapeClose(sources.js)}
		${CLOSE}
	</body>
</html>`;
}

function field(value: unknown) {
	return typeof value === 'string' ? value.slice(0, MAX_LENGTH) : '';
}

export function readSources(): Sources {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return DEFAULT_SOURCES;

		const parsed = JSON.parse(saved) as unknown;
		if (!parsed || typeof parsed !== 'object') return DEFAULT_SOURCES;

		const draft = parsed as Partial<Record<keyof Sources, unknown>>;
		return { html: field(draft.html), css: field(draft.css), js: field(draft.js) };
	} catch {
		// Sin almacenamiento, o con basura dentro: se empieza por la plantilla.
		return DEFAULT_SOURCES;
	}
}

export function saveSources(sources: Sources) {
	try {
		localStorage.setItem(KEY, JSON.stringify(sources));
	} catch {
		// Si no deja guardar, lo escrito dura lo que dure la pestaña.
	}
}
