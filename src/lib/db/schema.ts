/** Las tablas. Se crean al arrancar si no están. */
export const TABLES = [
	`CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		github_id INTEGER NOT NULL UNIQUE,
		login TEXT NOT NULL,
		name TEXT,
		avatar_url TEXT NOT NULL,
		created_at TEXT NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS prompts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		body TEXT NOT NULL CHECK (length(body) BETWEEN 16 AND 280),
		status TEXT NOT NULL DEFAULT 'pending'
			CHECK (status IN ('pending', 'grouped', 'selected', 'discarded')),
		discard_reason TEXT,
		cluster_id INTEGER REFERENCES clusters(id) ON DELETE SET NULL,
		edits INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS clusters (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		cycle_id INTEGER NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
		title TEXT NOT NULL,
		summary TEXT NOT NULL,
		prompt_count INTEGER NOT NULL DEFAULT 0,
		is_winner INTEGER NOT NULL DEFAULT 0 CHECK (is_winner IN (0, 1))
	)`,
	`CREATE TABLE IF NOT EXISTS cycles (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		processed_at TEXT NOT NULL,
		winner_cluster_id INTEGER,
		winner_title TEXT,
		winner_summary TEXT,
		rationale TEXT,
		discarded_count INTEGER NOT NULL DEFAULT 0,
		considered_count INTEGER NOT NULL DEFAULT 0,
		pending_count INTEGER NOT NULL DEFAULT 0
	)`,
	`CREATE TABLE IF NOT EXISTS features (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		cycle_id INTEGER REFERENCES cycles(id) ON DELETE SET NULL,
		title TEXT NOT NULL,
		summary TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'selected'
			CHECK (status IN ('selected', 'shipped')),
		created_at TEXT NOT NULL,
		shipped_at TEXT
	)`,
	`CREATE TABLE IF NOT EXISTS releases (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		feature_id INTEGER REFERENCES features(id) ON DELETE SET NULL,
		commit_sha TEXT NOT NULL,
		previous_sha TEXT,
		status TEXT NOT NULL DEFAULT 'live'
			CHECK (status IN ('building', 'repairing', 'live', 'rolled_back', 'failed')),
		error TEXT,
		created_at TEXT NOT NULL
	)`,

	// Lo que la gente comparte entre sí. Las fechas van en milisegundos enteros:
	// ocupan menos que el texto ISO y la limpieza compara números, no cadenas.
	// Todo lo que caduca lleva expires_at con su índice, y el barrido borra por
	// ahí sin recorrer la tabla (ver maintenance.ts).

	// Las sesiones de login. Antes eran ficheros sueltos que no caducaban nunca.
	`CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		value TEXT NOT NULL,
		expires_at INTEGER NOT NULL
	) WITHOUT ROWID`,
	// AUTOINCREMENT a propósito: el chat se lee con "dame lo posterior a mi
	// último id", y sin él un id borrado por caducidad podría volver a salir.
	`CREATE TABLE IF NOT EXISTS chat_messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		room TEXT NOT NULL CHECK (room IN ('irc', 'anon')),
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		author TEXT NOT NULL CHECK (length(author) BETWEEN 1 AND 24),
		body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 400),
		created_at INTEGER NOT NULL,
		expires_at INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS highlight_votes (
		feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		created_at INTEGER NOT NULL,
		PRIMARY KEY (feature_id, user_id)
	) WITHOUT ROWID`,
	`CREATE TABLE IF NOT EXISTS highlight_comments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		alias TEXT NOT NULL CHECK (length(alias) BETWEEN 1 AND 24),
		body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 240),
		created_at INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS challenges (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		week INTEGER NOT NULL,
		title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 70),
		detail TEXT NOT NULL CHECK (length(detail) <= 140),
		tema TEXT NOT NULL CHECK (tema IN ('codigo', 'diseno', 'aprender', 'compartir', 'orden')),
		nivel TEXT NOT NULL CHECK (nivel IN ('suave', 'medio', 'duro')),
		created_at INTEGER NOT NULL,
		expires_at INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS tips (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		category TEXT NOT NULL CHECK (length(category) BETWEEN 1 AND 24),
		title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 70),
		detail TEXT NOT NULL CHECK (length(detail) <= 200),
		created_at INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS showcase (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 32),
		url TEXT NOT NULL CHECK (length(url) <= 200 AND (url LIKE 'https://%' OR url LIKE 'http://%')),
		pitch TEXT NOT NULL CHECK (length(pitch) <= 120),
		tag TEXT NOT NULL CHECK (length(tag) BETWEEN 1 AND 16),
		created_at INTEGER NOT NULL
	)`,
	// Solo la mejor puntuación de cada persona en cada modo: la tabla no crece
	// con cada partida, crece con la gente.
	`CREATE TABLE IF NOT EXISTS snake_scores (
		mode TEXT NOT NULL CHECK (length(mode) BETWEEN 1 AND 16),
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		points INTEGER NOT NULL CHECK (points >= 0),
		created_at INTEGER NOT NULL,
		PRIMARY KEY (mode, user_id)
	) WITHOUT ROWID`,
];

/** Los índices. Se crean después de limpiar duplicados. */
export const INDEXES = [
	`CREATE INDEX IF NOT EXISTS prompts_status_created ON prompts (status, created_at)`,
	// La consulta más caliente: "¿este usuario ya escribió en esta ventana?".
	`CREATE INDEX IF NOT EXISTS prompts_user_created ON prompts (user_id, created_at)`,
	`CREATE INDEX IF NOT EXISTS prompts_cluster ON prompts (cluster_id)`,
	`CREATE INDEX IF NOT EXISTS clusters_cycle ON clusters (cycle_id)`,
	`CREATE INDEX IF NOT EXISTS features_status ON features (status)`,
	`CREATE INDEX IF NOT EXISTS releases_status_id ON releases (status, id)`,
	// Cierra la carrera: dos envíos a la vez del mismo usuario ya no cuelan dos ideas.
	`CREATE UNIQUE INDEX IF NOT EXISTS prompts_one_pending_per_user
		ON prompts (user_id) WHERE status = 'pending'`,

	// El barrido de caducados entra por aquí en cada tabla que caduca.
	`CREATE INDEX IF NOT EXISTS sessions_expires ON sessions (expires_at)`,
	`CREATE INDEX IF NOT EXISTS chat_expires ON chat_messages (expires_at)`,
	`CREATE INDEX IF NOT EXISTS challenges_expires ON challenges (expires_at)`,
	// Leer una sala a partir de un id.
	`CREATE INDEX IF NOT EXISTS chat_room_id ON chat_messages (room, id)`,
	`CREATE INDEX IF NOT EXISTS highlight_votes_user ON highlight_votes (user_id)`,
	`CREATE INDEX IF NOT EXISTS highlight_comments_feature ON highlight_comments (feature_id, id)`,
	`CREATE INDEX IF NOT EXISTS challenges_week ON challenges (week, id)`,
	`CREATE INDEX IF NOT EXISTS challenges_user_week ON challenges (user_id, week)`,
	`CREATE INDEX IF NOT EXISTS tips_user ON tips (user_id)`,
	`CREATE INDEX IF NOT EXISTS showcase_user ON showcase (user_id)`,
	// El ranking de cada modo sale ya ordenado del índice, sin ordenar en memoria.
	`CREATE INDEX IF NOT EXISTS snake_mode_points ON snake_scores (mode, points DESC, created_at)`,
];

/** Columnas con el nombre que usa el resto de la web. */
export const FEATURE_COLUMNS =
	'id, cycle_id AS cycleId, title, summary, status, created_at AS createdAt, shipped_at AS shippedAt';
export const RELEASE_COLUMNS =
	'id, feature_id AS featureId, commit_sha AS commitSha, previous_sha AS previousSha, status, error, created_at AS createdAt';

export interface User {
	id: number;
	githubId: number;
	login: string;
	name: string | null;
	avatarUrl: string;
	createdAt: string;
}

export interface Prompt {
	id: number;
	userId: number;
	body: string;
	status: string;
	discardReason: string | null;
	clusterId: number | null;
	/** Veces que su autor la ha cambiado en esta ventana. */
	edits: number;
	createdAt: string;
}

export interface Cycle {
	id: number;
	processedAt: string;
	winnerClusterId: number | null;
	winnerTitle: string | null;
	winnerSummary: string | null;
	rationale: string | null;
	discardedCount: number;
	consideredCount: number;
	pendingCount: number;
}

export interface Feature {
	id: number;
	cycleId: number | null;
	title: string;
	summary: string;
	status: string;
	createdAt: string;
	shippedAt: string | null;
}

export interface Release {
	id: number;
	featureId: number | null;
	commitSha: string;
	previousSha: string | null;
	status: string;
	error: string | null;
	createdAt: string;
}
