import type { APIRoute } from 'astro';
import { fail, intIn, json, rejectWrite } from '../../../../lib/api';
import { getSessionUser } from '../../../../lib/auth';
import { deleteHighlightComment } from '../../../../lib/db/community';

/** Cada cual borra los suyos y solo los suyos. */
export const DELETE: APIRoute = async (context) => {
	const rejected = rejectWrite(context);
	if (rejected) return rejected;
	const user = await getSessionUser(context);
	if (!user) return fail(401, 'login');
	const id = intIn(context.params.id, 1, Number.MAX_SAFE_INTEGER);
	if (!id || !deleteHighlightComment(id, user.id)) return fail(404, 'comentario');
	return json({ ok: true });
};
