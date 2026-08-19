import type { APIContext } from 'astro';
import { get, nowIso } from './db/client';
import type { User } from './db/schema';
import { getGithubConfig } from './env';

export type SessionUser = {
	id: number;
	githubId: number;
	login: string;
	name: string | null;
	avatarUrl: string;
};

export function toSessionUser(user: User): SessionUser {
	return {
		id: user.id,
		githubId: user.githubId,
		login: user.login,
		name: user.name,
		avatarUrl: user.avatarUrl,
	};
}

export async function getSessionUser(context: APIContext | { session?: APIContext['session'] }) {
	return (await context.session?.get('user')) ?? null;
}

export function createGithubAuthorizeUrl(state: string, requestUrl: URL) {
	const { clientId, redirectUri, configured } = getGithubConfig(requestUrl);
	if (!configured) {
		throw new Error('GitHub OAuth no está configurado');
	}

	const url = new URL('https://github.com/login/oauth/authorize');
	url.searchParams.set('client_id', clientId);
	url.searchParams.set('redirect_uri', redirectUri);
	url.searchParams.set('state', state);
	url.searchParams.set('allow_signup', 'true');
	return url;
}

export async function exchangeGithubCode(code: string, requestUrl: URL) {
	const { clientId, clientSecret, redirectUri } = getGithubConfig(requestUrl);

	const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri,
		}),
	});

	if (!tokenResponse.ok) {
		throw new Error('No se pudo intercambiar el código de GitHub');
	}

	const tokenPayload = (await tokenResponse.json()) as {
		access_token?: string;
		error?: string;
	};

	if (!tokenPayload.access_token) {
		throw new Error(tokenPayload.error || 'GitHub no devolvió un token');
	}

	const profileResponse = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${tokenPayload.access_token}`,
			Accept: 'application/vnd.github+json',
			'User-Agent': 'tuweb.dev',
		},
	});

	if (!profileResponse.ok) {
		throw new Error('No se pudo leer el perfil de GitHub');
	}

	const profile = (await profileResponse.json()) as {
		id: number;
		login: string;
		name: string | null;
		avatar_url: string;
	};

	return profile;
}

export function upsertGithubUser(profile: {
	id: number;
	login: string;
	name: string | null;
	avatar_url: string;
}) {
	const user = get<User>(
		`INSERT INTO users (github_id, login, name, avatar_url, created_at)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(github_id) DO UPDATE SET
			login = excluded.login,
			name = excluded.name,
			avatar_url = excluded.avatar_url
		 RETURNING id, github_id AS githubId, login, name, avatar_url AS avatarUrl, created_at AS createdAt`,
		profile.id,
		profile.login,
		profile.name,
		profile.avatar_url,
		nowIso(),
	);

	if (!user) throw new Error('No se pudo guardar el usuario de GitHub');
	return user;
}

export function randomOAuthState() {
	return Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('base64url');
}
