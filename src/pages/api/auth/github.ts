import type { APIRoute } from 'astro';
import { createGithubAuthorizeUrl, randomOAuthState, toSessionUser, upsertGithubUser } from '../../../lib/auth';
import { getGithubConfig } from '../../../lib/env';
import { githubUserFromCli } from '../../../lib/github-dev';

export const GET: APIRoute = async (context) => {
	const requestUrl = new URL(context.request.url);

	if (!getGithubConfig(requestUrl).configured) {
		if (!import.meta.env.DEV) {
			return context.redirect('/?error=oauth');
		}

		try {
			const profile = await githubUserFromCli();
			const user = await upsertGithubUser(profile);
			await context.session?.regenerate();
			await context.session?.set('user', toSessionUser(user));
			return context.redirect('/?ok=login');
		} catch (error) {
			console.error('GitHub local (gh) falló', error);
			return context.redirect('/?error=oauth');
		}
	}

	const state = randomOAuthState();
	context.cookies.set('github_oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: import.meta.env.PROD,
		maxAge: 60 * 10,
	});

	return context.redirect(createGithubAuthorizeUrl(state, requestUrl).toString());
};
