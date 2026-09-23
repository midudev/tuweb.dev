import type { APIRoute } from 'astro';
import { cleanText, fail, json, looksLikeSpam, readJson, rejectWrite } from '../../../lib/api';
import { getSessionUser } from '../../../lib/auth';
import { addReto, countRetos, retosOfWeek } from '../../../lib/db/community';
import {
	DETAIL_MAX,
	HOUSE_COUNT,
	isNivel,
	isTema,
	MAX_RETOS,
	nextWeekStart,
	TITLE_MAX,
	weekIndex,
	weekStart,
} from '../../../lib/retos';
import { allow } from '../../../lib/rate-limit';

/** Los que propone la gente caben en lo que dejan libre los de la casa. */
const SHARED_MAX = MAX_RETOS - HOUSE_COUNT;
const PER_PERSON = 3;
/** Una semana de margen después de acabar, para ver la anterior. */
const KEEP_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** La semana la marca el servidor: es la misma para todo el mundo. */
function currentWeek(now = Date.now()) {
	const start = weekStart(now);
	return { start, index: weekIndex(start), end: nextWeekStart(start) };
}

export const GET: APIRoute = async (context) => {
	const user = await getSessionUser(context);
	const week = currentWeek();
	return json({
		week: week.index,
		start: week.start,
		end: week.end,
		retos: retosOfWeek(week.index, user?.id ?? null),
		login: user?.login ?? null,
	});
};

export const POST: APIRoute = async (context) => {
	const rejected = rejectWrite(context);
	if (rejected) return rejected;

	const user = await getSessionUser(context);
	if (!user) return fail(401, 'login');
	if (!allow(`retos:u${user.id}`, 5, 60_000)) return fail(429, 'despacio');

	const data = await readJson(context.request);
	const title = cleanText(data?.title, TITLE_MAX);
	const detail = cleanText(data?.detail ?? '', DETAIL_MAX, { min: 0 }) ?? null;
	if (!title || detail === null || !isTema(data?.tema) || !isNivel(data?.nivel)) return fail(400, 'reto');
	if (looksLikeSpam(`${title} ${detail}`)) return fail(422, 'spam');

	const week = currentWeek();
	if (countRetos(week.index) >= SHARED_MAX) return fail(409, 'lleno');
	if (countRetos(week.index, user.id) >= PER_PERSON) return fail(409, 'tope');

	const row = addReto(
		user.id,
		week.index,
		{ title, detail, tema: data!.tema as string, nivel: data!.nivel as string },
		week.end + KEEP_AFTER_MS,
	);
	return json({ id: row?.id ?? null }, 201);
};
