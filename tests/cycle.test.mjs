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

describe('Copias literales entre cuentas', () => {
	test('collapseCopies junta textos iguales salvo mayúsculas, tildes y signos', async () => {
		const { collapseCopies } = await import('../src/lib/process-cycle.ts');
		const { unique, copiesOf } = collapseCopies([
			{ id: 1, body: 'Crea una herramienta de gráficos.' },
			{ id: 2, body: 'Otra idea distinta' },
			{ id: 3, body: 'crea una  herramienta de graficos' },
			{ id: 4, body: 'CREA UNA HERRAMIENTA DE GRÁFICOS!!' },
		]);

		assert.deepStrictEqual(unique.map((item) => item.id), [1, 2]);
		assert.deepStrictEqual(copiesOf.get(1), [3, 4]);
		assert.equal(copiesOf.has(2), false);
	});
});
