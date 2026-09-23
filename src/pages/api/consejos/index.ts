import type { APIRoute } from 'astro';
import { cleanText, fail, json, looksLikeSpam, readJson, rejectWrite } from '../../../lib/api';
import { getSessionUser } from '../../../lib/auth';
import { CATEGORIES, DETAIL_MAX, MAX_MINE, TITLE_MAX } from '../../../lib/consejos';
import { addTip, countTips, sharedTips } from '../../../lib/db/community';
import { allow } from '../../../lib/rate-limit';

const CATEGORY_IDS = new Set(CATEGORIES.map((category) => category.id));

export const GET: APIRoute = async (context) => {
	const user = await getSessionUser(context);
	return json({ tips: sharedTips(user?.id ?? null), login: user?.login ?? null });
};

export const POST: APIRoute = async (context) => {
	const rejected = rejectWrite(context);
	if (rejected) return rejected;

	const user = await getSessionUser(context);
	if (!user) return fail(401, 'login');
	if (!allow(`consejos:u${user.id}`, 5, 60_000)) return fail(429, 'despacio');

	const data = await readJson(context.request);
	const title = cleanText(data?.title, TITLE_MAX);
	const detail = cleanText(data?.detail ?? '', DETAIL_MAX, { min: 0 });
	const category = typeof data?.category === 'string' && CATEGORY_IDS.has(data.category) ? data.category : null;
	if (!title || detail === null || !category) return fail(400, 'consejo');
	if (looksLikeSpam(`${title} ${detail}`)) return fail(422, 'spam');
	if (countTips(user.id) >= MAX_MINE) return fail(409, 'tope');

	const row = addTip(user.id, { category, title, detail });
	return json({ id: row?.id ?? null }, 201);
};
