import { getSiteUrl } from './env';

/**
 * Defensa CSRF. Los navegadores mandan Origin en los POST entre sitios y
 * Sec-Fetch-Site en todo. Si no llega ninguno de los dos, la petición no sale
 * de un formulario de esta web y no se acepta.
 */
export function sameOrigin(request: Request) {
	const origin = request.headers.get('origin');

	if (origin) {
		try {
			return new URL(origin).hostname === new URL(getSiteUrl()).hostname;
		} catch {
			return false;
		}
	}

	const site = request.headers.get('sec-fetch-site');
	return site === 'same-origin' || site === 'none';
}
