import type { APIRoute } from 'astro';
import { fail, intIn, json, readJson, rejectWrite } from '../../lib/api';
import { getSessionUser } from '../../lib/auth';
import { snakeTop, submitSnakeScore } from '../../lib/db/community';
import { allow } from '../../lib/rate-limit';

/** modo:ritmo, los mismos que el juego (Minigame.astro). */
const MODES = new Set(
	['paredes', 'tunel'].flatMap((modo) => ['calma', 'normal', 'nervio'].map((ritmo) => `${modo}:${ritmo}`)),
);
/**
 * Más de lo que cabe en el tablero no es una partida, es un invento: 20×14
 * casillas menos las tres con las que empieza la serpiente.
 */
const POINTS_MAX = 20 * 14 - 3;

export const GET: APIRoute = async (context) => {
	const mode = context.url.searchParams.get('mode') ?? '';
	if (!MODES.has(mode)) return fail(400, 'modo');
	const user = await getSessionUser(context);
	return json({ mode, top: snakeTop(mode, user?.id ?? null), login: user?.login ?? null });
};

/**
 * La puntuación la manda el navegador, así que se puede inventar: la sesión
 * de GitHub pone nombre a quien lo haga, el tope corta lo imposible y el
 * freno impide mandar marcas en ráfaga.
 */
export const POST: APIRoute = async (context) => {
	const rejected = rejectWrite(context);
	if (rejected) return rejected;

	const user = await getSessionUser(context);
	if (!user) return fail(401, 'login');
	if (!allow(`serpiente:u${user.id}`, 10, 60_000)) return fail(429, 'despacio');

	const data = await readJson(context.request);
	const mode = typeof data?.mode === 'string' && MODES.has(data.mode) ? data.mode : null;
	const points = intIn(data?.points, 1, POINTS_MAX);
	if (!mode || !points) return fail(400, 'marca');

	const result = submitSnakeScore(mode, user.id, points);
	return json({ ...result, top: snakeTop(mode, user.id) });
};
