/**
 * El historial: todo lo que le ha pasado a esta web, en orden y sin esconder
 * nada. El changelog cuenta las versiones que salieron bien; aquí sale también
 * la ventana que cerró, el intento que se quedó a medias y lo que hubo que
 * revertir.
 *
 * No hay tabla nueva: el historial se arma con lo que ya guarda la base —los
 * ciclos, las publicaciones y las funcionalidades— mezclado por fecha.
 */
import { all } from './db/client';

export type HistoryKind = 'live' | 'building' | 'repairing' | 'rolled_back' | 'failed' | 'cycle';

/** El cajón de cada movimiento, que es también lo que filtran los botones. */
export type HistoryGroup = 'version' | 'window' | 'build' | 'incident';

export interface HistoryEvent {
	key: string;
	/** ISO del momento en que pasó. */
	at: string;
	kind: HistoryKind;
	group: HistoryGroup;
	/** Qué pasó: «Publicado», «Revertido», «Ventana cerrada»… */
	label: string;
	/** La idea de la que iba, si la había. */
	title: string | null;
	detail: string | null;
	version: number | null;
	commitSha: string | null;
	/** Una línea suelta: el error, los números de la ventana. */
	note: string | null;
}

export interface HistoryDay {
	key: string;
	/** ISO de uno de sus movimientos: el título se escribe en hora local. */
	at: string;
	events: HistoryEvent[];
}

export interface HistoryTotals {
	all: number;
	version: number;
	window: number;
	build: number;
	incident: number;
}

/** Se enseñan los últimos movimientos, no los de toda la vida. */
export const MAX_EVENTS = 200;

const RELEASE_KINDS: Record<string, { kind: HistoryKind; group: HistoryGroup; label: string }> = {
	live: { kind: 'live', group: 'version', label: 'Publicado' },
	building: { kind: 'building', group: 'build', label: 'En construcción' },
	repairing: { kind: 'repairing', group: 'incident', label: 'Arreglando' },
	rolled_back: { kind: 'rolled_back', group: 'incident', label: 'Revertido' },
	failed: { kind: 'failed', group: 'incident', label: 'Falló' },
};

interface ReleaseRow {
	id: number;
	featureId: number | null;
	commitSha: string;
	status: string;
	error: string | null;
	createdAt: string;
	featureTitle: string | null;
	featureSummary: string | null;
}

interface CycleRow {
	id: number;
	processedAt: string;
	winnerTitle: string | null;
	winnerSummary: string | null;
	pendingCount: number;
	discardedCount: number;
}

interface ShippedRow {
	id: number;
	title: string;
	summary: string;
	createdAt: string;
	shippedAt: string | null;
}

function plural(count: number, one: string, many: string) {
	return `${count} ${count === 1 ? one : many}`;
}

export function getHistoryData() {
	const releases = all<ReleaseRow>(
		`SELECT r.id, r.feature_id AS featureId, r.commit_sha AS commitSha,
			r.status, r.error, r.created_at AS createdAt,
			f.title AS featureTitle, f.summary AS featureSummary
		 FROM releases r
		 LEFT JOIN features f ON f.id = r.feature_id
		 ORDER BY r.id DESC`,
	);

	const cycles = all<CycleRow>(
		`SELECT id, processed_at AS processedAt, winner_title AS winnerTitle,
			winner_summary AS winnerSummary, pending_count AS pendingCount,
			discarded_count AS discardedCount
		 FROM cycles ORDER BY id DESC`,
	);

	// La v1 es la más antigua: el número de versión sale del orden de llegada,
	// igual que en el changelog.
	const shipped = all<ShippedRow>(
		`SELECT id, title, summary, created_at AS createdAt, shipped_at AS shippedAt
		 FROM features WHERE status = 'shipped' ORDER BY id ASC`,
	);
	const versionByFeature = new Map<number, number>(
		shipped.map((feature, index) => [feature.id, index + 1]),
	);

	const events: HistoryEvent[] = [];

	for (const release of releases) {
		const kind = RELEASE_KINDS[release.status];
		// Un estado que no conocemos no se inventa: mejor no contarlo.
		if (!kind) continue;

		const version = release.featureId ? (versionByFeature.get(release.featureId) ?? null) : null;

		events.push({
			key: `release-${release.id}`,
			at: release.createdAt,
			kind: kind.kind,
			group: kind.group,
			label: kind.label,
			title: release.featureTitle,
			detail:
				release.featureSummary && release.featureSummary !== release.featureTitle
					? release.featureSummary
					: null,
			version: kind.kind === 'live' ? version : null,
			commitSha: release.commitSha,
			note: release.error,
		});
	}

	// Una funcionalidad puede estar desplegada sin publicación apuntada: las dos
	// primeras vinieron con la base de datos. Se cuentan igual, que también son
	// cambios de la web.
	const withRelease = new Set<number>(
		releases
			.filter((row) => row.status === 'live' && row.featureId !== null)
			.map((row) => row.featureId as number),
	);

	for (const feature of shipped) {
		if (withRelease.has(feature.id)) continue;

		events.push({
			key: `feature-${feature.id}`,
			at: feature.shippedAt ?? feature.createdAt,
			kind: 'live',
			group: 'version',
			label: 'Publicado',
			title: feature.title,
			detail: feature.summary !== feature.title ? feature.summary : null,
			version: versionByFeature.get(feature.id) ?? null,
			commitSha: null,
			note: null,
		});
	}

	for (const cycle of cycles) {
		// pending_count son las ideas que entraron; discarded_count, las que tumbó
		// la IA al repasarlas.
		const numbers = [plural(cycle.pendingCount, 'idea', 'ideas')];
		if (cycle.discardedCount > 0) numbers.push(`${cycle.discardedCount} descartadas`);

		events.push({
			key: `cycle-${cycle.id}`,
			at: cycle.processedAt,
			kind: 'cycle',
			group: 'window',
			label: 'Ventana cerrada',
			title:
				cycle.winnerTitle ??
				(cycle.pendingCount === 0 ? 'Ventana vacía: no llegó ninguna idea' : 'Sin idea ganadora'),
			detail:
				cycle.winnerSummary && cycle.winnerSummary !== cycle.winnerTitle ? cycle.winnerSummary : null,
			version: null,
			commitSha: null,
			note: numbers.join(' · '),
		});
	}

	// De lo más nuevo a lo más viejo. Cuando dos caen en el mismo instante, la
	// publicación va antes que la ventana: la ventana cierra y entonces se
	// construye.
	const rank: Record<HistoryGroup, number> = { version: 0, incident: 1, build: 2, window: 3 };
	events.sort((a, b) => {
		const diff = new Date(b.at).getTime() - new Date(a.at).getTime();
		return diff !== 0 ? diff : rank[a.group] - rank[b.group];
	});

	const totals: HistoryTotals = {
		all: events.length,
		version: events.filter((event) => event.group === 'version').length,
		window: events.filter((event) => event.group === 'window').length,
		build: events.filter((event) => event.group === 'build').length,
		incident: events.filter((event) => event.group === 'incident').length,
	};

	const shown = events.slice(0, MAX_EVENTS);
	const days: HistoryDay[] = [];

	// Los cajones salen con el día del servidor; el navegador los rehace con el
	// del dispositivo, que puede caer en otro por unas horas de diferencia.
	for (const event of shown) {
		const key = new Date(event.at).toDateString();
		const last = days.at(-1);

		if (last?.key === key) last.events.push(event);
		else days.push({ key, at: event.at, events: [event] });
	}

	return { days, totals, version: shipped.length, truncated: events.length > shown.length };
}
