import type { APIRoute } from 'astro';
import { exchangeGithubCode, toSessionUser, upsertGithubUser } from '../../../lib/auth';

export const GET: APIRoute = async ({ url, request, cookies, session, redirect }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const stored = cookies.get('github_oauth_state')?.value;
	cookies.delete('github_oauth_state', { path: '/' });

	if (!code || !state || !stored || state !== stored) {
		return redirect('/?error=auth');
	}

	try {
		const profile = await exchangeGithubCode(code, new URL(request.url));
		const user = await upsertGithubUser(profile);
		if (!session) {
			return redirect('/?error=auth');
		}
		await session.regenerate();
		await session.set('user', toSessionUser(user));
		return redirect('/?ok=login');
	} catch (error) {
		console.error('GitHub OAuth falló', error);
		return redirect('/?error=auth');
	}
};
