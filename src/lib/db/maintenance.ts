import type { DatabaseSync } from 'node:sqlite';

/**
 * La limpieza de la base. Lo que la gente comparte caduca o tiene tope, y aquí
 * se barre: cada minuto lo caducado y lo que pasa del tope, y cada diez se
 * compacta el fichero. Todo va por índices y por lotes, así que un barrido no
 * bloquea a la web más que unos milisegundos aunque haya mucho que borrar.
 */

export const SWEEP_MS = 60 * 1000;
export const COMPACT_MS = 10 * 60 * 1000;

/** Filas por DELETE: cada lote es una transacción corta, no una larga. */
const BATCH = 1000;

export const KEEP = {
	/** El IRC es un canal, no un archivo: se queda la conversación reciente. */
	ircMessages: 500,
	commentsPerFeature: 300,
	snakePerMode: 100,
};

/** Tablas que caducan, con su clave: sessions no tiene rowid. */
const EXPIRING = [
	{ table: 'sessions', key: 'id' },
	{ table: 'chat_messages', key: 'id' },
	{ table: 'challenges', key: 'id' },
] as const;

function deleteInBatches(db: DatabaseSync, sql: string, ...params: (string | number)[]) {
	const statement = db.prepare(sql);
	let total = 0;
	for (;;) {
		const { changes } = statement.run(...params);
		total += Number(changes);
		if (Number(changes) < BATCH) return total;
	}
}

/** Borra lo caducado y lo que pasa de los topes. Devuelve cuánto borró de cada cosa. */
export function sweep(db: DatabaseSync, now = Date.now()) {
	const removed: Record<string, number> = {};

	for (const { table, key } of EXPIRING) {
		removed[table] = deleteInBatches(
			db,
			`DELETE FROM ${table} WHERE ${key} IN (
				SELECT ${key} FROM ${table} WHERE expires_at <= ? LIMIT ${BATCH}
			)`,
			now,
		);
	}

	// Todo lo anterior al mensaje número 500 empezando por el final. Si no hay
	// tantos, la subconsulta da NULL y no se borra nada.
	removed.ircOverflow = Number(
		db
			.prepare(
				`DELETE FROM chat_messages WHERE room = 'irc' AND id < (
					SELECT id FROM chat_messages WHERE room = 'irc' ORDER BY id DESC LIMIT 1 OFFSET ?
				)`,
			)
			.run(KEEP.ircMessages - 1).changes,
	);

	removed.commentsOverflow = 0;
	const crowded = db
		.prepare('SELECT feature_id AS id FROM highlight_comments GROUP BY feature_id HAVING count(*) > ?')
		.all(KEEP.commentsPerFeature) as { id: number }[];
	const trimComments = db.prepare(
		`DELETE FROM highlight_comments WHERE feature_id = ? AND id < (
			SELECT id FROM highlight_comments WHERE feature_id = ? ORDER BY id DESC LIMIT 1 OFFSET ?
		)`,
	);
	for (const { id } of crowded) {
		removed.commentsOverflow += Number(trimComments.run(id, id, KEEP.commentsPerFeature - 1).changes);
	}

	removed.snakeOverflow = 0;
	const busyModes = db
		.prepare('SELECT mode FROM snake_scores GROUP BY mode HAVING count(*) > ?')
		.all(KEEP.snakePerMode) as { mode: string }[];
	const trimSnake = db.prepare(
		`DELETE FROM snake_scores WHERE mode = ? AND user_id NOT IN (
			SELECT user_id FROM snake_scores WHERE mode = ? ORDER BY points DESC, created_at LIMIT ?
		)`,
	);
	for (const { mode } of busyModes) {
		removed.snakeOverflow += Number(trimSnake.run(mode, mode, KEEP.snakePerMode).changes);
	}

	return removed;
}

/**
 * Deja el fichero pequeño: refresca las estadísticas con las que SQLite elige
 * índice, devuelve al disco las páginas que quedaron libres y vuelca el WAL a
 * la base, truncándolo.
 */
export function compact(db: DatabaseSync) {
	// El checkpoint va el último: optimize y el vacuum también escriben, y lo
	// que escriban tiene que salir del WAL en esta misma pasada.
	db.exec('PRAGMA optimize');
	db.exec('PRAGMA incremental_vacuum(1000)');
	db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
}

let started = false;

/** Arranca los relojes una vez por proceso. No retienen el proceso vivo. */
export function startMaintenance(db: DatabaseSync) {
	if (started) return;
	started = true;

	const guarded = (label: string, job: () => unknown) => () => {
		try {
			job();
		} catch (error) {
			// Un SQLITE_BUSY aquí no es grave: el siguiente barrido lo recoge.
			console.error(`[db] ${label} falló:`, error instanceof Error ? error.message : error);
		}
	};

	const doSweep = guarded('barrido', () => sweep(db));
	const doCompact = guarded('compactado', () => compact(db));

	// Uno al arrancar, para no heredar lo que caducó mientras la web estaba parada.
	doSweep();
	setInterval(doSweep, SWEEP_MS).unref();
	setInterval(doCompact, COMPACT_MS).unref();
}
