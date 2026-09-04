/**
 * Los créditos: toda la gente que ha pasado por aquí y ha aportado algo, y
 * quién está detrás de cada versión.
 *
 * No es el ranking. El ranking ordena por puntos y corta por arriba; aquí no se
 * corta a nadie y el orden es el de llegada: quien mandó antes su primera idea
 * aparece antes. Tampoco hay tabla nueva, sale de lo que ya está guardado.
 */
import { all } from './db/client';
import { getChangelogData } from './db/queries';

export interface CreditPerson {
	/** El orden de llegada. Es su número en los créditos y no cambia nunca. */
	number: number;
	login: string;
	/** Ideas que pasaron el filtro de la IA, ganasen o no. */
	ideas: number;
	/** Las de la ventana abierta: todavía están en juego. */
	pending: number;
	discarded: number;
	/** Ideas que ganaron su ventana. */
	wins: number;
	/** Versiones publicadas que salieron de una idea suya. */
	shipped: number;
	/** La primera idea que mandó: el día que entró en los créditos. */
	firstAt: string;
	me: boolean;
}

export interface CreditVersion {
	version: number;
	title: string;
	summary: string;
	shippedAt: string | null;
	/** Quién pidió aquello. Vacío en las versiones anteriores a las ideas. */
	people: string[];
}

interface PersonRow {
	userId: number;
	login: string;
	kept: number;
	pending: number;
	discarded: number;
	wins: number;
	firstAt: string;
}

interface AuthorRow {
	featureId: number;
	login: string;
	firstAt: string;
}

export function getCreditsData(userId?: number) {
	// Entra quien haya propuesto algo, aunque la IA se lo tumbara: aportar es
	// haber escrito, no haber acertado.
	const people = all<PersonRow>(
		`SELECT u.id AS userId, u.login,
			sum(CASE WHEN p.status IN ('grouped', 'selected') THEN 1 ELSE 0 END) AS kept,
			sum(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) AS pending,
			sum(CASE WHEN p.status = 'discarded' THEN 1 ELSE 0 END) AS discarded,
			sum(CASE WHEN p.status = 'selected' THEN 1 ELSE 0 END) AS wins,
			min(p.created_at) AS firstAt
		 FROM prompts p
		 JOIN users u ON u.id = p.user_id
		 GROUP BY u.id`,
	);

	// Quién pidió lo que acabó publicado: la idea tuvo que caer en el grupo
	// ganador de la ventana de esa versión. Si dos personas pidieron lo mismo,
	// las dos firman la versión.
	const authors = all<AuthorRow>(
		`SELECT f.id AS featureId, u.login, min(p.created_at) AS firstAt
		 FROM features f
		 JOIN clusters c ON c.cycle_id = f.cycle_id AND c.is_winner = 1
		 JOIN prompts p ON p.cluster_id = c.id
		 JOIN users u ON u.id = p.user_id
		 WHERE f.status = 'shipped'
		 GROUP BY f.id, u.id`,
	);

	// Dentro de cada versión, primero quien la pidió antes.
	const loginsByFeature = new Map<number, string[]>();
	for (const row of [...authors].sort((a, b) => a.firstAt.localeCompare(b.firstAt))) {
		const list = loginsByFeature.get(row.featureId) ?? [];
		list.push(row.login);
		loginsByFeature.set(row.featureId, list);
	}

	// Las versiones y su numeración ya están hechas en el changelog: se le pegan
	// los nombres y listo.
	const changelog = getChangelogData();
	const versions: CreditVersion[] = changelog.entries.map((entry) => ({
		version: entry.version,
		title: entry.title,
		summary: entry.summary,
		shippedAt: entry.shippedAt,
		people: loginsByFeature.get(entry.id) ?? [],
	}));

	// Versiones firmadas por cada persona, contadas desde esos mismos nombres.
	const shippedByLogin = new Map<string, number>();
	for (const version of versions) {
		for (const login of version.people) {
			shippedByLogin.set(login, (shippedByLogin.get(login) ?? 0) + 1);
		}
	}

	// Por orden de llegada. Si dos entraron en el mismo instante, por nombre.
	const ordered = [...people].sort(
		(a, b) => a.firstAt.localeCompare(b.firstAt) || a.login.localeCompare(b.login),
	);

	const credits: CreditPerson[] = ordered.map((row, index) => ({
		number: index + 1,
		login: row.login,
		ideas: row.kept,
		pending: row.pending,
		discarded: row.discarded,
		wins: row.wins,
		shipped: shippedByLogin.get(row.login) ?? 0,
		firstAt: row.firstAt,
		me: userId !== undefined && row.userId === userId,
	}));

	return {
		people: credits,
		versions,
		/** El día que llegó la primera idea de todas. */
		since: credits[0]?.firstAt ?? null,
		totals: {
			people: credits.length,
			ideas: credits.reduce((sum, person) => sum + person.ideas + person.pending, 0),
			wins: credits.reduce((sum, person) => sum + person.wins, 0),
			versions: versions.length,
			/** Versiones que no tienen a nadie apuntado: las de antes de todo esto. */
			orphans: versions.filter((version) => version.people.length === 0).length,
		},
	};
}
