import { WINDOW_MS } from '../window';
import { all, get, nowIso, run } from './client';
import { FEATURE_COLUMNS, type Feature, type Release } from './schema';
import { getLastRelease } from '../releases';

export interface WindowIdea {
	id: number;
	body: string;
	createdAt: string;
	login: string;
	avatarUrl: string;
}

export interface WindowDiscard {
	id: number;
	body: string;
	reason: string | null;
}

export interface MyPrompt {
	id: number;
	body: string;
	status: string;
	discardReason: string | null;
	edits: number;
}

/** Cambios que se permiten por idea. Al cerrar la ventana empieza otra idea. */
export const MAX_EDITS = 3;

/** La ventana abierta va desde el último ciclo hasta WINDOW_MS después. */
function getWindow() {
	const lastCycle = get<{ processedAt: string }>(
		'SELECT processed_at AS processedAt FROM cycles ORDER BY id DESC LIMIT 1',
	);
	const firstPrompt = lastCycle
		? null
		: get<{ createdAt: string }>('SELECT created_at AS createdAt FROM prompts ORDER BY id ASC LIMIT 1');

	const startedAt = lastCycle?.processedAt ?? firstPrompt?.createdAt ?? nowIso();
	const endsAt = new Date(new Date(startedAt).getTime() + WINDOW_MS).toISOString();
	return { startedAt, endsAt };
}

export function getMyPromptInWindow(userId: number) {
	const { startedAt } = getWindow();
	return get<MyPrompt>(
		`SELECT id, body, status, discard_reason AS discardReason, edits
		 FROM prompts
		 WHERE user_id = ? AND created_at >= ?
		 ORDER BY created_at DESC LIMIT 1`,
		userId,
		startedAt,
	);
}

export function getHomeData(userId?: number) {
	const window = getWindow();

	const counts = all<{ status: string; total: number }>(
		'SELECT status, count(*) AS total FROM prompts WHERE created_at >= ? GROUP BY status',
		window.startedAt,
	);
	const totalOf = (status: string) => counts.find((row) => row.status === status)?.total ?? 0;

	const shipped = all<Feature>(
		`SELECT ${FEATURE_COLUMNS} FROM features WHERE status = 'shipped' ORDER BY id DESC`,
	);
	const next = get<Feature>(
		`SELECT ${FEATURE_COLUMNS} FROM features WHERE status = 'selected' ORDER BY id DESC LIMIT 1`,
	);

	return {
		window,
		ideaCount: totalOf('pending'),
		discardedCount: totalOf('discarded'),
		version: shipped.length,
		lastShipped: shipped[0] ?? null,
		next,
		myPrompt: userId ? getMyPromptInWindow(userId) : null,
		lastRelease: getLastRelease() as Release | null,
	};
}

export function getIdeasData() {
	const window = getWindow();

	const ideas = all<WindowIdea>(
		`SELECT p.id, p.body, p.created_at AS createdAt, u.login, u.avatar_url AS avatarUrl
		 FROM prompts p
		 JOIN users u ON u.id = p.user_id
		 WHERE p.status = 'pending' AND p.created_at >= ?
		 ORDER BY p.created_at ASC`,
		window.startedAt,
	);

	const discarded = all<WindowDiscard>(
		`SELECT id, body, discard_reason AS reason
		 FROM prompts
		 WHERE status = 'discarded' AND created_at >= ?
		 ORDER BY id ASC`,
		window.startedAt,
	);

	const version = get<{ n: number }>("SELECT count(*) AS n FROM features WHERE status = 'shipped'");

	return { window, ideas, discarded, version: version?.n ?? 0 };
}

export interface CyclePoint {
	id: number;
	processedAt: string;
	ideas: number;
	title: string | null;
}

/** Los números del dashboard: totales de siempre y las últimas ventanas. */
export function getDashboardData() {
	const totals = get<{ prompts: number; people: number }>(
		'SELECT count(*) AS prompts, count(DISTINCT user_id) AS people FROM prompts',
	);
	const cycles = get<{ n: number }>('SELECT count(*) AS n FROM cycles');

	// Se piden de la más nueva a la más vieja y se le da la vuelta: en el
	// gráfico el tiempo baja, la última ventana queda abajo del todo.
	const points = all<CyclePoint>(
		`SELECT id, processed_at AS processedAt, pending_count AS ideas, winner_title AS title
		 FROM cycles ORDER BY id DESC LIMIT 8`,
	).reverse();

	return {
		prompts: totals?.prompts ?? 0,
		people: totals?.people ?? 0,
		cycles: cycles?.n ?? 0,
		points,
	};
}

export function createPrompt(userId: number, body: string, verdict: { keep: boolean; reason?: string }) {
	const status = verdict.keep ? 'pending' : 'discarded';
	const discardReason = verdict.keep ? null : (verdict.reason ?? 'spam');

	return get(
		`INSERT INTO prompts (user_id, body, status, discard_reason, created_at)
		 VALUES (?, ?, ?, ?, ?)
		 RETURNING id, body, status`,
		userId,
		body,
		status,
		discardReason,
		nowIso(),
	);
}

/**
 * Cambiar una idea que ya estaba enviada. Pasa el mismo filtro que la primera
 * vez, así que un cambio puede acabar descartado o rescatar una descartada.
 */
export function updatePrompt(id: number, body: string, verdict: { keep: boolean; reason?: string }) {
	return get<MyPrompt>(
		`UPDATE prompts
		 SET body = ?, status = ?, discard_reason = ?, edits = edits + 1
		 WHERE id = ?
		 RETURNING id, body, status, discard_reason AS discardReason, edits`,
		body,
		verdict.keep ? 'pending' : 'discarded',
		verdict.keep ? null : (verdict.reason ?? 'spam'),
		id,
	);
}

export function getChangelogData() {
	const shipped = all<Feature>(
		`SELECT ${FEATURE_COLUMNS} FROM features WHERE status = 'shipped' ORDER BY id ASC`,
	);
	const queued = all<Feature>(
		`SELECT ${FEATURE_COLUMNS} FROM features WHERE status = 'selected' ORDER BY id DESC`,
	);
	const liveReleases = all<{ featureId: number | null; commitSha: string }>(
		`SELECT feature_id AS featureId, commit_sha AS commitSha
		 FROM releases WHERE status = 'live' ORDER BY id ASC`,
	);

	const shaByFeature = new Map(
		liveReleases.filter((row) => row.featureId).map((row) => [row.featureId as number, row.commitSha]),
	);

	// La v1 es la más antigua: se numera de abajo arriba y se muestra al revés.
	const entries = shipped
		.map((feature, index) => ({
			...feature,
			version: index + 1,
			commitSha: shaByFeature.get(feature.id) ?? null,
		}))
		.reverse();

	return { entries, queued, version: shipped.length };
}

export { run };
