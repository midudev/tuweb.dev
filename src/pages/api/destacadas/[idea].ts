import type { APIRoute } from 'astro';
import { cleanText, fail, intIn, json, looksLikeSpam, readJson, rejectWrite } from '../../../lib/api';
import { getSessionUser } from '../../../lib/auth';
import { addHighlightComment, highlightComments, isShippedFeature } from '../../../lib/db/community';
import { COMMENT_MAX } from '../../../lib/destacadas';
import { allowAll } from '../../../lib/rate-limit';

const ALIAS_RE = /^visitante#[0-9a-f]{4}$/;

function ideaOf(raw: string | undefined) {
	const idea = intIn(raw, 1, Number.MAX_SAFE_INTEGER);
	return idea && isShippedFeature(idea) ? idea : null;
}

/** Los comentarios de una idea, los últimos primero. */
export const GET: APIRoute = async (context) => {
	const idea = ideaOf(context.params.idea);
	if (!idea) return fail(404, 'idea');
	const user = await getSessionUser(context);
	return json({ comments: highlightComments(idea, user?.id ?? null) });
};

/**
 * Comentar pide sesión, aunque lo que se enseña es el alias: así el alias
 * sigue siendo anónimo para quien lee, pero cada comentario tiene dueño para
 * poder frenarlo y borrarlo.
 */
export const POST: APIRoute = async (context) => {
	const rejected = rejectWrite(context);
	if (rejected) return rejected;

	const idea = ideaOf(context.params.idea);
	if (!idea) return fail(404, 'idea');

	const user = await getSessionUser(context);
	if (!user) return fail(401, 'login');

	const data = await readJson(context.request);
	const text = cleanText(data?.text, COMMENT_MAX);
	if (!text) return fail(400, 'texto');
	if (looksLikeSpam(text)) return fail(422, 'spam');
	// Solo el alias aleatorio de la casa: nada de firmar con el nombre de otro.
	const alias = typeof data?.alias === 'string' && ALIAS_RE.test(data.alias) ? data.alias : null;
	if (!alias) return fail(400, 'alias');

	if (
		!allowAll([
			{ key: `comentarios:u${user.id}`, limit: 1, windowMs: 5_000 },
			{ key: `comentarios:u${user.id}:h`, limit: 30, windowMs: 60 * 60_000 },
		])
	) {
		return fail(429, 'despacio');
	}

	const comment = addHighlightComment(idea, user.id, alias, text);
	return json({ comment: { ...comment, mine: true } }, 201);
};
