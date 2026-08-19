import { all, get, nowIso, run } from './db/client';
import { RELEASE_COLUMNS, type Release } from './db/schema';

export type ReleaseStatus = 'building' | 'live' | 'rolled_back' | 'failed';

export interface ReleaseInput {
	commitSha: string;
	previousSha?: string | null;
	status: ReleaseStatus;
	error?: string | null;
	featureId?: number | null;
}

export function getLastRelease() {
	return get<Release>(`SELECT ${RELEASE_COLUMNS} FROM releases ORDER BY id DESC LIMIT 1`);
}

/** Último commit que llegó a estar vivo y pasó las comprobaciones. */
export function getLastLiveSha(excludeSha?: string) {
	const rows = all<{ commitSha: string }>(
		"SELECT commit_sha AS commitSha FROM releases WHERE status = 'live' ORDER BY id DESC LIMIT 10",
	);
	return rows.find((row) => row.commitSha !== excludeSha)?.commitSha ?? null;
}

export function recordRelease(input: ReleaseInput) {
	let featureId = input.featureId ?? null;

	// Al publicar, la funcionalidad en cola pasa a desplegada.
	if (input.status === 'live') {
		const queued = featureId
			? get<{ id: number }>('SELECT id FROM features WHERE id = ?', featureId)
			: get<{ id: number }>(
					"SELECT id FROM features WHERE status = 'selected' ORDER BY id DESC LIMIT 1",
				);

		if (queued) {
			featureId = queued.id;
			run("UPDATE features SET status = 'shipped', shipped_at = ? WHERE id = ?", nowIso(), queued.id);
		}
	}

	return get<Release>(
		`INSERT INTO releases (feature_id, commit_sha, previous_sha, status, error, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)
		 RETURNING ${RELEASE_COLUMNS}`,
		featureId,
		input.commitSha,
		input.previousSha ?? null,
		input.status,
		input.error?.slice(0, 500) ?? null,
		nowIso(),
	);
}
