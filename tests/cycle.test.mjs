import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const TEST_DB = 'file:test_cycle_concurrency.db';
process.env.DATABASE_URL = TEST_DB;

const { processCycle } = await import('../src/lib/process-cycle.ts');

describe('Process Cycle Execution Concurrency', () => {
	test('processCycle should reuse single running promise when called concurrently', async () => {
		const p1 = processCycle();
		const p2 = processCycle();

		assert.strictEqual(p1, p2, 'Concurrent processCycle invocations must return the exact same Promise instance');

		const res1 = await p1;
		const res2 = await p2;

		assert.deepStrictEqual(res1, res2);
	});
});
