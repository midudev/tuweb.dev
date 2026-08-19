import type { APIRoute } from 'astro';
import { getLastLiveSha, getLastRelease, recordRelease, type ReleaseStatus } from '../../lib/releases';
import { matchesCronSecret as authorized } from '../../lib/secrets';

const STATUSES = new Set<ReleaseStatus>(['building', 'live', 'rolled_back', 'failed']);

export const GET: APIRoute = async ({ request, url }) => {
	if (!authorized(request)) {
		return Response.json({ error: 'No autorizado' }, { status: 401 });
	}

	const [last, lastLiveSha] = await Promise.all([
		getLastRelease(),
		getLastLiveSha(url.searchParams.get('exclude') ?? undefined),
	]);

	return Response.json({ last, lastLiveSha });
};

export const POST: APIRoute = async ({ request }) => {
	if (!authorized(request)) {
		return Response.json({ error: 'No autorizado' }, { status: 401 });
	}

	const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
	const commitSha = String(body?.commitSha ?? '').trim();
	const status = String(body?.status ?? '') as ReleaseStatus;

	if (!/^[0-9a-f]{7,40}$/i.test(commitSha) || !STATUSES.has(status)) {
		return Response.json({ error: 'commitSha o status no válidos' }, { status: 400 });
	}

	const row = await recordRelease({
		commitSha,
		previousSha: body?.previousSha ? String(body.previousSha) : null,
		status,
		error: body?.error ? String(body.error) : null,
		featureId: Number.isInteger(body?.featureId) ? Number(body?.featureId) : null,
	});

	return Response.json(row);
};
