function read(name: string, fallback = '') {
	const fromProcess = process.env[name];
	if (fromProcess !== undefined && fromProcess !== '') {
		return fromProcess;
	}

	const env = typeof import.meta.env === 'object' && import.meta.env ? import.meta.env : undefined;
	const fromAstro = env ? env[name] : undefined;
	if (fromAstro !== undefined && fromAstro !== '') {
		return String(fromAstro);
	}

	return fallback;
}

export function getSiteUrl() {
	return read('SITE_URL', 'http://localhost:4321').replace(/\/$/, '');
}

export function publicOrigin(requestUrl: URL) {
	const site = getSiteUrl();
	const isLocalSite = site.includes('localhost') || site.includes('127.0.0.1');
	if (!isLocalSite) return site;
	return requestUrl.origin;
}

export function getGithubConfig(requestUrl?: URL) {
	const clientId = read('GITHUB_CLIENT_ID');
	const clientSecret = read('GITHUB_CLIENT_SECRET');
	const origin = requestUrl ? publicOrigin(requestUrl) : getSiteUrl();
	const redirectUri = read('GITHUB_REDIRECT_URI') || `${origin}/api/auth/callback`;

	return {
		clientId,
		clientSecret,
		redirectUri,
		configured: Boolean(clientId && clientSecret),
	};
}

/** SQLite en el propio disco. Nada de servicios de base de datos fuera. */
export function getDatabaseUrl() {
	const raw = read('DATABASE_URL', 'file:local.db');
	return raw.startsWith('file:') ? raw : `file:${raw}`;
}

export function getCronSecret() {
	return read('CRON_SECRET');
}

export function getLlmConfig() {
	const apiKey = read('OPENAI_API_KEY');
	return {
		apiKey,
		baseUrl: read('OPENAI_BASE_URL', 'https://api.openai.com').replace(/\/$/, ''),
		model: read('OPENAI_MODEL', 'gpt-5.6-luna'),
		configured: Boolean(apiKey),
	};
}
