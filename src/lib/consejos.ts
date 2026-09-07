/*
 * Los consejos de desarrollo: los de la casa, que van escritos aquí abajo, y
 * los que escribe cada uno desde la propia sección.
 *
 * No hay servidor detrás. Lo que se guarda —el filtro, los favoritos y los
 * consejos propios— vive en el navegador de quien los escribe, como el
 * escaparate o la mascota. Para que un consejo lo lea todo el mundo hay que
 * copiarlo y proponerlo como idea, que es como se cambia esta web.
 */

export interface Tip {
	/** Categoría e índice: `git-2`. Los escritos aquí empiezan por `mio-`. */
	id: string;
	/** El consejo en una línea, que es lo que se lee primero. */
	title: string;
	/** Por qué, en una frase. */
	detail: string;
	/** El id de la categoría en la que vive. */
	category: string;
	/** Los escritos en este navegador: se marcan y se pueden quitar. */
	mine?: boolean;
}

interface RawCategory {
	id: string;
	label: string;
	/** Un icono de Tabler. */
	icon: string;
	tips: [string, string][];
}

const RAW: RawCategory[] = [
	{
		id: 'codigo',
		label: 'Código',
		icon: 'code',
		tips: [
			['Escribe el nombre entero', '«usuariosActivos» se entiende dentro de seis meses; «ua» no.'],
			['Comenta el porqué, no el qué', 'El qué ya lo cuenta el código; comenta la decisión rara.'],
			['Sal pronto de la función', 'Un return en cuanto sabes la respuesta ahorra tres sangrados.'],
			['Borra el código muerto', 'Comentado por si acaso no: para eso está el historial.'],
			['A la tercera se abstrae', 'Antes no sabes qué parte varía y sale una función con siete parámetros.'],
		],
	},
	{
		id: 'git',
		label: 'Git',
		icon: 'git-commit',
		tips: [
			['Un commit, un cambio', 'Si al describirlo tienes que usar un «y», eran dos commits.'],
			['El mensaje dice qué y por qué', '«arreglos» no cuenta nada, y dentro de un año lo lees tú.'],
			['Nada de force un viernes', 'Y si hace falta, --force-with-lease, que respeta lo de los demás.'],
			['Rama corta, rama que entra', 'Una rama de dos semanas es un conflicto esperando su turno.'],
			['Léete tu propio diff', 'git diff --staged pilla el console.log y la clave pegada sin querer.'],
		],
	},
	{
		id: 'bugs',
		label: 'Depuración',
		icon: 'bug',
		tips: [
			['Reprodúcelo antes de arreglarlo', 'Lo que no sabes provocar tampoco sabes si lo has arreglado.'],
			['Cambia una cosa cada vez', 'Si tocas tres y funciona, no sabes cuál de las tres era.'],
			['Duda de tu código primero', 'Casi siempre es tuyo: un tipo que no era, un await que falta.'],
			['Lee el error entero', 'La primera línea dice qué reventó; las de abajo, quién lo llamó.'],
			['Explícaselo a alguien en voz alta', 'La mitad de las veces das con el fallo a mitad de la frase.'],
		],
	},
	{
		id: 'pruebas',
		label: 'Pruebas',
		icon: 'test-pipe',
		tips: [
			['Cada bug se va con su test', 'Primero uno que falle por ese motivo, y luego el arreglo.'],
			['Prueba el comportamiento', 'Si se rompe al renombrar algo privado, estabas probando el cómo.'],
			['Los bordes son donde revienta', 'Cero, uno y muchos. La cadena vacía, el negativo, el nulo.'],
			['El test que falla a ratos, fuera', 'Enseña a ignorar el rojo, y un día el rojo va en serio.'],
			['El nombre del test cuenta el caso', '«devuelve 400 si falta el email» se lee en la salida; «test1» no.'],
		],
	},
	{
		id: 'rendimiento',
		label: 'Rendimiento',
		icon: 'gauge',
		tips: [
			['Mide antes de optimizar', 'La intuición sobre qué va lento acierta poco: saca el perfil.'],
			['La consulta dentro del bucle', 'Una por fila son mil viajes; pídelos de una vez y júntalos.'],
			['Lo más rápido es lo que no se envía', 'Quita la librería de 300 kB que usas para una fecha.'],
			['Un índice arregla más que un rediseño', 'Sin él la base se lee la tabla entera: mira el plan.'],
			['Cachear es asumir una deuda', 'Ponle plazo al ponerla, no cuando ya está sirviendo algo viejo.'],
		],
	},
	{
		id: 'equipo',
		label: 'Equipo',
		icon: 'users',
		tips: [
			['Pregunta a los treinta minutos', 'Atascarse es normal; atascarse callado tres días, no.'],
			['Revisa el código, no a quien escribe', '«peta si la lista viene vacía» se arregla; «está mal» no.'],
			['Manda la revisión pequeña', 'Cuatrocientas líneas se aprueban sin mirar; cincuenta se revisan.'],
			['Escribe la decisión donde se vea', 'Lo hablado en una llamada se olvida; en el repo, no.'],
			['Deja la puerta abierta al que venga', 'El README con cómo se levanta esto también es producto.'],
		],
	},
];

export interface Category {
	id: string;
	label: string;
	icon: string;
	tips: Tip[];
}

export const CATEGORIES: Category[] = RAW.map((category) => ({
	id: category.id,
	label: category.label,
	icon: category.icon,
	tips: category.tips.map(([title, detail], index) => ({
		id: `${category.id}-${index}`,
		title,
		detail,
		category: category.id,
	})),
}));

/** Los de la casa, todos seguidos. Los tuyos se juntan con estos al pintar. */
export const TIPS: Tip[] = CATEGORIES.flatMap((category) => category.tips);

/** El filtro de «todas las categorías» y el de «solo los guardados». */
export const ALL = 'todas';
export const SAVED = 'guardados';

export function getCategory(id: string) {
	return CATEGORIES.find((category) => category.id === id);
}

/** El rótulo de la categoría de un consejo, que es lo que lleva la tarjeta. */
export function labelOf(tip: Tip) {
	return getCategory(tip.category)?.label ?? 'Tuyo';
}

/**
 * El siguiente consejo: de lo que haya en la lista y nunca el que ya está
 * puesto. Cuando se acaban los que no se han visto se vuelve a empezar.
 */
export function pickTip(pool: Tip[], seen: string[], current?: string): Tip {
	const list = pool.length > 0 ? pool : TIPS;
	const fresh = list.filter((tip) => !seen.includes(tip.id));
	const options = (fresh.length > 0 ? fresh : list).filter((tip) => tip.id !== current);
	const final = options.length > 0 ? options : list;

	return final[Math.floor(Math.random() * final.length)];
}

/** Minúsculas y sin acentos: buscar «depuracion» encuentra «depuración». */
function llano(text: string) {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '');
}

/** Lo que se ve en la lista: la categoría elegida, los guardados y el buscador. */
export function filterTips(pool: Tip[], category: string, query: string, saved: string[]) {
	const texto = llano(query.trim());

	return pool.filter((tip) => {
		if (category === SAVED && !saved.includes(tip.id)) return false;
		if (category !== ALL && category !== SAVED && tip.category !== category) return false;
		if (!texto) return true;
		return llano(`${tip.title} ${tip.detail}`).includes(texto);
	});
}

export const TITLE_MAX = 70;
export const DETAIL_MAX = 200;
/** Un cajón de consejos, no un cuaderno entero. */
export const MAX_MINE = 20;

const KEY = 'tuweb:consejos';

/** Espacios de más fuera y nada de saltos de línea: cada campo es un párrafo. */
function oneLine(text: string, max: number) {
	return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

function nextId() {
	return `mio-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Un consejo propio a partir de lo escrito en el formulario, o el motivo por el
 * que no vale. Lo mismo sirve para lo que se teclea ahora y para lo que se lee
 * del navegador, que podría venir tocado a mano.
 */
export function toTip(draft: Partial<Record<keyof Tip, unknown>>): Tip | string {
	const title = oneLine(String(draft.title ?? ''), TITLE_MAX);
	if (!title) return 'Escribe el consejo en una línea.';
	if (title.length < 8) return 'Un poco más largo, que se entienda.';

	const detail = oneLine(String(draft.detail ?? ''), DETAIL_MAX);
	if (!detail) return 'Cuenta por qué, aunque sea en una frase.';

	const category = getCategory(String(draft.category ?? '')) ? String(draft.category) : 'codigo';
	const id = typeof draft.id === 'string' && draft.id.startsWith('mio-') ? draft.id.slice(0, 32) : nextId();

	return { id, title, detail, category, mine: true };
}

export interface Store {
	/** La categoría elegida, «todas» o «guardados». */
	category: string;
	/** Los ids guardados, del último al primero. */
	saved: string[];
	/** Los consejos escritos en este navegador, del último al primero. */
	mine: Tip[];
}

function vacio(): Store {
	return { category: ALL, saved: [], mine: [] };
}

export function readStore(): Store {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return vacio();

		const parsed = JSON.parse(raw) as Partial<Record<keyof Store, unknown>>;
		if (!parsed || typeof parsed !== 'object') return vacio();

		const mine = (Array.isArray(parsed.mine) ? parsed.mine : [])
			.map((item) => (item && typeof item === 'object' ? toTip(item as Partial<Tip>) : ''))
			.filter((item): item is Tip => typeof item !== 'string')
			.slice(0, MAX_MINE);

		// Un guardado que ya no existe —porque lo quitaste— no vuelve a la lista.
		const known = new Set([...TIPS, ...mine].map((tip) => tip.id));
		const saved = (Array.isArray(parsed.saved) ? parsed.saved : []).filter(
			(id): id is string => typeof id === 'string' && known.has(id),
		);

		const category = String(parsed.category ?? ALL);

		return { category: category === SAVED || getCategory(category) ? category : ALL, saved, mine };
	} catch {
		// Sin almacenamiento, o con basura dentro: se empieza de cero.
		return vacio();
	}
}

export function saveStore(store: Store) {
	try {
		localStorage.setItem(KEY, JSON.stringify({ ...store, mine: store.mine.slice(0, MAX_MINE) }));
	} catch {
		// Si no deja guardar, lo escrito dura lo que dure la pestaña.
	}
}

/** El consejo tal cual se copia. */
export function fullText(tip: Tip) {
	return `${tip.title}\n${tip.detail}`;
}

/** El mismo consejo escrito para pegarlo en el formulario de ideas. */
export function pitchOf(tip: Tip) {
	return `Añadid a los consejos de desarrollo, en ${labelOf(tip).toLowerCase()}: ${tip.title}. ${tip.detail}`.slice(
		0,
		280,
	);
}
