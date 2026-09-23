import type { APIRoute } from 'astro';
import { fail, intIn, json, rejectWrite } from '../../../lib/api';
import { getSessionUser } from '../../../lib/auth';
import { deleteTip } from '../../../lib/db/community';

export const DELETE: APIRoute = async (context) => {
	const rejected = rejectWrite(context);
	if (rejected) return rejected;
	const user = await getSessionUser(context);
	if (!user) return fail(401, 'login');
	const id = intIn(context.params.id, 1, Number.MAX_SAFE_INTEGER);
	if (!id || !deleteTip(id, user.id)) return fail(404, 'consejo');
	return json({ ok: true });
};
