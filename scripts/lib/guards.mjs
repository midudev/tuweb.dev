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
	'src/lib/github-dev.ts',
	'src/lib/process-cycle.ts',
	// El reloj de la ventana marca el ritmo del cron: no se toca desde una idea.
	'src/lib/window.ts',
	// La base de datos y sus consultas: por ahí salen los usuarios.
	'src/lib/db/',
	'src/middleware.ts',
	// El formulario que da de alta las ideas: es la boca del endpoint moderado y
	// lo único de src/components que lee la configuración de GitHub. Reescribirlo
	// desde una idea no aporta nada y sí puede aflojar lo de debajo.
	'src/components/ProposeForm.astro',
	// Ninguna ruta de API nueva. Una idea es interfaz; un endpoint es superficie
	// de ataque que nadie ha revisado.
	'src/pages/api/',
];

/**
 * Código que no pinta nada en una idea de la web y que sí sirve para hacer
 * daño: ejecutar cosas, llamar fuera o tocar el disco. Se mira en las líneas
 * añadidas, así que da igual en qué fichero permitido lo intente meter.
 */
const DANGEROUS_PATTERNS = [
	[/\beval\s*\(/, 'eval()'],
	[/new\s+Function\s*\(/, 'new Function()'],
	[/child_process|execSync|spawnSync|execFileSync/, 'ejecución de procesos'],
	[/\bfetch\s*\(\s*['"`]https?:\/\//i, 'fetch a una dirección externa'],
	[/\bimport\s*\(\s*['"`]https?:\/\//i, 'import de código externo'],
	[/<script[^>]+src\s*=\s*["']https?:\/\//i, 'script de otro dominio'],
	[/new\s+WebSocket\s*\(/, 'WebSocket'],
	[/XMLHttpRequest/, 'XMLHttpRequest'],
	[/from\s+['"]node:|require\s*\(\s*['"]node:/, 'módulos de Node'],
	[/\bnew\s+Worker\s*\(|serviceWorker/, 'workers'],
];

/**
 * Lo que una idea de interfaz no necesita NUNCA y sí sirve para sacar cosas de
 * aquí. DENIED impide editar estos módulos, pero no impedía IMPORTARLOS: una
 * página nueva en src/pages/ se renderiza en el servidor, así que podía pedirle
 * la clave del modelo a lib/env, abrir la base de datos a pelo o firmar una
 * sesión, y pasar todas las verjas de abajo sin escribir ni un process.env.
 *
 * Leer datos sigue permitido —de ahí salió el ranking—: lo que se corta es el
 * acceso crudo, la escritura y todo lo que huela a credencial o identidad.
 */
const FORBIDDEN_CAPABILITIES = [
	[
		/(?:from|import)\s*\(?\s*['"][^'"]*\/(env|secrets|github-dev|moderation-llm)['"]/,
		'importar un módulo de configuración o de secretos',
	],
	[
		/\b(getLlmConfig|getCronSecret|getGithubConfig|getDatabaseUrl|matchesCronSecret|exchangeGithubCode|upsertGithubUser|createGithubAuthorizeUrl)\s*\(/,
		'usar una función de secretos o de identidad',
	],
	[/\bgetDb\s*\(|new\s+DatabaseSync\s*\(/, 'abrir la base de datos a pelo'],
	[/\bsession\s*\??\.\s*(set|regenerate|destroy)\s*\(/, 'tocar la sesión de quien navega'],
	[
		/\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|DROP\s+(TABLE|INDEX)|ALTER\s+TABLE|CREATE\s+(TABLE|INDEX))\b/i,
		'escribir SQL que modifica la base',
	],
	[/\bcookies\s*\.\s*(set|delete)\s*\(/, 'poner o borrar cookies'],
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

/** Las líneas que la IA ha añadido, sin las cabeceras del diff. */
function addedLines(cwd) {
	return git(['diff', 'HEAD'], cwd)
		.split('\n')
		.filter((line) => line.startsWith('+') && !line.startsWith('+++'));
}

/** Lo que el cambio trae y no debería: nombre en claro de lo que se ha visto. */
export function dangerousCode(cwd) {
	const added = addedLines(cwd);
	return [...DANGEROUS_PATTERNS, ...FORBIDDEN_CAPABILITIES]
		.filter(([pattern]) => added.some((line) => pattern.test(line)))
		.map(([, name]) => name);
}

/**
 * Última verja antes de publicar: mira las líneas AÑADIDAS buscando secretos
 * del .env o código que lea el entorno. Una idea maliciosa que sobreviva a los
 * filtros de antes se queda aquí.
 */
export function leakedSecrets(cwd) {
	const added = addedLines(cwd);
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
