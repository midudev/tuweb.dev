import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { getDatabaseUrl } from '../env';
import { startMaintenance } from './maintenance';
import { INDEXES, TABLES } from './schema';
import { SESSION_TTL_MS } from './session-ttl';

type Value = null | number | string | bigint | Uint8Array;

let db: DatabaseSync | null = null;

/** node:sqlite solo acepta estos tipos como parámetros. */
function toValue(value: unknown): Value {
	if (value === undefined || value === null) return null;
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (value instanceof Date) return value.toISOString();
	return value as Value;
}

function open() {
	const sqlite = new DatabaseSync(getDatabaseUrl().replace(/^file:/, ''));

	// WAL deja leer mientras se escribe, y el timeout evita el SQLITE_BUSY
	// cuando la web y el cron coinciden.
	sqlite.exec('PRAGMA journal_mode = WAL');
	sqlite.exec('PRAGMA busy_timeout = 5000');
	sqlite.exec('PRAGMA synchronous = NORMAL');
	sqlite.exec('PRAGMA foreign_keys = ON');
	// El WAL se trunca a 4 MB como mucho tras cada checkpoint: antes crecía y no
	// volvía a encoger (llegó a pesar seis veces la base).
	sqlite.exec('PRAGMA journal_size_limit = 4194304');
	sqlite.exec('PRAGMA temp_store = MEMORY');
	sqlite.exec('PRAGMA cache_size = -8000');
	sqlite.exec('PRAGMA mmap_size = 67108864');
	enableIncrementalVacuum(sqlite);

	for (const statement of TABLES) {
		sqlite.exec(statement);
	}

	migrateReleaseStatuses(sqlite);
	migratePromptEdits(sqlite);

	// Antes existía la regla de una idea por ventana solo en el código, así que
	// una base de datos vieja puede traer dos pendientes del mismo usuario. Sin
	// esto, el índice único no se puede crear y la web no arranca.
	sqlite.exec(`UPDATE prompts SET status = 'discarded', discard_reason = 'duplicate'
		WHERE status = 'pending'
		AND id NOT IN (SELECT max(id) FROM prompts WHERE status = 'pending' GROUP BY user_id)`);

	for (const statement of INDEXES) {
		sqlite.exec(statement);
	}

	seed(sqlite);
	importFileSessions(sqlite);
	// Estadísticas frescas para el planificador sin recorrer tablas enteras.
	sqlite.exec('PRAGMA optimize = 0x10002');
	startMaintenance(sqlite);
	return sqlite;
}

/**
 * Sin auto_vacuum, lo que se borra deja páginas libres dentro del fichero y
 * este no encoge nunca. El modo incremental deja devolverlas poco a poco
 * (maintenance.ts). Cambiarlo exige un VACUUM, una sola vez.
 */
function enableIncrementalVacuum(sqlite: DatabaseSync) {
	const { auto_vacuum: mode } = sqlite.prepare('PRAGMA auto_vacuum').get() as { auto_vacuum: number };
	if (mode === 2) return;
	sqlite.exec('PRAGMA auto_vacuum = INCREMENTAL');
	sqlite.exec('VACUUM');
}

/**
 * Las sesiones vivían como ficheros en node_modules/.astro/sessions. Se pasan a
 * la tabla una vez, para que nadie tenga que volver a entrar con GitHub.
 */
function importFileSessions(sqlite: DatabaseSync) {
	const dir = join(process.cwd(), 'node_modules', '.astro', 'sessions');
	if (!existsSync(dir)) return;

	const { n } = sqlite.prepare('SELECT count(*) AS n FROM sessions').get() as { n: number };
	if (n > 0) return;

	const insert = sqlite.prepare('INSERT OR IGNORE INTO sessions (id, value, expires_at) VALUES (?, ?, ?)');
	sqlite.exec('BEGIN');
	try {
		for (const name of readdirSync(dir)) {
			const path = join(dir, name);
			const stats = statSync(path);
			if (!stats.isFile() || stats.size > 4096) continue;
			// Caducan contando desde la última vez que se tocaron, como si
			// siempre hubieran tenido caducidad.
			const expiresAt = stats.mtimeMs + SESSION_TTL_MS;
			if (expiresAt <= Date.now()) continue;
			insert.run(name, readFileSync(path, 'utf8'), Math.round(expiresAt));
		}
		sqlite.exec('COMMIT');
	} catch (error) {
		sqlite.exec('ROLLBACK');
		console.error('[db] no se pudieron importar las sesiones:', error);
	}
}

/**
 * CREATE TABLE IF NOT EXISTS no cambia una tabla que ya existe, así que una base
 * de datos creada antes de que existiera 'repairing' rechazaría ese estado con
 * un CHECK y el cron se quedaría sin poder contar que está arreglando algo.
 * Se rehace la tabla conservando las filas.
 */
function migrateReleaseStatuses(sqlite: DatabaseSync) {
	const table = sqlite
		.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'releases'")
		.get() as { sql: string } | undefined;

	if (!table || table.sql.includes("'repairing'")) return;

	// Nada apunta a releases, así que la copia no rompe ninguna clave foránea.
	sqlite.exec('PRAGMA foreign_keys = OFF');
	sqlite.exec('BEGIN');
	try {
		sqlite.exec(`CREATE TABLE releases_nuevo (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			feature_id INTEGER REFERENCES features(id) ON DELETE SET NULL,
			commit_sha TEXT NOT NULL,
			previous_sha TEXT,
			status TEXT NOT NULL DEFAULT 'live'
				CHECK (status IN ('building', 'repairing', 'live', 'rolled_back', 'failed')),
			error TEXT,
			created_at TEXT NOT NULL
		)`);
		sqlite.exec(`INSERT INTO releases_nuevo (id, feature_id, commit_sha, previous_sha, status, error, created_at)
			SELECT id, feature_id, commit_sha, previous_sha, status, error, created_at FROM releases`);
		sqlite.exec('DROP TABLE releases');
		sqlite.exec('ALTER TABLE releases_nuevo RENAME TO releases');
		sqlite.exec('COMMIT');
	} catch (error) {
		sqlite.exec('ROLLBACK');
		throw error;
	} finally {
		sqlite.exec('PRAGMA foreign_keys = ON');
	}
}

/**
 * La columna de cambios llegó después: en una base ya creada hay que añadirla a
 * mano, porque CREATE TABLE IF NOT EXISTS se encuentra la tabla y no hace nada.
 */
function migratePromptEdits(sqlite: DatabaseSync) {
	const columnas = sqlite.prepare('PRAGMA table_info(prompts)').all() as { name: string }[];
	if (columnas.some((columna) => columna.name === 'edits')) return;

	sqlite.exec('ALTER TABLE prompts ADD COLUMN edits INTEGER NOT NULL DEFAULT 0');
}

export function getDb() {
	db ??= open();
	return db;
}

/**
 * Las consultas son siempre las mismas cadenas: se preparan una vez y se
 * reutilizan. Compilar el SQL en cada petición era trabajo tirado, y el chat
 * pregunta cada pocos segundos.
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

export function run(sql: string, ...params: unknown[]) {
	return prepared(sql).run(...params.map(toValue));
}

/** Varias escrituras como una sola: o entran todas o ninguna. */
export function transaction<T>(work: () => T): T {
	const db = getDb();
	db.exec('BEGIN IMMEDIATE');
	try {
		const result = work();
		db.exec('COMMIT');
		return result;
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	}
}

export function nowIso() {
	return new Date().toISOString();
}

const SAMPLE_AUTHORS = [
	{ githubId: 91001, login: 'ina', name: 'Ina' },
	{ githubId: 91002, login: 'hugo', name: 'Hugo' },
	{ githubId: 91003, login: 'noa', name: 'Noa' },
	{ githubId: 91004, login: 'leo', name: 'Leo' },
	{ githubId: 91005, login: 'sam', name: 'Sam' },
];

const SAMPLE_IDEAS = [
	{ author: 'ina', body: 'Un botón para copiar el enlace de esta página.' },
	{ author: 'hugo', body: 'Que se pueda dejar una canción del día, sin tener que entrar.' },
	{ author: 'noa', body: 'Un tamaño de letra más grande para leer mejor en el móvil.' },
	{ author: 'leo', body: 'Mostrar cuánto falta para elegir la siguiente idea.' },
	{ author: 'sam', body: 'Una lista de enlaces útiles que pueda aportar la gente.' },
];

/** Contenido inicial, solo la primera vez que se abre la base de datos. */
function seed(sqlite: DatabaseSync) {
	// La marca va antes de sembrar: sin ella, borrar las ideas de ejemplo no
	// servía de nada porque el siguiente arranque las volvía a meter.
	const { user_version: sembrada } = sqlite.prepare('PRAGMA user_version').get() as {
		user_version: number;
	};
	if (sembrada >= 1) return;
	sqlite.exec('PRAGMA user_version = 1');

	// Una base con funcionalidades ya ha vivido: no le metemos contenido de
	// ejemplo por mucho que se hayan borrado las ideas.
	const features = sqlite.prepare('SELECT count(*) AS n FROM features').get() as { n: number };
	if (features.n > 0) return;

	const now = new Date().toISOString();

	{
		const insert = sqlite.prepare(
			'INSERT INTO features (title, summary, status, created_at, shipped_at) VALUES (?, ?, ?, ?, ?)',
		);
		insert.run(
			'La web se itera en público',
			'Cualquiera con GitHub puede proponer el siguiente cambio. Un proceso automático agrupa, filtra y elige.',
			'shipped',
			now,
			now,
		);
		insert.run(
			'Caja de herramientas',
			'Utilidades que corren en tu navegador: JSON a YAML, cron en cristiano y probador de regex.',
			'shipped',
			now,
			now,
		);
	}

	const insertUser = sqlite.prepare(
		`INSERT INTO users (github_id, login, name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(github_id) DO UPDATE SET login = excluded.login
		 RETURNING id`,
	);
	const idByLogin = new Map<string, number>();
	for (const author of SAMPLE_AUTHORS) {
		const row = insertUser.get(
			author.githubId,
			author.login,
			author.name,
			`https://avatars.githubusercontent.com/u/${author.githubId}?v=4`,
			now,
		) as { id: number };
		idByLogin.set(author.login, row.id);
	}

	const insertPrompt = sqlite.prepare(
		"INSERT INTO prompts (user_id, body, status, created_at) VALUES (?, ?, 'pending', ?)",
	);
	for (const idea of SAMPLE_IDEAS) {
		const userId = idByLogin.get(idea.author);
		if (userId) insertPrompt.run(userId, idea.body, now);
	}
}
