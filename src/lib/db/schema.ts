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
