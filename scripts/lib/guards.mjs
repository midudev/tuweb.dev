import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// La IA solo puede tocar la web. Lo demás es el suelo que pisa.
export const ALLOWED_PREFIXES = ['src/', 'public/'];

export const DENIED = [
	'src/lib/moderation.ts',
	'src/lib/moderation-llm.ts',
	'src/lib/secrets.ts',
	'src/lib/env.ts',
	'src/lib/auth.ts',
	'src/lib/http.ts',
	'src/lib/releases.ts',
	'src/middleware.ts',
	'src/pages/api/cron/',
	'src/pages/api/releases.ts',
	'src/pages/api/health.ts',
];

const SECRET_PATTERNS = [
	/sk-[A-Za-z0-9_-]{16,}/,
	/gh[pousr]_[A-Za-z0-9]{20,}/,
	/-----BEGIN [A-Z ]*PRIVATE KEY-----/,
	/process\.env/,
	/import\.meta\.env/,
];

// Sin trim: git status --porcelain empieza cada línea con dos caracteres de
// estado y un espacio, y recortar el primero desplazaba todas las rutas.
function git(args, cwd) {
	return execFileSync('git', args, { encoding: 'utf8', cwd });
}

export function changedPaths(cwd) {
	return git(['status', '--porcelain'], cwd)
		.split('\n')
		.filter((line) => line.length > 3)
		.map((line) => line.slice(3).trim())
		.map((path) => (path.includes(' -> ') ? path.split(' -> ')[1] : path))
		.map((path) => path.replace(/^"|"$/g, ''));
}

/** Rutas que la IA no tenía derecho a tocar. */
export function forbiddenPaths(paths) {
	return paths.filter(
		(path) =>
			!ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
			DENIED.some((deny) => path.startsWith(deny)),
	);
}

/**
 * Marca los ficheros nuevos como "por añadir" para que git diff los incluya.
 * Sin esto, un secreto metido en un fichero recién creado no aparece en el
 * diff y se cuela por debajo de las comprobaciones.
 */
export function stageForReview(cwd) {
	for (const prefix of ALLOWED_PREFIXES) {
		try {
			execFileSync('git', ['add', '-N', '--', prefix], { cwd, stdio: 'ignore' });
		} catch {
			// La carpeta puede no existir todavía. No es un problema.
		}
	}
}

export function changedLines(cwd) {
	const numstat = git(['diff', '--numstat', 'HEAD'], cwd).trim();
	if (!numstat) return 0;
	return numstat
		.split('\n')
		.filter(Boolean)
		.reduce((total, line) => {
			const [added, removed] = line.split('\t');
			return total + (Number(added) || 0) + (Number(removed) || 0);
		}, 0);
}

/**
 * Última verja antes de publicar: mira las líneas AÑADIDAS buscando secretos
 * del .env o código que lea el entorno. Una idea maliciosa que sobreviva a los
 * filtros de antes se queda aquí.
 */
export function leakedSecrets(cwd) {
	const added = git(['diff', 'HEAD'], cwd)
		.split('\n')
		.filter((line) => line.startsWith('+') && !line.startsWith('+++'));
	if (added.length === 0) return [];

	const found = [];

	for (const pattern of SECRET_PATTERNS) {
		if (added.some((line) => pattern.test(line))) found.push(String(pattern));
	}

	try {
		const envPath = cwd ? `${cwd}/.env` : '.env';
		const values = readFileSync(envPath, 'utf8')
			.split('\n')
			.filter((line) => line && !line.startsWith('#'))
			.map((line) => line.slice(line.indexOf('=') + 1).trim())
			.filter((value) => value.length >= 12);
		if (values.some((value) => added.some((line) => line.includes(value)))) {
			found.push('un valor del .env');
		}
	} catch {
		// Sin .env legible no hay nada que comparar.
	}

	return found;
}
