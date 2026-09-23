import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';

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
		/\b(INSERT\s+(OR\s+\w+\s+)?INTO|REPLACE\s+INTO|UPDATE\s+(OR\s+\w+\s+)?["'`\[]?\w+["'`\]]?\s+SET|DELETE\s+FROM|DROP\s+(TABLE|INDEX|VIEW|TRIGGER)|ALTER\s+TABLE|CREATE\s+(TEMP\w*\s+)?(TABLE|INDEX|VIEW|TRIGGER)|ATTACH\s+DATABASE|VACUUM\s+INTO|PRAGMA)\b/i,
		'escribir SQL que modifica la base',
	],
	[/\bcookies\s*\.\s*(set|delete)\s*\(/, 'poner o borrar cookies'],
	[/\bdocument\s*\.\s*cookie\b/, 'leer o escribir cookies desde el navegador'],
	[/\bFROM\s+sessions\b|\bsessions\s+WHERE\b|\bsqlite_(master|schema)\b/i, 'leer la tabla de sesiones o el esquema'],
	// Un nombre de tabla que se construye en vez de escribirse es para esconderlo.
	[/\b(FROM|JOIN|INTO|UPDATE|TABLE)\s+(['"`]\s*\+|\$\{)/i, 'SQL con el nombre de la tabla construido'],
];

/**
 * Las puertas traseras con las que se salta todo lo de arriba sin escribir
 * ninguna palabra prohibida: llegar al entorno o a los módulos de Node por un
 * camino indirecto, construir código a partir de texto, sacar a quien navega
 * hacia otro dominio, o colar código que corre en el servidor o al compilar.
 *
 * Una idea de interfaz no necesita ninguna. Se miran sobre el texto añadido
 * de cada fichero entero, no línea a línea: partir `eval` y `(` en dos líneas
 * ya no sirve.
 */
const BACKDOORS = [
	[/\bprocess\b/, 'process'],
	[/\bglobalThis\b/, 'globalThis'],
	[/\brequire\s*\(|\bcreateRequire\b/, 'require'],
	[/import\.meta\.(glob|env)\b/, 'import.meta.glob/env'],
	[/\.\s*constructor\b|\[\s*['"`]constructor['"`]\s*\]/, 'acceso a .constructor'],
	[/\bReflect\b|\bProxy\s*\(/, 'Reflect/Proxy'],
	// En forma de llamada o nombrados en texto; mencionarlos en un comentario no cuenta.
	[/\beval\s*[(),`]|['"`]eval['"`]|\bFunction\s*[(`]|['"`]Function['"`]/, 'Function/eval'],
	[/\b(setTimeout|setInterval)\s*\(\s*['"`]/, 'código en texto dentro de un temporizador'],
	// obj['pro' + 'cess']: la forma de nombrar lo prohibido sin escribirlo.
	[/\[\s*['"`][^'"`\]]*['"`]\s*\+/, 'acceso a una propiedad con nombre construido'],
	[/\bimport\s*\((?!\s*['"][^'"]+['"]\s*\))/, 'import() con ruta calculada'],
	[/\bwindow\s*\.\s*open\s*\(/, 'window.open'],
	[/\blocation(\s*\.\s*href)?\s*=(?!=)(?!\s*['"`]\/(?![\/\\]))/, 'navegar fuera de la web'],
	[/\blocation\s*\.\s*(assign|replace)\s*\((?!\s*['"`]\/(?![\/\\]))/, 'navegar fuera de la web'],
	[/\bsendBeacon\b/, 'sendBeacon'],
	[/http-equiv\s*=\s*["']?refresh/i, 'meta refresh'],
	[/\b(prefetch|preconnect|dns-prefetch|prerender)\b/i, 'precargar otros dominios'],
	[/\bexport\s+const\s+prerender\b|\bgetStaticPaths\b/, 'código que corre al compilar'],
];

/** Módulos de fuera del proyecto que una idea puede usar. */
const ALLOWED_PACKAGES = [/^astro(:[\w-]+)?$/, /^@iconify-json\/tabler$/];

/**
 * Módulos del proyecto que no se importan desde una idea: secretos, la sesión
 * guardada, la limpieza de la base, las escrituras de la comunidad y las piezas
 * de la API. Leer datos sí (queries.ts, client.ts con SELECT): lo que se corta
 * es escribir, lo que huele a credencial y la tabla de sesiones.
 */
const FORBIDDEN_MODULES =
	/^src\/(lib\/(env|secrets|github-dev|moderation-llm|moderation|http|api|rate-limit|presence|process-cycle)(\.ts)?$|lib\/db\/(session-driver|session-ttl|maintenance|schema|community)(\.ts)?$|middleware(\.ts)?$|pages\/api\/)/;

const CODE_FILE = /\.(astro|[cm]?[jt]sx?|svelte|vue|html)$/;

/**
 * Solo para lo que corre en el servidor: ahí un fetch a una dirección montada
 * en una variable es un SSRF o una forma de sacar datos. En el navegador ya lo
 * para la CSP (connect-src 'self'), y las herramientas lo usan con blob: para
 * descargar lo que dibujan.
 */
const SERVER_ONLY = [
	[/\bfetch\s*\((?!\s*['"`]\/(?![\/\\]))/, 'fetch desde el servidor a una dirección que no es una ruta literal de la web'],
];

/** La parte de un fichero que corre en el servidor: el frontmatter de un .astro, o un módulo entero de src/. */
export function serverPart(file, content) {
	if (file.endsWith('.astro')) {
		const match = content.match(/^\s*---\r?\n([\s\S]*?)\r?\n---/);
		return match ? match[1] : '';
	}
	return /^src\/.*\.[cm]?[jt]s$/.test(file) ? content : '';
}

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
			DENIED.some((deny) => path.startsWith(deny)) ||
			// Un .ts o .js en src/pages/ es un endpoint, esté o no en api/.
			/^src\/pages\/.*\.[cm]?[jt]sx?$/.test(path) ||
			// Nada de ficheros ocultos: un .gitignore nuevo esconde lo que haya al lado.
			/(^|\/)\./.test(path),
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

/** Lo añadido, agrupado por fichero y unido en un solo texto. */
export function addedByFile(cwd, range = ['HEAD']) {
	const files = new Map();
	let current = null;
	for (const line of git(['diff', ...range], cwd).split('\n')) {
		if (line.startsWith('+++ ')) {
			current = line.slice(4).replace(/^b\//, '');
			if (current === '/dev/null') current = null;
			continue;
		}
		if (current && line.startsWith('+')) {
			files.set(current, `${files.get(current) ?? ''}${line.slice(1)}\n`);
		}
	}
	return files;
}

/** Los módulos que importa un texto: estáticos, dinámicos y reexportados. */
function importsOf(text) {
	const specifiers = [];
	const re = /(?:\bfrom\s*|\bimport\s*\(?\s*)(['"])([^'"\n]+)\1/g;
	for (const match of text.matchAll(re)) specifiers.push(match[2]);
	return specifiers;
}

/** Por qué no vale importar `specifier` desde `file`, o null si vale. */
export function importProblem(file, specifier) {
	if (/[?#]/.test(specifier)) return `importar "${specifier}" (con ?/#: ?raw, ?url...)`;
	if (!specifier.startsWith('.')) {
		return ALLOWED_PACKAGES.some((allowed) => allowed.test(specifier))
			? null
			: `importar el paquete "${specifier}"`;
	}
	const resolved = posix.normalize(posix.join(posix.dirname(file), specifier));
	if (!resolved.startsWith('src/')) return `importar "${specifier}" de fuera de src/`;
	if (FORBIDDEN_MODULES.test(resolved)) return `importar "${specifier}"`;
	return null;
}

/** Lo que el cambio trae y no debería: nombre en claro de lo que se ha visto. */
export function dangerousCode(cwd) {
	return reviewAdded(addedByFile(cwd), (file) => {
		try {
			return readFileSync(cwd ? `${cwd}/${file}` : file, 'utf8');
		} catch {
			return '';
		}
	});
}

/**
 * La revisión en sí, sobre { fichero → texto añadido }. `contentOf` da el
 * fichero entero tal como queda, para saber qué parte corre en el servidor.
 */
export function reviewAdded(files, contentOf = () => '') {
	const found = new Set();
	for (const [file, text] of files) {
		const server = CODE_FILE.test(file) ? serverPart(file, contentOf(file) || text) : '';
		for (const [pattern, name] of SERVER_ONLY) {
			if (pattern.test(server)) found.add(`${name} en ${file}`);
		}
		for (const [pattern, name] of [...DANGEROUS_PATTERNS, ...FORBIDDEN_CAPABILITIES]) {
			if (pattern.test(text)) found.add(name);
		}
		if (!CODE_FILE.test(file)) continue;
		for (const [pattern, name] of BACKDOORS) {
			if (pattern.test(text)) found.add(`${name} en ${file}`);
		}
		for (const specifier of importsOf(text)) {
			const problem = importProblem(file, specifier);
			if (problem) found.add(`${problem} en ${file}`);
		}
	}
	return [...found];
}

/**
 * Ficheros que git no enseña: los ignorados por un .gitignore. Un fichero así
 * dentro de src/ no pasaba por ninguna verja, no se commiteaba y seguía vivo
 * en los builds siguientes. Dentro de src/ y public/ no tiene que haber ninguno.
 */
export function ignoredPaths(cwd) {
	return git(['status', '--porcelain', '--ignored', '--untracked-files=all', '--', ...ALLOWED_PREFIXES], cwd)
		.split('\n')
		.filter((line) => line.startsWith('!! '))
		.map((line) => line.slice(3).trim());
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
