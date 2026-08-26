import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const TEST_DB = 'file:test_concurrency.db';
process.env.DATABASE_URL = TEST_DB;

// Import database client and queries after setting DATABASE_URL
const { getDb, run, get } = await import('../src/lib/db/client.ts');
const { claimEdit, createPrompt, MAX_EDITS } = await import('../src/lib/db/queries.ts');

function getOrCreateTestUser(githubId = 99999, login = 'testuser') {
	const now = new Date().toISOString();
	run(
		`INSERT INTO users (github_id, login, name, avatar_url, created_at)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(github_id) DO UPDATE SET login = excluded.login`,
		githubId,
		login,
		'Test User',
		'https://example.com/avatar.png',
		now
	);
	const user = get('SELECT id FROM users WHERE github_id = ?', githubId);
	return user.id;
}

describe('Prompts Concurrency & Quota Enforcement', () => {
	test('claimEdit should atomically increment edits up to MAX_EDITS', () => {
		const userId = getOrCreateTestUser(90001, 'user_claim_single');
		const created = createPrompt(userId, 'Esta es una idea valida con mas de 16 caracteres.', { keep: true });
		assert.ok(created?.id, 'Prompt should be created successfully');

		const promptId = created.id;

		// Claim edit 1
		const res1 = claimEdit(promptId);
		assert.notEqual(res1, null);
		assert.equal(res1.edits, 1);

		// Claim edit 2
		const res2 = claimEdit(promptId);
		assert.notEqual(res2, null);
		assert.equal(res2.edits, 2);

		// Claim edit 3 (MAX_EDITS = 3)
		const res3 = claimEdit(promptId);
		assert.notEqual(res3, null);
		assert.equal(res3.edits, 3);

		// Claim edit 4 (Should fail because MAX_EDITS reached)
		const res4 = claimEdit(promptId);
		assert.equal(res4, null, 'claimEdit should return null once MAX_EDITS limit is reached');
	});

	test('concurrent claimEdit calls should strictly enforce quota limit under race conditions', async () => {
		const userId = getOrCreateTestUser(90002, 'user_claim_concurrent');
		const created = createPrompt(userId, 'Otra idea de prueba suficientemente larga para el check.', { keep: true });
		assert.ok(created?.id);
		const promptId = created.id;

		// Fire 10 simultaneous claimEdit requests
		const promises = Array.from({ length: 10 }, () =>
			Promise.resolve().then(() => claimEdit(promptId))
		);

		const results = await Promise.all(promises);
		const successfulClaims = results.filter((res) => res !== null);

		// Exactly MAX_EDITS (3) claims must succeed
		assert.equal(successfulClaims.length, MAX_EDITS, `Only ${MAX_EDITS} concurrent claims should succeed`);

		// Verify final database state
		const finalRow = get('SELECT edits FROM prompts WHERE id = ?', promptId);
		assert.equal(finalRow.edits, MAX_EDITS);
	});
});
