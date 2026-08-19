import { timingSafeEqual } from 'node:crypto';
import { getCronSecret } from './env';

/** Compara sin filtrar por tiempo cuántos caracteres acertó quien lo intenta. */
export function matchesCronSecret(request: Request) {
	const secret = getCronSecret();
	if (!secret) return false;

	const header = request.headers.get('authorization') ?? '';
	const expected = Buffer.from(`Bearer ${secret}`);
	const received = Buffer.from(header);

	if (expected.length !== received.length) return false;
	return timingSafeEqual(expected, received);
}
