/**
 * Ajustes de accesibilidad: contraste alto, letra más grande y una tipografía
 * pensada para dislexia. Se pintan como atributos en el <html> —la hoja de
 * estilos hace el resto— y se guardan en el localStorage de quien los elige.
 * Vienen apagados de serie y no salen de este navegador.
 */

export const TAMANOS = [100, 112, 125, 150] as const;
export type Tamano = (typeof TAMANOS)[number];

export type Accesibilidad = { contraste: boolean; tamano: Tamano; dislexia: boolean };

export const ACCESIBILIDAD_INICIAL: Accesibilidad = { contraste: false, tamano: 100, dislexia: false };

const KEY = 'tuweb:accesibilidad';

/** Lo guardado, revisado campo a campo: lo que no cuadre, va el de serie. */
export function limpiarAccesibilidad(g: unknown): Accesibilidad {
	const o = (g && typeof g === 'object' ? g : {}) as Record<string, unknown>;
	return {
		contraste: o.contraste === true,
		tamano: TAMANOS.find((t) => t === o.tamano) ?? ACCESIBILIDAD_INICIAL.tamano,
		dislexia: o.dislexia === true,
	};
}

export function readAccesibilidad(): Accesibilidad {
	try {
		return limpiarAccesibilidad(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
	} catch {
		// Sin localStorage, o con basura dentro: lo de serie.
		return { ...ACCESIBILIDAD_INICIAL };
	}
}

/** Lo que es igual a lo de serie no se guarda: así el localStorage queda limpio. */
export function saveAccesibilidad(a: Accesibilidad) {
	try {
		const inicial = ACCESIBILIDAD_INICIAL;
		if (a.contraste === inicial.contraste && a.tamano === inicial.tamano && a.dislexia === inicial.dislexia) {
			localStorage.removeItem(KEY);
		} else {
			localStorage.setItem(KEY, JSON.stringify(a));
		}
	} catch {
		// Si no deja guardar, el ajuste dura la visita.
	}
}

/** Lo pinta en el <html> y avisa, para que todos los paneles de la página se enteren. */
export function applyAccesibilidad(a: Accesibilidad) {
	const root = document.documentElement;
	if (a.contraste) root.dataset.contraste = 'alto';
	else delete root.dataset.contraste;
	if (a.tamano !== 100) root.dataset.letra = String(a.tamano);
	else delete root.dataset.letra;
	if (a.dislexia) root.dataset.dislexia = 'si';
	else delete root.dataset.dislexia;
	document.dispatchEvent(new CustomEvent('tuweb:accesibilidad', { detail: a }));
}
