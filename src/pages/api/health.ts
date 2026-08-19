import { readFileSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { get } from '../../lib/db/client';

export const prerender = false;

function releaseSha() {
	try {
		return readFileSync('.release-sha', 'utf8').trim() || null;
	} catch {
		return process.env.RELEASE_SHA ?? null;
	}
}

export const GET: APIRoute = async () => {
	try {
		const shipped = get<{ n: number }>("SELECT count(*) AS n FROM features WHERE status = 'shipped'");

		return Response.json({
			ok: true,
			version: shipped?.n ?? 0,
			sha: releaseSha(),
			at: new Date().toISOString(),
		});
	} catch (error) {
		// El detalle va al log del servidor, no a quien pregunta.
		console.error('Health check fallo', error);
		return Response.json({ ok: false }, { status: 503 });
	}
};
