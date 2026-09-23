/**
 * Quién está mirando cada sala, en memoria: quien pregunta en los últimos
 * veinte segundos cuenta como presente. No se guarda nada en la base.
 */
const SEEN_MS = 20 * 1000;
const rooms = new Map<string, Map<string, number>>();

export function touch(room: string, who: string, now = Date.now()) {
	let seen = rooms.get(room);
	if (!seen) {
		seen = new Map();
		rooms.set(room, seen);
	}
	seen.set(who, now);
	for (const [key, at] of seen) {
		if (now - at > SEEN_MS) seen.delete(key);
	}
	return seen.size;
}
