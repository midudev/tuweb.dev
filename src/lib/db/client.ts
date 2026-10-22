import { DatabaseSync, type StatementSync } from 'node:sqlite';

type Value = null | number | string | bigint | Uint8Array;

let db: DatabaseSync | null = null;

/** node:sqlite solo acepta estos tipos como parámetros. */
function toValue(value: unknown): Value {
	if (value === undefined || value === null) return null;
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (value instanceof Date) return value.toISOString();
	return value as Value;
}

/**
 * El experimento está parado: la web se compila contra una copia de la base de
 * producción y no escribe nada. En solo lectura, cualquier página que intente
 * escribir rompe el build en vez de cambiar la copia sin que nadie se entere.
 * En Cloudflare no hay base: solo lo que sale de aquí, ya hecho HTML y JSON.
 */
const SNAPSHOT = 'data/tuweb.db';

function open() {
	return new DatabaseSync(SNAPSHOT, { readOnly: true });
}

export function getDb() {
	db ??= open();
	return db;
}

/**
 * Las consultas son siempre las mismas cadenas: se preparan una vez y se
 * reutilizan en todas las páginas del build.
 */
const statements = new Map<string, StatementSync>();

function prepared(sql: string) {
	let statement = statements.get(sql);
	if (!statement) {
		statement = getDb().prepare(sql);
		statements.set(sql, statement);
	}
	return statement;
}

export function all<T>(sql: string, ...params: unknown[]): T[] {
	return prepared(sql).all(...params.map(toValue)) as T[];
}

export function get<T>(sql: string, ...params: unknown[]): T | null {
	return (prepared(sql).get(...params.map(toValue)) as T | undefined) ?? null;
}
