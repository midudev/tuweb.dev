import type { APIRoute } from 'astro';
import { processCycle } from '../../../lib/process-cycle';
import { matchesCronSecret as authorized } from '../../../lib/secrets';

export const GET: APIRoute = async ({ request }) => {
	if (!authorized(request)) {
		return Response.json({ error: 'No autorizado' }, { status: 401 });
	}

	const result = await processCycle();
	return Response.json(result);
};

export const POST = GET;
