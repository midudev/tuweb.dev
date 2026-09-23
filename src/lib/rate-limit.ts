/**
 * Freno por ritmo, en memoria. La web es un solo proceso (pm2 en modo fork),
 * así que no hace falta nada compartido. Ventana deslizante por clave.
 */
const hits = new Map<string, number[]>();

/** Por encima de esto se tiran las claves que ya no tienen golpes recientes. */
const PRUNE_AT = 5000;
const LONGEST_WINDOW_MS = 60 * 60 * 1000;

export function allow(key: string, limit: number, windowMs: number, now = Date.now()) {
	const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
	if (recent.length >= limit) {
		hits.set(key, recent);
		return false;
	}
	recent.push(now);
	hits.set(key, recent);

	if (hits.size > PRUNE_AT) {
		for (const [other, times] of hits) {
			if (times.every((at) => now - at >= LONGEST_WINDOW_MS)) hits.delete(other);
		}
	}
	return true;
}

/** Varios frenos a la vez: pasa solo si pasa todos (y solo entonces cuenta). */
export function allowAll(rules: { key: string; limit: number; windowMs: number }[], now = Date.now()) {
	const blocked = rules.some(({ key, limit, windowMs }) => {
		const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
		return recent.length >= limit;
	});
	if (blocked) return false;
	for (const { key, limit, windowMs } of rules) allow(key, limit, windowMs, now);
	return true;
}

/** Solo para los tests. */
export function resetRateLimits() {
	hits.clear();
}
