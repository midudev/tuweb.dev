import { execSync } from 'node:child_process';
import { readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PORT = process.env.PORT || '4321';
const BASE = (process.env.HEALTH_URL || process.env.SITE_URL || `http://127.0.0.1:${PORT}`).replace(/\/$/, '');
const SECRET = process.env.CRON_SECRET;
const RESTART_CMD = process.env.RESTART_CMD || 'sudo systemctl restart tuweb';
const INSTALL_CMD = process.env.INSTALL_CMD || 'pnpm install --frozen-lockfile';
const BUILD_CMD = process.env.BUILD_CMD || 'pnpm build';

export const SHA_RE = /^[0-9a-f]{7,40}$/i;

export function log(message) {
	console.log(`[release] ${message}`);
}

export function run(command) {
	log(`$ ${command}`);
	execSync(command, { stdio: 'inherit' });
}

/**
 * Como run(), pero se queda con la salida además de escribirla. Cuando el build
 * peta, ese texto es justo lo que la IA necesita leer para arreglar lo suyo.
 */
export function runCapturing(command) {
	log(`$ ${command}`);
	try {
		const output = execSync(command, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
		process.stdout.write(output);
		return output;
	} catch (error) {
		error.details = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
		process.stdout.write(`${error.details}\n`);
		throw error;
	}
}

export function currentSha() {
	return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
}

export function buildAndRestart() {
	runCapturing(INSTALL_CMD);
	runCapturing(BUILD_CMD);
	// El reinicio va con la salida en directo: aquí ya no hay nada que arreglar.
	run(RESTART_CMD);
}

// Los dos sitios donde Astro escribe ficheros con hash en el nombre. El resto
// de dist/ conserva sus nombres y se sobrescribe en cada build.
const HASHED_DIRS = ['dist/server/chunks', 'dist/client/_astro'];

/**
 * Tira los restos de builds anteriores. Solo se puede llamar con el servidor
 * nuevo ya en pie y respondiendo: hasta ese momento, el proceso viejo todavía
 * puede pedir sus chunks, que es justo lo que evita el 500.
 */
export function pruneBuildLeftovers(before) {
	let removed = 0;

	for (const dir of HASHED_DIRS) {
		let entries;
		try {
			entries = readdirSync(dir);
		} catch {
			continue;
		}

		for (const entry of entries) {
			const file = join(dir, entry);
			try {
				// El build vigente reescribe todos sus ficheros, incluidos los que no
				// han cambiado: lo que conserva la fecha vieja ya no lo usa nadie.
				if (statSync(file).mtimeMs >= before) continue;
				rmSync(file, { recursive: true, force: true });
				removed += 1;
			} catch {
				// Si no se puede borrar, es basura que ocupa. No es un problema.
			}
		}
	}

	if (removed > 0) log(`${removed} ficheros de builds anteriores tirados.`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Devuelve null si la web responde bien, o el motivo del fallo. */
export async function smoke({ attempts = 12, waitMs = 2500 } = {}) {
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			const response = await fetch(`${BASE}/api/health`);
			const body = await response.json();
			if (response.ok && body.ok) break;
			if (attempt === attempts) return `/api/health responde ${response.status}`;
		} catch (error) {
			if (attempt === attempts) return `/api/health no responde: ${error.message}`;
		}
		await sleep(waitMs);
	}

	const pages = [
		{ path: '/', marker: 'esta web es tuya' },
		{ path: '/ideas', marker: 'Ideas de esta ventana' },
	];

	for (const page of pages) {
		try {
			const response = await fetch(`${BASE}${page.path}`);
			if (!response.ok) return `${page.path} responde ${response.status}`;
			const html = await response.text();
			if (!html.includes(page.marker)) return `${page.path} ya no contiene "${page.marker}"`;
		} catch (error) {
			return `${page.path} no responde: ${error.message}`;
		}
	}

	return null;
}

export async function report({ commitSha, previousSha, status, error, featureId = null }) {
	if (!SECRET) {
		log('Sin CRON_SECRET: no se puede dejar constancia del despliegue.');
		return;
	}

	try {
		const response = await fetch(`${BASE}/api/releases`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ commitSha, previousSha, status, error, featureId }),
		});
		if (!response.ok) log(`No se pudo registrar el despliegue: ${response.status}`);
	} catch (fetchError) {
		log(`No se pudo registrar el despliegue: ${fetchError.message}`);
	}
}

export async function lastLiveSha(exclude) {
	if (!SECRET) return null;
	try {
		const url = new URL(`${BASE}/api/releases`);
		if (exclude) url.searchParams.set('exclude', exclude);
		const response = await fetch(url, { headers: { Authorization: `Bearer ${SECRET}` } });
		if (!response.ok) return null;
		const body = await response.json();
		return body.lastLiveSha ?? null;
	} catch {
		return null;
	}
}

export function stampSha(sha) {
	try {
		writeFileSync('.release-sha', `${sha}\n`);
	} catch {
		// El sello es informativo: si no se puede escribir, seguimos.
	}
}

/**
 * Vuelve al commit indicado, reconstruye y comprueba. Si ni siquiera el commit
 * anterior arranca, sale con error para que se vea en los logs del servicio.
 */
export async function rollbackTo(sha, reason, { commitSha } = {}) {
	if (!SHA_RE.test(sha)) {
		log(`Commit no válido para volver atrás: ${sha}`);
		process.exit(1);
	}

	log(`Volviendo a ${sha}: ${reason}`);
	run(`git reset --hard ${sha}`);
	stampSha(sha);

	try {
		buildAndRestart();
	} catch (error) {
		log(`La versión anterior tampoco compila: ${error.message}`);
		await report({ commitSha: commitSha ?? sha, previousSha: sha, status: 'failed', error: reason });
		process.exit(1);
	}

	const failure = await smoke();
	await report({
		commitSha: commitSha ?? sha,
		previousSha: sha,
		status: failure ? 'failed' : 'rolled_back',
		error: failure ? `${reason} · la versión anterior tampoco pasa: ${failure}` : reason,
	});

	if (failure) {
		log(`La versión anterior tampoco pasa las comprobaciones: ${failure}`);
		process.exit(1);
	}

	log('Vuelta atrás terminada. La web responde.');
}
