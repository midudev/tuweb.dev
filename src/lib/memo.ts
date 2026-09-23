/**
 * Resultados que valen unos segundos. Las páginas de números (ranking,
 * créditos, historial...) recalculaban todo en cada visita aunque nada hubiera
 * cambiado; con mucho tráfico, eso es el mismo trabajo cientos de veces por
 * minuto. Lo guardado se comparte entre peticiones: quien lo use no lo toca.
 */
const TTL_MS = 5000;
const MAX_ENTRIES = 500;

const entries = new Map<string, { at: number; value: unknown }>();

export function memo<T>(key: string, compute: () => T, ttlMs = TTL_MS): T {
	const now = Date.now();
	const hit = entries.get(key);
	if (hit && now - hit.at < ttlMs) return hit.value as T;

	const value = compute();
	entries.set(key, { at: now, value });

	// Cada usuario con sesión tiene su clave: que no se acumulen las viejas.
	if (entries.size > MAX_ENTRIES) {
		for (const [other, entry] of entries) {
			if (now - entry.at >= ttlMs) entries.delete(other);
		}
	}
	return value;
}
