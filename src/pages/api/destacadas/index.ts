import type { APIRoute } from 'astro';
import { fail, intIn, json, readJson, rejectWrite } from '../../../lib/api';
import { getSessionUser } from '../../../lib/auth';
import { highlightCounts, isShippedFeature, myHighlightVotes, toggleHighlightVote } from '../../../lib/db/community';
import { allow } from '../../../lib/rate-limit';

/** Votos y comentarios de cada idea publicada, y cuáles ha votado quien pregunta. */
export const GET: APIRoute = async (context) => {
	const user = await getSessionUser(context);
	return json({ ...highlightCounts(), mine: user ? myHighlightVotes(user.id) : [], login: user?.login ?? null });
};

/** Pone o quita el voto de una idea. Un voto por persona e idea. */
export const POST: APIRoute = async (context) => {
	const rejected = rejectWrite(context);
	if (rejected) return rejected;

	const user = await getSessionUser(context);
	if (!user) return fail(401, 'login');
	if (!allow(`votos:u${user.id}`, 30, 60_000)) return fail(429, 'despacio');

	const data = await readJson(context.request);
	const idea = intIn(data?.idea, 1, Number.MAX_SAFE_INTEGER);
	if (!idea || !isShippedFeature(idea)) return fail(404, 'idea');

	return json(toggleHighlightVote(idea, user.id));
};
