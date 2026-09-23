import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';

// Base propia y limpia en cada ejecución: si se queda de otra vez, los
// conteos no cuadran.
const FILE = 'test_community.db';
const wipe = () => ['', '-wal', '-shm'].forEach((suffix) => rmSync(FILE + suffix, { force: true }));
wipe();
process.env.DATABASE_URL = `file:${FILE}`;

const { getDb, run, get } = await import('../src/lib/db/client.ts');
const community = await import('../src/lib/db/community.ts');
const { sweep, compact, KEEP } = await import('../src/lib/db/maintenance.ts');
const { default: sqliteSessions } = await import('../src/lib/db/session-driver.ts');

after(() => {
	getDb().close();
	wipe();
});

const NOW = Date.now();
const MINUTE = 60_000;

let nextGithubId = 1;
const ids = new Map();

function user(login) {
	if (!ids.has(login)) ids.set(login, nextGithubId++);
	return get(
		`INSERT INTO users (github_id, login, name, avatar_url, created_at) VALUES (?, ?, ?, '', '')
		 ON CONFLICT (github_id) DO UPDATE SET login = excluded.login RETURNING id`,
		ids.get(login),
		login,
		login,
	).id;
}

function feature() {
	return get(
		"INSERT INTO features (title, summary, status, created_at) VALUES ('t', 's', 'shipped', '') RETURNING id",
	).id;
}

describe('base de datos', () => {
	test('queda en auto_vacuum incremental y con el WAL acotado', () => {
		assert.equal(get('PRAGMA auto_vacuum').auto_vacuum, 2);
		assert.equal(get('PRAGMA journal_size_limit').journal_size_limit, 4194304);
	});

	test('las consultas de lectura entran por índice', () => {
		const plan = (sql, ...params) =>
			getDb()
				.prepare(`EXPLAIN QUERY PLAN ${sql}`)
				.all(...params)
				.map((row) => row.detail)
				.join(' | ');
		assert.match(plan('SELECT id FROM chat_messages WHERE room = ? AND id > ?', 'irc', 0), /USING (COVERING )?INDEX chat_room_id/);
		assert.match(plan('SELECT id FROM chat_messages WHERE expires_at <= ?', NOW), /USING (COVERING )?INDEX chat_expires/);
		assert.match(plan('SELECT id FROM sessions WHERE expires_at <= ?', NOW), /USING (COVERING )?INDEX sessions_expires/);
		assert.match(plan('SELECT user_id FROM snake_scores WHERE mode = ? ORDER BY points DESC, created_at', 'x'), /INDEX snake_mode_points/);
		assert.doesNotMatch(plan('SELECT user_id FROM snake_scores WHERE mode = ? ORDER BY points DESC, created_at', 'x'), /TEMP B-TREE/);
	});
});

describe('chat', () => {
	test('se lee a partir del último id y lo anónimo caduca a los diez minutos', () => {
		const a = community.postChat('anon', null, 'a1', 'hola', NOW);
		const b = community.postChat('anon', null, 'a2', 'qué tal', NOW + 1);
		assert.deepEqual(community.chatSince('anon', a.id, NOW + 2).map((m) => m.id), [b.id]);

		sweep(getDb(), NOW + 10 * MINUTE + 5);
		assert.equal(community.chatSince('anon', 0, NOW + 10 * MINUTE + 5).length, 0);
		assert.equal(get("SELECT count(*) AS n FROM chat_messages WHERE room = 'anon'").n, 0);
	});

	test('el IRC se queda con los últimos 500 mensajes', () => {
		const alice = user('alice');
		getDb().exec('BEGIN');
		for (let i = 0; i < KEEP.ircMessages + 50; i += 1) community.postChat('irc', alice, 'alice', `m${i}`, NOW);
		getDb().exec('COMMIT');

		sweep(getDb(), NOW);
		const rows = get("SELECT count(*) AS n, min(body) AS first FROM chat_messages WHERE room = 'irc'");
		assert.equal(rows.n, KEEP.ircMessages);
		assert.equal(community.chatSince('irc', 0, NOW).at(-1).body, `m${KEEP.ircMessages + 49}`);
	});
});

describe('destacadas', () => {
	test('el voto se pone y se quita, uno por persona', () => {
		const idea = feature();
		const bob = user('bob');
		assert.deepEqual(community.toggleHighlightVote(idea, bob), { voted: true, votes: 1 });
		assert.deepEqual(community.toggleHighlightVote(idea, bob), { voted: false, votes: 0 });
		community.toggleHighlightVote(idea, bob);
		assert.deepEqual(community.myHighlightVotes(bob), [idea]);
		assert.equal(community.highlightCounts().votes[idea], 1);
	});

	test('cada idea guarda como mucho 300 comentarios, los más nuevos', () => {
		const idea = feature();
		const carol = user('carol');
		getDb().exec('BEGIN');
		for (let i = 0; i < KEEP.commentsPerFeature + 20; i += 1) community.addHighlightComment(idea, carol, 'c', `c${i}`, NOW + i);
		getDb().exec('COMMIT');

		sweep(getDb(), NOW);
		const comments = community.highlightComments(idea, carol);
		assert.equal(comments.length, KEEP.commentsPerFeature);
		assert.equal(comments[0].text, `c${KEEP.commentsPerFeature + 19}`);
		assert.equal(comments[0].mine, true);
		assert.equal(community.deleteHighlightComment(comments[0].id, user('dave')), false);
	});
});

describe('snake', () => {
	test('solo guarda la marca si mejora, y el ranking sale ordenado', () => {
		const erin = user('erin');
		const frank = user('frank');
		assert.equal(community.submitSnakeScore('paredes:normal', erin, 30, NOW).improved, true);
		assert.equal(community.submitSnakeScore('paredes:normal', erin, 10, NOW).improved, false);
		community.submitSnakeScore('paredes:normal', frank, 50, NOW);
		assert.deepEqual(
			community.snakeTop('paredes:normal', erin).map((s) => [s.name, s.points, s.mine]),
			[
				['frank', 50, false],
				['erin', 30, true],
			],
		);
	});

	test('cada modo se queda con los 100 mejores', () => {
		getDb().exec('BEGIN');
		for (let i = 0; i < KEEP.snakePerMode + 10; i += 1) {
			community.submitSnakeScore('tunel:calma', user(`p${i}`), i + 1, NOW);
		}
		getDb().exec('COMMIT');
		sweep(getDb(), NOW);
		const left = get("SELECT count(*) AS n, min(points) AS low FROM snake_scores WHERE mode = 'tunel:calma'");
		assert.deepEqual([left.n, left.low], [KEEP.snakePerMode, 11]);
	});
});

describe('retos', () => {
	test('caducan cuando pasa su fecha', () => {
		const gina = user('gina');
		community.addReto(gina, 42, { title: 'Un reto', detail: '', tema: 'codigo', nivel: 'suave' }, NOW + MINUTE, NOW);
		assert.equal(community.countRetos(42), 1);
		assert.equal(community.countRetos(42, gina), 1);
		sweep(getDb(), NOW + MINUTE);
		assert.equal(community.countRetos(42), 0);
	});
});

describe('sesiones', () => {
	test('se guardan, se leen y lo caducado ni se lee ni se queda', () => {
		const driver = sqliteSessions();
		driver.setItem('s1', '{"user":1}');
		assert.equal(driver.getItem('s1'), '{"user":1}');
		assert.equal(driver.hasItem('s1'), true);

		run('UPDATE sessions SET expires_at = ? WHERE id = ?', NOW - 1, 's1');
		assert.equal(driver.getItem('s1'), null);
		sweep(getDb(), NOW);
		assert.equal(get("SELECT count(*) AS n FROM sessions WHERE id = 's1'").n, 0);
	});

	test('compactar deja el WAL vacío', () => {
		compact(getDb());
		const { log } = getDb().prepare('PRAGMA wal_checkpoint(PASSIVE)').get();
		assert.equal(log, 0);
	});
});
