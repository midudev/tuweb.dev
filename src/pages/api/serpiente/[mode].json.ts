import type { APIRoute, GetStaticPaths } from 'astro';
import { SNAKE_MODES, snakeTop } from '../../../lib/db/community';

// «paredes:calma» va como «paredes-calma»: los dos puntos no viajan bien en un
// nombre de fichero. Minigame.astro lo pide así.
export const getStaticPaths = (() =>
	SNAKE_MODES.map((mode) => ({ params: { mode: mode.replace(':', '-') }, props: { mode } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => Response.json({ mode: props.mode, top: snakeTop(props.mode), login: null });
