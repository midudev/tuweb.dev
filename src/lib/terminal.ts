/**
 * La terminal de los juegos: un sistema de ficheros de mentira por nivel y un
 * puñado de comandos de Linux que lo leen. No se ejecuta nada de verdad: cada
 * comando es una función que mira un objeto. Todo corre en el navegador.
 */

export const HOME = '/home/dev';
export const PUNTOS = 100;
export const CON_PISTA = 50;

export interface Nivel {
	id: string;
	titulo: string;
	reto: string;
	pista: string;
	clave: string;
	/** Rutas desde la raíz, sin barra delante. Las carpetas salen de las rutas. */
	archivos: Record<string, string>;
}

const log = Array.from({ length: 300 }, (_, i) => {
	const s = 3 * 3600 + i * 37;
	const hora = [s / 3600, (s / 60) % 60, s % 60].map((n) => String(Math.floor(n)).padStart(2, '0')).join(':');
	if (i === 217) return `[${hora}] WARN CLAVE=aguja dejada aquí por error`;
	const ruta = ['/', '/ideas', '/juegos', '/api/health', '/ranking'][i % 5];
	const codigo = [200, 200, 304, 200, 404][(i * 7) % 5];
	return `[${hora}] INFO GET ${ruta} ${codigo}`;
}).join('\n');

const incidencias = [
	'#101 El botón de enviar no hace nada: bug en el formulario',
	'#102 Cambiar el color del pie',
	'#103 BUG: el reloj se adelanta un minuto',
	'#104 Traducir la página de créditos',
	'#105 Bug raro al cerrar la ventana de ideas',
	'#106 Subir la versión de Tailwind',
	'#107 La serpiente atraviesa la pared (bug)',
	'#108 Añadir icono al ranking',
	'#109 Bug: los votos se cuentan dos veces',
	'#110 Revisar textos de la portada',
	'#111 Mejorar el contraste del tema claro',
	'#112 Un bug en el chat corta los mensajes largos',
	'#113 Ordenar el changelog por mes',
	'#114 Quitar un console.log olvidado',
	'#115 bug de scroll en el móvil',
	'#116 Documentar los comandos de la terminal',
].join('\n');

const diario = [
	...Array.from({ length: 25 }, (_, i) => `Día ${i + 1}: compilé otra vez y esperé.`),
	'Llegué tarde y el build seguía en rojo.',
	'Instalé lo de siempre y borré node_modules.',
	'Nada. Ni un solo test en verde.',
	'Una coma de más, la quité, y todo pasó.',
	'Xilófonos sonando en mi cabeza al hacer el deploy.',
].join('\n');

export const NIVELES: Nivel[] = [
	{
		id: 'cajon',
		titulo: 'Primeros pasos',
		reto: 'Lee LEEME.txt y saca la clave del cajón.',
		pista: 'cat LEEME.txt, luego cd cajon y cat clave.txt.',
		clave: 'tux',
		archivos: {
			'home/dev/LEEME.txt':
				'Bienvenida a la terminal.\nLa clave de este nivel está en cajon/clave.txt.\nls para mirar, cd para entrar, cat para leer.\nCuando la tengas: abrir <clave>',
			'home/dev/cajon/clave.txt': 'tux',
			'home/dev/cajon/calcetines.txt': 'Nada por aquí.',
		},
	},
	{
		id: 'oculto',
		titulo: 'Lo que no se ve',
		reto: 'Aquí parece que no hay nada. Parece.',
		pista: 'Los ficheros que empiezan por punto solo salen con ls -a.',
		clave: 'sombra',
		archivos: {
			'home/dev/notas.txt': 'Comprar café.\nNo dejar secretos a la vista.',
			'home/dev/.secreto': 'Bien visto. La clave es: sombra',
		},
	},
	{
		id: 'aguja',
		titulo: 'La aguja',
		reto: 'Alguien dejó la clave en servidor.log, entre 300 líneas. No lo leas entero.',
		pista: 'grep CLAVE servidor.log',
		clave: 'aguja',
		archivos: { 'home/dev/servidor.log': log },
	},
	{
		id: 'arbol',
		titulo: 'Perdido en el árbol',
		reto: 'Hay un fichero .key perdido en algún sitio de proyecto/. La clave es lo que pone dentro.',
		pista: 'find proyecto -name "*.key"',
		clave: 'raices',
		archivos: {
			'home/dev/proyecto/README.md': '# Proyecto\nNadie sabe ya qué hay aquí dentro.',
			'home/dev/proyecto/src/index.js': 'console.log("hola")',
			'home/dev/proyecto/src/lib/util.js': 'export const nada = null',
			'home/dev/proyecto/src/componentes/Boton.astro': '<button>Pulsa</button>',
			'home/dev/proyecto/docs/guia.md': 'Esta guía está sin terminar.',
			'home/dev/proyecto/tests/unit/util.test.js': 'test("nada", () => {})',
			'home/dev/proyecto/build/cache/tmp/viejo/llave.key': 'raices',
			'home/dev/proyecto/build/cache/tmp/viejo/llave.bak': 'esta no es',
		},
	},
	{
		id: 'bugs',
		titulo: 'Cuenta y verás',
		reto: 'La clave es cuántas líneas de incidencias.txt hablan de un bug, con mayúsculas o sin ellas.',
		pista: 'grep -i bug incidencias.txt | wc -l',
		clave: String(incidencias.split('\n').filter((l) => /bug/i.test(l)).length),
		archivos: { 'home/dev/incidencias.txt': incidencias },
	},
	{
		id: 'servidores',
		titulo: 'Quién miente',
		reto: 'Tres servidores. Cada uno dice siempre la verdad o miente siempre. La clave es el nombre del que dice la verdad.',
		pista: 'Supón que alfa dice la verdad y mira si gamma te deja.',
		clave: 'beta',
		archivos: {
			'home/dev/servidores/alfa.txt': 'beta miente.',
			'home/dev/servidores/beta.txt': 'gamma miente.',
			'home/dev/servidores/gamma.txt': 'alfa y beta mienten los dos.',
		},
	},
	{
		id: 'acrostico',
		titulo: 'Final de diario',
		reto: 'Mira cómo termina diario.txt. Lo que importa va al principio de cada línea.',
		pista: 'tail -n 5 diario.txt y lee las iniciales de arriba abajo.',
		clave: 'linux',
		archivos: { 'home/dev/diario.txt': diario },
	},
];

export interface Insignia {
	id: string;
	titulo: string;
	detalle: string;
	icono: string;
}

export const INSIGNIAS: Insignia[] = [
	{ id: 'primero', titulo: 'Login', detalle: 'Abre el primer nivel', icono: 'terminal-2' },
	{ id: 'ocultos', titulo: 'Ojo fino', detalle: 'Usa ls -a', icono: 'eye-off' },
	{ id: 'grep', titulo: 'Cazador', detalle: 'Usa grep', icono: 'search' },
	{ id: 'tuberia', titulo: 'Fontanería', detalle: 'Encadena con |', icono: 'bolt' },
	{ id: 'sinpistas', titulo: 'Sin chuleta', detalle: 'Los siete sin pistas', icono: 'bulb' },
	{ id: 'root', titulo: 'root', detalle: 'Abre los siete niveles', icono: 'lock-open' },
];

const normal = (s: string) =>
	s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export const acierta = (nivel: Nivel, texto: string) => normal(texto) === normal(nivel.clave);

// --- El sistema de ficheros ---

/** Junta una ruta con la carpeta actual y quita los . y los .. */
export function resolver(cwd: string, ruta = '.') {
	const base = ruta.startsWith('/') ? '' : ruta === '~' || ruta.startsWith('~/') ? HOME : cwd;
	const partes: string[] = [];
	for (const p of `${base}/${ruta.replace(/^~/, '')}`.split('/')) {
		if (!p || p === '.') continue;
		if (p === '..') partes.pop();
		else partes.push(p);
	}
	return `/${partes.join('/')}`;
}

function carpetas(nivel: Nivel) {
	const set = new Set(['/']);
	for (const ruta of Object.keys(nivel.archivos)) {
		const partes = ruta.split('/');
		for (let i = 1; i < partes.length; i++) set.add(`/${partes.slice(0, i).join('/')}`);
	}
	return set;
}

const fichero = (nivel: Nivel, ruta: string) => nivel.archivos[ruta.slice(1)];

/** Lo que cuelga directamente de una carpeta, con / detrás si es carpeta. */
export function hijos(nivel: Nivel, dir: string) {
	const prefijo = dir === '/' ? '/' : `${dir}/`;
	const nombres = new Set<string>();
	for (const ruta of [...carpetas(nivel), ...Object.keys(nivel.archivos).map((r) => `/${r}`)]) {
		if (!ruta.startsWith(prefijo) || ruta === dir) continue;
		const resto = ruta.slice(prefijo.length).split('/');
		nombres.add(resto.length > 1 || carpetas(nivel).has(ruta) ? `${resto[0]}/` : resto[0]);
	}
	return [...nombres].sort();
}

/** Todo lo que hay por debajo de una carpeta, ella incluida. */
function debajo(nivel: Nivel, dir: string) {
	const prefijo = dir === '/' ? '/' : `${dir}/`;
	const todo = [...carpetas(nivel), ...Object.keys(nivel.archivos).map((r) => `/${r}`)];
	return todo.filter((r) => r === dir || r.startsWith(prefijo)).sort();
}

// --- Los comandos ---

export interface Resultado {
	salida: string[];
	cwd: string;
	error?: boolean;
	/** Lo que se ha usado, para las insignias: «ls -a», «grep», «|». */
	usados: string[];
}

export const COMANDOS = ['ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'grep', 'find', 'wc', 'sort', 'echo'];

const trocear = (linea: string) =>
	[...linea.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);

const comodin = (patron: string) =>
	new RegExp(`^${patron.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`);

class Fallo extends Error {}

export function ejecutar(nivel: Nivel, cwd: string, linea: string): Resultado {
	const usados: string[] = [];
	const tramos = linea.split('|').map((t) => trocear(t));
	if (tramos.length > 1) usados.push('|');
	let entrada: string[] | null = null;
	try {
		for (const [cmd, ...args] of tramos) {
			if (!cmd) throw new Fallo('falta un comando a un lado de la tubería');
			usados.push(cmd);
			const banderas = args.filter((a) => /^-[a-z]+$/.test(a)).join('');
			const resto = args.filter((a) => !/^-[a-z]+$/.test(a));
			const leer = (ruta: string) => {
				const r = resolver(cwd, ruta);
				const texto = fichero(nivel, r);
				if (texto === undefined) throw new Fallo(`${cmd}: ${ruta}: ${carpetas(nivel).has(r) ? 'es una carpeta' : 'no existe'}`);
				return texto.split('\n');
			};
			const texto = (ruta?: string) => {
				if (ruta) return leer(ruta);
				if (entrada) return entrada;
				throw new Fallo(`${cmd}: falta el fichero`);
			};
			switch (cmd) {
				case 'pwd':
					entrada = [cwd];
					break;
				case 'echo':
					entrada = [args.join(' ')];
					break;
				case 'cd': {
					const r = resolver(cwd, resto[0] ?? '~');
					if (!carpetas(nivel).has(r)) throw new Fallo(`cd: ${resto[0]}: no es una carpeta`);
					cwd = r;
					entrada = [];
					break;
				}
				case 'ls': {
					if (banderas.includes('a')) usados.push('ls -a');
					const r = resolver(cwd, resto[0]);
					if (fichero(nivel, r) !== undefined) entrada = [resto[0]];
					else if (!carpetas(nivel).has(r)) throw new Fallo(`ls: ${resto[0]}: no existe`);
					else entrada = hijos(nivel, r).filter((n) => banderas.includes('a') || !n.startsWith('.'));
					break;
				}
				case 'cat':
					entrada = resto.length ? resto.flatMap(leer) : texto();
					break;
				case 'head':
				case 'tail': {
					const n = Number(args.join(' ').match(/-n\s*(\d+)|-(\d+)/)?.slice(1).find(Boolean) ?? 10);
					const lineas = texto(resto.find((a) => !a.startsWith('-') && !/^\d+$/.test(a)));
					entrada = cmd === 'head' ? lineas.slice(0, n) : lineas.slice(-n);
					break;
				}
				case 'wc': {
					const lineas = texto(resto[0]);
					const l = lineas.length;
					const w = lineas.join(' ').split(/\s+/).filter(Boolean).length;
					const c = lineas.join('\n').length;
					entrada = [banderas.includes('l') ? `${l}` : banderas.includes('w') ? `${w}` : banderas.includes('c') ? `${c}` : `${l} ${w} ${c}`];
					break;
				}
				case 'sort':
					entrada = [...texto(resto[0])].sort((a, b) => (banderas.includes('r') ? b.localeCompare(a) : a.localeCompare(b)));
					break;
				case 'grep': {
					const [patron, ruta] = resto;
					if (!patron) throw new Fallo('grep: falta qué buscar');
					const i = banderas.includes('i');
					const busca = (l: string) => (i ? l.toLowerCase().includes(patron.toLowerCase()) : l.includes(patron)) !== banderas.includes('v');
					const r = ruta ? resolver(cwd, ruta) : '';
					if (ruta && banderas.includes('r') && carpetas(nivel).has(r)) {
						entrada = debajo(nivel, r)
							.filter((f) => fichero(nivel, f) !== undefined)
							.flatMap((f) => fichero(nivel, f)!.split('\n').filter(busca).map((l) => `${f}:${l}`));
					} else {
						const lineas = texto(ruta);
						entrada = banderas.includes('n') ? lineas.flatMap((l, k) => (busca(l) ? [`${k + 1}:${l}`] : [])) : lineas.filter(busca);
					}
					if (banderas.includes('c')) entrada = [String(entrada.length)];
					break;
				}
				case 'find': {
					const dir = resto[0] && !args[0].startsWith('-') ? resto[0] : '.';
					const r = resolver(cwd, dir);
					if (!carpetas(nivel).has(r)) throw new Fallo(`find: ${dir}: no existe`);
					const k = args.indexOf('-name');
					const filtro = k >= 0 && args[k + 1] ? comodin(args[k + 1]) : null;
					const base = dir.replace(/\/$/, '');
					entrada = debajo(nivel, r)
						.filter((ruta) => !filtro || filtro.test(ruta.split('/').pop() ?? ''))
						.map((ruta) => (dir.startsWith('/') ? ruta : `${base}${ruta.slice(r.length)}`));
					break;
				}
				default:
					throw new Fallo(`${cmd}: no existe ese comando. Escribe ayuda.`);
			}
		}
	} catch (e) {
		if (e instanceof Fallo) return { salida: [e.message], cwd, error: true, usados };
		throw e;
	}
	return { salida: entrada ?? [], cwd, usados };
}

/** Completa el último trozo de la línea con lo que haya en la carpeta. */
export function completar(nivel: Nivel, cwd: string, linea: string) {
	const trozos = linea.split(' ');
	const ultimo = trozos.pop() ?? '';
	if (!trozos.length) {
		const opciones = COMANDOS.filter((c) => c.startsWith(ultimo));
		return opciones.length === 1 ? `${opciones[0]} ` : linea;
	}
	const corte = ultimo.lastIndexOf('/') + 1;
	const dir = resolver(cwd, ultimo.slice(0, corte) || '.');
	const opciones = hijos(nivel, dir).filter((n) => n.startsWith(ultimo.slice(corte)));
	return opciones.length === 1 ? [...trozos, ultimo.slice(0, corte) + opciones[0]].join(' ') : linea;
}

// --- El ranking ---

export interface Entrada {
	firma: string;
	puntos: number;
	niveles: number;
}

export const limpiarFirma = (s: unknown) =>
	typeof s === 'string' ? s.replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 20) : '';

export function limpiarRanking(lista: unknown): Entrada[] {
	if (!Array.isArray(lista)) return [];
	return lista
		.filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
		.map((e) => ({
			firma: limpiarFirma(e.firma),
			puntos: Math.min(NIVELES.length * PUNTOS, Math.max(0, Math.floor(Number(e.puntos) || 0))),
			niveles: Math.min(NIVELES.length, Math.max(0, Math.floor(Number(e.niveles) || 0))),
		}))
		.filter((e) => e.firma);
}

/** Una fila por firma, con su mejor marca. */
export function juntarRanking(a: Entrada[], b: Entrada[]) {
	const mejor = new Map<string, Entrada>();
	for (const e of [...a, ...b]) {
		const ya = mejor.get(e.firma);
		if (!ya || e.puntos > ya.puntos || (e.puntos === ya.puntos && e.niveles > ya.niveles)) mejor.set(e.firma, e);
	}
	return [...mejor.values()].sort((x, y) => y.puntos - x.puntos || y.niveles - x.niveles || x.firma.localeCompare(y.firma)).slice(0, 100);
}
