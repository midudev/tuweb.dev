import type { APIRoute, GetStaticPaths } from 'astro';

// El chat no se congela: el canal guardaba el día y el anónimo diez minutos,
// y lo que se escribió para borrarse no se queda publicado para siempre.
export const getStaticPaths = (() => [{ params: { room: 'irc' } }, { params: { room: 'anon' } }]) satisfies GetStaticPaths;

export const GET: APIRoute = () => Response.json({ messages: [], online: 0, login: null });
