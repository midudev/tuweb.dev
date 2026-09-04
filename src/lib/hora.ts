/**
 * Las horas de la web, en la zona horaria de quien las mira.
 *
 * Las fechas se guardan en UTC y el servidor las escribía con su reloj, así que
 * quien entraba desde otro huso veía horas que no eran las suyas. Este es el
 * único sitio donde se les da formato: el servidor pinta las de su zona para
 * que se vea algo sin JavaScript, y el navegador las reescribe con las del
 * dispositivo en cuanto carga.
 */

export type FormatoHora =
	/** 14:32 */
	| 'hhmm'
	/** Miércoles, 3 de septiembre de 2026 */
	| 'dia-largo'
	/** 3 sept 2026 */
	| 'dia-corto'
	/** 3 de septiembre, 14:32 */
	| 'dia-mes-hora'
	/** 3 de septiembre de 2026, 14:32 */
	| 'fecha-hora'
	/** Septiembre de 2026 */
	| 'mes';

const FORMATOS: Record<FormatoHora, Intl.DateTimeFormatOptions> = {
	hhmm: { hour: '2-digit', minute: '2-digit' },
	'dia-largo': { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
	'dia-corto': { day: 'numeric', month: 'short', year: 'numeric' },
	'dia-mes-hora': { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' },
	'fecha-hora': { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
	mes: { month: 'long', year: 'numeric' },
};

/** Los que empiezan por palabra y encabezan una línea van en mayúscula. */
const CAPITALES = new Set<FormatoHora>(['dia-largo', 'mes']);

/** Sin zona se usa la de quien ejecuta esto: el servidor o el dispositivo. */
export function formatearHora(iso: string, formato: FormatoHora, zona?: string) {
	const opciones = FORMATOS[formato];
	const fecha = new Date(iso);
	if (!opciones || Number.isNaN(fecha.getTime())) return '';

	const texto = new Intl.DateTimeFormat('es-ES', { ...opciones, timeZone: zona }).format(fecha);
	return CAPITALES.has(formato) ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

/** La zona del dispositivo, si el navegador la sabe decir. */
export function zonaDelDispositivo() {
	try {
		return new Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
	} catch {
		return '';
	}
}

/** El día entero y la zona, para lo que sale al pasar por encima. */
export function tituloHora(iso: string) {
	const texto = formatearHora(iso, 'fecha-hora');
	if (!texto) return '';

	const zona = zonaDelDispositivo();
	return zona ? `${texto} · ${zona}` : texto;
}

/**
 * Reescribe con la hora del dispositivo todo lo que lleve data-hora. Se puede
 * llamar las veces que haga falta: el texto sale del atributo datetime, no de
 * lo que hubiera escrito antes.
 */
export function localizarHoras(raiz: ParentNode = document) {
	for (const marca of raiz.querySelectorAll<HTMLElement>('time[data-hora]')) {
		const iso = marca.getAttribute('datetime') ?? '';
		const texto = formatearHora(iso, marca.dataset.hora as FormatoHora);
		if (!texto) continue;

		if (marca.textContent !== texto) marca.textContent = texto;
		marca.title = tituloHora(iso);
	}
}
