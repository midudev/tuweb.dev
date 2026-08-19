import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ session, redirect }) => {
	await session?.destroy();
	return redirect('/');
};
