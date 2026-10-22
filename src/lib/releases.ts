import { get } from './db/client';
import { RELEASE_COLUMNS, type Release } from './db/schema';

/**
 * Lo que la web enseña arriba a la izquierda. Un 'building' o un 'repairing'
 * viejo es una iteración que se murió a medias: ni se está construyendo ni se
 * está arreglando ya nadie.
 */
export type SiteState = 'idle' | 'building' | 'repairing' | 'broken' | 'reverted';

const IN_PROGRESS_MAX_MS = 30 * 60 * 1000;

export function siteState(release: Release | null): SiteState {
	if (!release) return 'idle';
	const running = Date.now() - new Date(release.createdAt).getTime() < IN_PROGRESS_MAX_MS;

	switch (release.status) {
		case 'building':
			return running ? 'building' : 'idle';
		// Un arreglo que no terminó deja la web tal cual estaba: rota y sin nadie.
		case 'repairing':
			return running ? 'repairing' : 'broken';
		case 'failed':
			return 'broken';
		case 'rolled_back':
			return 'reverted';
		default:
			return 'idle';
	}
}

export function getLastRelease() {
	return get<Release>(`SELECT ${RELEASE_COLUMNS} FROM releases ORDER BY id DESC LIMIT 1`);
}
