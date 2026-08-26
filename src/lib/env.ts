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

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/**
 * El origen que se le enseña a GitHub como redirect_uri. Manda SITE_URL, porque
 * el origen de la petición sale de la cabecera Host y esa la pone quien llama.
 *
 * Solo en local se usa el de la petición, y hace falta que LAS DOS cosas sean
 * locales: si SITE_URL se queda sin poner en producción, el fallback es
 * localhost y sin esta segunda condición cualquiera podría fijar el Host y
 * llevarse el redirect_uri a su dominio.
 */
export function publicOrigin(requestUrl: URL) {
	const site = getSiteUrl();

	let siteHost = '';
	try {
		siteHost = new URL(site).hostname;
	} catch {
		return site;
	}

	if (!LOCAL_HOSTS.has(siteHost)) return site;
	return LOCAL_HOSTS.has(requestUrl.hostname) ? requestUrl.origin : site;
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
