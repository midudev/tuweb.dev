import { all, get, run } from './client';
import { SESSION_TTL_MS } from './session-ttl';

/**
 * Driver de sesiones de Astro sobre la misma SQLite. Cada escritura renueva la
 * caducidad; lo caducado no se lee y el barrido de maintenance.ts lo borra.
 */
export default function sqliteSessions() {
	return {
		name: 'sqlite',
		hasItem(key: string) {
			return get('SELECT 1 AS ok FROM sessions WHERE id = ? AND expires_at > ?', key, Date.now()) !== null;
		},
		getItem(key: string) {
			return (
				get<{ value: string }>('SELECT value FROM sessions WHERE id = ? AND expires_at > ?', key, Date.now())
					?.value ?? null
			);
		},
		setItem(key: string, value: string) {
			run(
				`INSERT INTO sessions (id, value, expires_at) VALUES (?, ?, ?)
				 ON CONFLICT (id) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at`,
				key,
				typeof value === 'string' ? value : JSON.stringify(value),
				Date.now() + SESSION_TTL_MS,
			);
		},
		removeItem(key: string) {
			run('DELETE FROM sessions WHERE id = ?', key);
		},
		getKeys() {
			return all<{ id: string }>('SELECT id FROM sessions WHERE expires_at > ?', Date.now()).map((row) => row.id);
		},
		clear() {
			run('DELETE FROM sessions');
		},
	};
}
