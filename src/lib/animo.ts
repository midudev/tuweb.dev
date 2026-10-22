/**
 * El generador de estados de ánimo. Cada ánimo lleva su frase y, para cada
 * hueco —una herramienta, un canal y un juego—, las secciones que le van. Las
 * rutas salen de src/lib/sections.ts: si una sección cambia de apartado o
 * desaparece, checkMoods() lo dice al construir la página.
 */
import { SECTIONS, type GroupId } from './sections';

export type SlotId = 'herramienta' | 'canal' | 'juego';

export interface Slot {
	id: SlotId;
	label: string;
	group: GroupId;
}

/** Los tres huecos de cada recomendación, con el apartado del que sale cada uno. */
export const SLOTS: Slot[] = [
	{ id: 'herramienta', label: 'Una herramienta', group: 'herramientas' },
	{ id: 'canal', label: 'Un canal', group: 'canales' },
	{ id: 'juego', label: 'Un juego', group: 'juegos' },
];

export interface Mood {
	id: string;
	label: string;
	icon: string;
	/** Lo que se dice al elegirlo. */
	line: string;
	picks: Record<SlotId, string[]>;
}

export const MOODS: Mood[] = [
	{
		id: 'contento',
		label: 'Contento',
		icon: 'mood-happy',
		line: 'Con ganas de todo. Aprovecha y haz algo que se vea.',
		picks: {
			herramienta: ['/animaciones', '/paletas', '/memes', '/comics'],
			canal: ['/chat', '/taller', '/lienzo'],
			juego: ['/arcade', '/perritos', '/minijuego'],
		},
	},
	{
		id: 'triste',
		label: 'Triste',
		icon: 'mood-sad',
		line: 'Hoy cuesta. Algo tranquilo, sin prisa y sin reloj.',
		picks: {
			herramienta: ['/mural', '/nube', '/memes'],
			canal: ['/anonimo', '/lienzo', '/ascii'],
			juego: ['/minijuego', '/pixeles-ascii', '/perritos'],
		},
	},
	{
		id: 'cabreado',
		label: 'Cabreado',
		icon: 'mood-angry',
		line: 'Algo no compila. Suelta vapor y vuelve con la cabeza fría.',
		picks: {
			herramienta: ['/comparador', '/tareas', '/consejos'],
			canal: ['/anonimo', '/chat'],
			juego: ['/escape', '/arcade', '/minijuego'],
		},
	},
	{
		id: 'perdido',
		label: 'Perdido',
		icon: 'mood-confused',
		line: 'No sabes ni por dónde empezar. Empieza por aquí.',
		picks: {
			herramienta: ['/guia-ia', '/prompts', '/consejos', '/herramientas'],
			canal: ['/chat', '/retos'],
			juego: ['/python', '/terminal'],
		},
	},
	{
		id: 'friki',
		label: 'Friki',
		icon: 'mood-nerd',
		line: 'Con hambre de código. Hoy se escribe y se afina.',
		picks: {
			herramienta: ['/playground', '/herramientas', '/comparador'],
			canal: ['/retos', '/perfil'],
			juego: ['/golf', '/reto-diario', '/terminal'],
		},
	},
	{
		id: 'creativo',
		label: 'Creativo',
		icon: 'mood-crazy-happy',
		line: 'La cabeza llena de cosas. Sácalas antes de que se vayan.',
		picks: {
			herramienta: ['/logos', '/comics', '/animaciones', '/paletas', '/mural'],
			canal: ['/taller', '/ascii', '/lienzo'],
			juego: ['/pixeles-ascii', '/arcade'],
		},
	},
	{
		id: 'cansado',
		label: 'Cansado',
		icon: 'mood-empty',
		line: 'Sin pilas. Poca cosa, que se haga sola.',
		picks: {
			herramienta: ['/nube', '/tareas', '/consejos'],
			canal: ['/lienzo', '/anonimo'],
			juego: ['/minijuego', '/arcade'],
		},
	},
	{
		id: 'competitivo',
		label: 'Competitivo',
		icon: 'flame',
		line: 'A por todas. Que haya marca, ranking y alguien a quien ganar.',
		picks: {
			herramienta: ['/tareas', '/playground'],
			canal: ['/retos', '/perfil'],
			juego: ['/reto-diario', '/golf', '/acertijos', '/arcade'],
		},
	},
	{
		id: 'sociable',
		label: 'Sociable',
		icon: 'mood-wink',
		line: 'Con ganas de gente. Algo que se haga entre varios.',
		picks: {
			herramienta: ['/venn', '/lineas', '/memes'],
			canal: ['/chat', '/taller', '/ascii'],
			juego: ['/acertijos', '/pixeles-ascii'],
		},
	},
];

export function getMood(id: string) {
	return MOODS.find((mood) => mood.id === id) ?? null;
}

/** Uno al azar de la lista, distinto del que había si se puede. */
export function pickOne<T>(items: T[], current?: T) {
	const pool = items.length > 1 ? items.filter((item) => item !== current) : items;
	return pool[Math.floor(Math.random() * pool.length)];
}

/** Comprueba que cada ruta existe y vive en el apartado de su hueco. */
export function checkMoods() {
	for (const mood of MOODS) {
		for (const slot of SLOTS) {
			for (const href of mood.picks[slot.id]) {
				const section = SECTIONS.find((item) => item.href === href);
				if (!section || section.group !== slot.group) {
					throw new Error(`Ánimo ${mood.id}: ${href} no es de ${slot.group}`);
				}
			}
		}
	}
}
