/**
 * Los logros: lo que se gana cuando una idea pasa el filtro, gana su ventana y
 * acaba implementada en una versión.
 *
 * No hay tabla nueva ni nada que apuntar aparte, igual que en el ranking: cada
 * logro es una cuenta sobre lo que ya está guardado. Se desbloquean solos al
 * cerrar la ventana y al salir la versión, sin que nadie toque un botón.
 *
 * Todo sale de los créditos, que ya juntan lo de cada persona: ideas enviadas,
 * las que pasaron el filtro, las que ganaron y las versiones que firma.
 */
import { getCreditsData, type CreditVersion } from './credits';

export type AchievementGroup = 'ideas' | 'ventanas' | 'versiones' | 'casa';

/** El título de cada cajón. El orden es el de esta lista. */
export const GROUPS: { key: AchievementGroup; label: string }[] = [
	{ key: 'ideas', label: 'IDEAS APROBADAS' },
	{ key: 'ventanas', label: 'VENTANAS GANADAS' },
	{ key: 'versiones', label: 'IDEAS IMPLEMENTADAS' },
	{ key: 'casa', label: 'DE LA CASA' },
];

/** Se enseña el muro de los primeros; el resto se resume en una línea. */
export const MAX_BOARD = 10;

/** Lo que lleva hecho una persona. De aquí sale todo lo demás. */
export interface PersonStats {
	login: string;
	/** Su número en los créditos: el orden de llegada, que no cambia nunca. */
	number: number;
	/** Todas las que ha mandado, pasaran el filtro o no. */
	sent: number;
	/** Las que la IA dio por buenas. */
	approved: number;
	/** Las que ganaron su ventana. */
	wins: number;
	/** Versiones publicadas que firma. */
	shipped: number;
	discarded: number;
	/** De esas versiones, las que firma junto a más gente. */
	shared: number;
	me: boolean;
}

export interface Achievement {
	key: string;
	title: string;
	/** Qué hay que hacer para tenerlo. */
	detail: string;
	icon: string;
	group: AchievementGroup;
	/** Cuánto hace falta para desbloquearlo. */
	goal: number;
	/** Cuánto lleva esta persona de ese logro. */
	count: (stats: PersonStats) => number;
}

/** El catálogo entero. Está escrito en la página, así que sale de aquí. */
export const ACHIEVEMENTS: Achievement[] = [
	{
		key: 'primera',
		title: 'Primera idea',
		detail: 'Mandas tu primera idea.',
		icon: 'send',
		group: 'ideas',
		goal: 1,
		count: (stats) => stats.sent,
	},
	{
		key: 'aprobada',
		title: 'Aprobada',
		detail: 'Una idea tuya pasa el filtro de la IA.',
		icon: 'circle-check',
		group: 'ideas',
		goal: 1,
		count: (stats) => stats.approved,
	},
	{
		key: 'aprobadas-5',
		title: 'Cinco aprobadas',
		detail: 'Cinco ideas tuyas pasan el filtro.',
		icon: 'checks',
		group: 'ideas',
		goal: 5,
		count: (stats) => stats.approved,
	},
	{
		key: 'aprobadas-10',
		title: 'Diez aprobadas',
		detail: 'Diez ideas tuyas pasan el filtro.',
		icon: 'badge',
		group: 'ideas',
		goal: 10,
		count: (stats) => stats.approved,
	},
	{
		key: 'ganada',
		title: 'Ganar la ventana',
		detail: 'Una idea tuya gana su ventana.',
		icon: 'trophy',
		group: 'ventanas',
		goal: 1,
		count: (stats) => stats.wins,
	},
	{
		key: 'ganadas-3',
		title: 'Tres ventanas',
		detail: 'Tres ideas tuyas ganan su ventana.',
		icon: 'crown',
		group: 'ventanas',
		goal: 3,
		count: (stats) => stats.wins,
	},
	{
		key: 'ganadas-5',
		title: 'Cinco ventanas',
		detail: 'Cinco ideas tuyas ganan su ventana.',
		icon: 'military-award',
		group: 'ventanas',
		goal: 5,
		count: (stats) => stats.wins,
	},
	{
		key: 'implementada',
		title: 'Implementada',
		detail: 'Una idea tuya llega a la web en una versión.',
		icon: 'rocket',
		group: 'versiones',
		goal: 1,
		count: (stats) => stats.shipped,
	},
	{
		key: 'implementadas-3',
		title: 'Tres versiones',
		detail: 'Firmas tres versiones publicadas.',
		icon: 'packages',
		group: 'versiones',
		goal: 3,
		count: (stats) => stats.shipped,
	},
	{
		key: 'implementadas-10',
		title: 'Diez versiones',
		detail: 'Firmas diez versiones publicadas.',
		icon: 'star',
		group: 'versiones',
		goal: 10,
		count: (stats) => stats.shipped,
	},
	{
		key: 'compartida',
		title: 'A la vez',
		detail: 'Firmas una versión junto a más gente que pidió lo mismo.',
		icon: 'users',
		group: 'versiones',
		goal: 1,
		count: (stats) => stats.shared,
	},
	{
		key: 'fundador',
		title: 'De los primeros',
		detail: 'Estás entre las diez primeras personas que propusieron algo.',
		icon: 'flag',
		group: 'casa',
		goal: 1,
		count: (stats) => (stats.number > 0 && stats.number <= 10 ? 1 : 0),
	},
	{
		key: 'insistente',
		title: 'Insistente',
		detail: 'Mandas cinco ideas, salgan o no.',
		icon: 'refresh',
		group: 'casa',
		goal: 5,
		count: (stats) => stats.sent,
	},
	{
		key: 'terco',
		title: 'Otra vez',
		detail: 'Te descartan una idea y vuelves con otra que pasa el filtro.',
		icon: 'flame',
		group: 'casa',
		goal: 1,
		count: (stats) => (stats.discarded > 0 && stats.approved > 0 ? 1 : 0),
	},
];

/** Un logro con lo que lleva quien mira y cuánta gente lo tiene. */
export interface AchievementState extends Omit<Achievement, 'count'> {
	/** Lo que lleva quien mira. Cero si no ha entrado. */
	progress: number;
	done: boolean;
	/** Cuánta gente lo tiene: lo raro que es. */
	people: number;
}

export interface BoardRow {
	position: number;
	login: string;
	done: number;
	approved: number;
	wins: number;
	shipped: number;
	me: boolean;
}

const EMPTY_STATS = (login: string): PersonStats => ({
	login,
	number: 0,
	sent: 0,
	approved: 0,
	wins: 0,
	shipped: 0,
	discarded: 0,
	shared: 0,
	me: true,
});

function isDone(achievement: Achievement, stats: PersonStats) {
	return achievement.count(stats) >= achievement.goal;
}

function countDone(stats: PersonStats) {
	return ACHIEVEMENTS.filter((achievement) => isDone(achievement, stats)).length;
}

export function getAchievementsData(user?: { id: number; login: string }) {
	const credits = getCreditsData(user?.id);

	// Una versión firmada por dos o más es de las dos: cuenta para el logro de
	// haber pedido lo mismo a la vez.
	const sharedByLogin = new Map<string, number>();
	for (const version of credits.versions) {
		if (version.people.length < 2) continue;
		for (const login of version.people) {
			sharedByLogin.set(login, (sharedByLogin.get(login) ?? 0) + 1);
		}
	}

	const people: PersonStats[] = credits.people.map((person) => ({
		login: person.login,
		number: person.number,
		sent: person.ideas + person.pending + person.discarded,
		approved: person.ideas,
		wins: person.wins,
		shipped: person.shipped,
		discarded: person.discarded,
		shared: sharedByLogin.get(person.login) ?? 0,
		me: person.me,
	}));

	// Quien ha entrado pero todavía no ha propuesto nada no está en los créditos:
	// se le enseña el catálogo entero a cero, que es justo lo que lleva.
	const mine = people.find((person) => person.me) ?? (user ? EMPTY_STATS(user.login) : null);

	const list: AchievementState[] = ACHIEVEMENTS.map(({ count, ...achievement }) => {
		const progress = mine ? count(mine) : 0;
		return {
			...achievement,
			progress: Math.min(progress, achievement.goal),
			done: progress >= achievement.goal,
			people: people.filter((person) => count(person) >= achievement.goal).length,
		};
	});

	const scored = people.map((stats) => ({ stats, done: countDone(stats) }));

	// Manda cuántos logros lleva; luego las versiones, las ventanas ganadas y las
	// ideas que pasaron. Si aun así empatan, quien llegó antes.
	scored.sort(
		(a, b) =>
			b.done - a.done ||
			b.stats.shipped - a.stats.shipped ||
			b.stats.wins - a.stats.wins ||
			b.stats.approved - a.stats.approved ||
			a.stats.number - b.stats.number,
	);

	let position = 0;
	let previous: number | null = null;
	const ranked: BoardRow[] = scored.map((row, index) => {
		// Los mismos logros, el mismo puesto.
		if (previous === null || row.done !== previous) position = index + 1;
		previous = row.done;
		return {
			position,
			login: row.stats.login,
			done: row.done,
			approved: row.stats.approved,
			wins: row.stats.wins,
			shipped: row.stats.shipped,
			me: row.stats.me,
		};
	});

	const board = ranked.filter((row) => row.done > 0).slice(0, MAX_BOARD);
	const me = ranked.find((row) => row.me) ?? null;

	// Las versiones que firma quien mira: son el logro grande, así que se ven.
	const versions: CreditVersion[] = mine
		? credits.versions.filter((version) => version.people.includes(mine.login))
		: [];

	return {
		list,
		board,
		versions,
		stats: mine,
		/** Su fila del muro, si lleva algún logro y se quedó fuera del corte. */
		me: me && me.done > 0 && !board.includes(me) ? me : null,
		done: mine ? countDone(mine) : 0,
		totals: {
			catalogue: ACHIEVEMENTS.length,
			people: people.length,
			unlocked: scored.reduce((sum, row) => sum + row.done, 0),
			withAny: scored.filter((row) => row.done > 0).length,
		},
	};
}
