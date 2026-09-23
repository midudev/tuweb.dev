import type { APIRoute } from 'astro';
import { cleanText, fail, json, looksLikeSpam, readJson, rejectWrite } from '../../../lib/api';
import { getSessionUser } from '../../../lib/auth';
import { addProject, countProjects, sharedProjects } from '../../../lib/db/community';
import { cleanUrl, NAME_MAX, PITCH_MAX, TAGS } from '../../../lib/showcase';
import { allow } from '../../../lib/rate-limit';

const PER_PERSON = 3;
const URL_MAX = 200;
const TAG_SET = new Set<string>(TAGS);

export const GET: APIRoute = async (context) => {
	const user = await getSessionUser(context);
	return json({ projects: sharedProjects(user?.id ?? null), login: user?.login ?? null });
};

export const POST: APIRoute = async (context) => {
	const rejected = rejectWrite(context);
	if (rejected) return rejected;

	const user = await getSessionUser(context);
	if (!user) return fail(401, 'login');
	if (!allow(`escaparate:u${user.id}`, 5, 60_000)) return fail(429, 'despacio');

	const data = await readJson(context.request);
	const name = cleanText(data?.name, NAME_MAX);
	const pitch = cleanText(data?.pitch ?? '', PITCH_MAX, { min: 0 });
	const url = typeof data?.url === 'string' ? cleanUrl(data.url) : '';
	const tag = typeof data?.tag === 'string' && TAG_SET.has(data.tag) ? data.tag : null;
	if (!name || pitch === null || !url || url.length > URL_MAX || !tag) return fail(400, 'proyecto');
	// El enlace va en su campo; en el nombre y la frase no se cuelan más.
	if (looksLikeSpam(`${name} ${pitch}`)) return fail(422, 'spam');
	if (countProjects(user.id) >= PER_PERSON) return fail(409, 'tope');

	const row = addProject(user.id, { name, url, pitch, tag });
	return json({ id: row?.id ?? null }, 201);
};
