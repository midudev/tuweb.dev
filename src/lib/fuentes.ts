/**
 * Fuentes de las herramientas de tipografía. Solo de casa o del sistema: si una
 * no está instalada, el navegador tira de la siguiente de la pila.
 */
export type Fuente = { id: string; nombre: string; pila: string };

export const FUENTES: Fuente[] = [
	{ id: 'geist-mono', nombre: 'Geist Mono (de casa)', pila: "'Geist Mono Variable', ui-monospace, monospace" },
	{ id: 'geist-pixel', nombre: 'Geist Pixel (de casa)', pila: "'Geist Pixel', ui-monospace, monospace" },
	{ id: 'sistema', nombre: 'Sans del sistema', pila: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
	{ id: 'helvetica', nombre: 'Helvetica / Arial', pila: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
	{ id: 'humanista', nombre: 'Humanista', pila: "'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif" },
	{ id: 'industrial', nombre: 'Industrial', pila: "Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium', 'Arial Narrow', sans-serif" },
	{ id: 'redondeada', nombre: 'Redondeada', pila: "ui-rounded, 'SF Pro Rounded', 'Arial Rounded MT Bold', sans-serif" },
	{ id: 'georgia', nombre: 'Georgia', pila: "Georgia, 'Times New Roman', serif" },
	{ id: 'transicional', nombre: 'Serif transicional', pila: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif" },
	{ id: 'antigua', nombre: 'Serif antigua', pila: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'URW Palladio L', serif" },
	{ id: 'didone', nombre: 'Didone', pila: "Didot, 'Bodoni MT', 'Noto Serif Display', serif" },
	{ id: 'mono-sistema', nombre: 'Mono del sistema', pila: "ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace" },
	{ id: 'manuscrita', nombre: 'Manuscrita', pila: "'Segoe Print', 'Bradley Hand', Chilanka, cursive" },
];
