import type { APIRoute } from 'astro';
import { clientIp, cleanText, fail, intIn, json, looksLikeSpam, readJson, rejectWrite } from '../../../lib/api';
import { getSessionUser } from '../../../lib/auth';
import { chatSince, isRoom, postChat } from '../../../lib/db/community';
import { touch } from '../../../lib/presence';
import { allowAll } from '../../../lib/rate-limit';

const BODY_MAX = 400;
const ALIAS_MAX = 24;
const ANON_ALIAS_RE = /^anónimo#[0-9a-f]{4}$/;

/**
 * El chat se lee preguntando cada pocos segundos por lo posterior al último id
 * que se tiene. Es una consulta por índice que casi siempre vuelve vacía.
 *
 * - irc: se lee sin sesión; para escribir hace falta entrar con GitHub y el
 *   nombre es el de GitHub, que no se puede suplantar.
 * - anon: sin sesión y con alias libre. El freno va por IP.
 */
export const GET: APIRoute = async (context) => {
	const room = context.params.room;
	if (!isRoom(room)) return fail(404, 'sala');

	const since = intIn(context.url.searchParams.get('since') ?? '0', 0, Number.MAX_SAFE_INTEGER) ?? 0;
	const user = room === 'irc' ? await getSessionUser(context) : null;
	const online = touch(room, user ? `u${user.id}` : clientIp(context.request));

	const messages = chatSince(room, since).map(({ userId, ...message }) => ({
		...message,
		mine: user !== null && userId === user.id,
	}));
	return json({ messages, online, login: user?.login ?? null });
};

export const POST: APIRoute = async (context) => {
	const room = context.params.room;
	if (!isRoom(room)) return fail(404, 'sala');

	const rejected = rejectWrite(context);
	if (rejected) return rejected;

	const data = await readJson(context.request);
	const body = cleanText(data?.body, BODY_MAX);
	if (!body) return fail(400, 'mensaje');
	if (looksLikeSpam(body)) return fail(422, 'spam');

	if (room === 'irc') {
		const user = await getSessionUser(context);
		if (!user) return fail(401, 'login');
		if (
			!allowAll([
				{ key: `irc:u${user.id}`, limit: 5, windowMs: 10_000 },
				{ key: `irc:u${user.id}:h`, limit: 120, windowMs: 60 * 60_000 },
			])
		) {
			return fail(429, 'despacio');
		}
		const message = postChat('irc', user.id, user.login.slice(0, ALIAS_MAX), body);
		return json({ message: { ...message, mine: true } }, 201);
	}

	// El alias es el aleatorio del chat, anónimo#xxxx: no se puede escoger otro.
	const alias = typeof data?.alias === 'string' ? data.alias.normalize('NFC') : '';
	if (!ANON_ALIAS_RE.test(alias)) return fail(400, 'alias');
	const ip = clientIp(context.request);
	if (
		!allowAll([
			{ key: `anon:${ip}`, limit: 3, windowMs: 10_000 },
			{ key: `anon:${ip}:10m`, limit: 30, windowMs: 10 * 60_000 },
		])
	) {
		return fail(429, 'despacio');
	}
	const message = postChat('anon', null, alias, body);
	return json({ message: { ...message, mine: true } }, 201);
};
