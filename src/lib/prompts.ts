/*
 * El generador de prompts. Aquí está lo que no es interfaz: qué pide cada tipo
 * de tarea, cuánto se estira según el nivel y cómo se arma el texto final.
 *
 * No hay modelo ni servidor detrás: la petición que escribes se coloca en una
 * plantilla técnica —rol, contexto, encargo, restricciones y formato— y el
 * resultado se queda en tu navegador.
 */

export type TaskId =
	| 'desarrollo'
	| 'debugging'
	| 'refactor'
	| 'testing'
	| 'sql'
	| 'api'
	| 'arquitectura'
	| 'devops'
	| 'seguridad';

export type LevelId = 'corto' | 'estandar' | 'detallado';

export interface Task {
	id: TaskId;
	label: string;
	/** Un icono de Tabler. */
	icon: string;
	/** Quién tiene que ponerse el gorro. */
	role: string;
	/** Una línea que enmarca el encargo. */
	frame: string;
	/** Lo que se le pide, en orden. Con nivel corto solo entran las tres primeras. */
	asks: string[];
	/** Lo que se suma cuando se pide detalle. */
	extra: string[];
	/** Cómo tiene que venir la respuesta. */
	output: string[];
	/** Cuándo damos el trabajo por bueno. Solo en nivel detallado. */
	accept: string[];
	/** El ejemplo que sale de marca de agua y que rellena el botón «Ejemplo». */
	hint: string;
}

export const TASKS: Task[] = [
	{
		id: 'desarrollo',
		label: 'Desarrollo',
		icon: 'code',
		role: 'un desarrollador senior',
		frame: 'Hay que escribir código nuevo y dejarlo listo para entrar en producción.',
		asks: [
			'Empieza por el plan: qué ficheros tocas y qué hace cada uno.',
			'Escribe el código entero, sin recortes ni «el resto va aquí».',
			'Cubre los casos límite: entrada vacía, valores nulos, fallos de red y concurrencia.',
			'Sigue las convenciones que ya tenga el proyecto y deja apuntadas tus suposiciones.',
		],
		extra: ['Pon tipos explícitos en las fronteras públicas y di el coste de lo que pueda crecer.'],
		output: [
			'Un bloque de código por fichero, con la ruta encima.',
			'Antes de cada bloque, una línea con qué cambia y por qué.',
		],
		accept: ['Compila, no deja TODO ni funciones a medias y pasa lo que ya estaba en verde.'],
		hint: 'un login con usuario y contraseña que aguante intentos repetidos',
	},
	{
		id: 'debugging',
		label: 'Debugging',
		icon: 'bug',
		role: 'un ingeniero que depura en producción',
		frame: 'Hay un fallo y toca dar con la causa, no tapar el síntoma.',
		asks: [
			'Lista las causas posibles ordenadas por probabilidad, no por lo llamativas que sean.',
			'Para cada una, qué comprobar y qué resultado la descartaría.',
			'Explica la causa raíz antes de tocar una sola línea.',
			'Da el parche mínimo, por qué no rompe lo de al lado y un test que falle sin él.',
		],
		extra: ['Di qué registrar para verlo venir y si el mismo error puede estar en más sitios.'],
		output: [
			'Primero las hipótesis, luego la causa raíz y al final el parche.',
			'Nada de arreglos a ciegas: si falta información, dilo.',
		],
		accept: ['La explicación cuadra con todos los síntomas, no solo con el más visible.'],
		hint: 'la app se queda colgada al subir ficheros grandes y no da error',
	},
	{
		id: 'refactor',
		label: 'Refactor',
		icon: 'recycle',
		role: 'un desarrollador senior que refactoriza sin romper nada',
		frame: 'El comportamiento se queda igual; lo que cambia es cómo está escrito.',
		asks: [
			'Di qué huele mal en el código actual y por qué molesta.',
			'Propón los cambios en pasos pequeños, cada uno con el código funcionando.',
			'No cambies el comportamiento visible ni la API pública sin avisarlo aparte.',
			'Señala qué se gana con cada paso: menos repetición, menos ramas, mejor nombre.',
		],
		extra: ['Marca qué cubrir con tests antes de mover nada y qué no compensa tocar.'],
		output: [
			'Un paso por bloque, en el orden en que hay que aplicarlos.',
			'El trozo que cambia, antes y después, no el fichero entero.',
		],
		accept: ['Cada paso se puede parar ahí y el código sigue funcionando igual que antes.'],
		hint: 'un componente de 600 líneas que hace fetch, valida y pinta a la vez',
	},
	{
		id: 'testing',
		label: 'Testing',
		icon: 'test-pipe',
		role: 'un ingeniero de calidad',
		frame: 'Hay que probar esto de verdad, no escribir tests que siempre pasan.',
		asks: [
			'Lista los casos a cubrir: camino feliz, límites, errores y concurrencia si la hay.',
			'Escribe los tests completos, con sus datos de prueba y sus aserciones.',
			'Un test, una cosa: nombres que digan qué se rompe cuando falla.',
			'Nada que dependa del reloj, de la red o del orden de ejecución.',
		],
		extra: ['Separa lo unitario de lo que pide integración y di qué queda sin cubrir.'],
		output: [
			'El fichero de tests entero, listo para pegar y ejecutar.',
			'Arriba, el comando con el que se lanzan.',
		],
		accept: ['Los tests fallan si se rompe el comportamiento que prueban.'],
		hint: 'una función que calcula el precio con descuentos y con IVA',
	},
	{
		id: 'sql',
		label: 'SQL',
		icon: 'database',
		role: 'un ingeniero de bases de datos',
		frame: 'Hay que escribir SQL que devuelva lo correcto y no se arrastre.',
		asks: [
			'Deja escrito el esquema que supones antes de la consulta.',
			'Escribe la consulta completa y formateada, con alias que se entiendan.',
			'Explica el plan que esperas y qué índices lo sostienen.',
			'Cuidado con los NULL, los duplicados y las zonas horarias.',
		],
		extra: ['Da la alternativa con CTE, cuál elegirías y qué pasa si la tabla crece diez veces.'],
		output: [
			'Un bloque con el esquema supuesto y otro con la consulta.',
			'Debajo, una línea por decisión: índice, join, agregación.',
		],
		accept: ['La consulta se ejecuta tal cual y queda claro para qué dialecto es.'],
		hint: 'los diez clientes que más gastaron el último trimestre y su media por pedido',
	},
	{
		id: 'api',
		label: 'APIs',
		icon: 'api',
		role: 'un ingeniero de backend que diseña APIs',
		frame: 'Hay que definir un contrato que aguante y no cambie cada semana.',
		asks: [
			'Define rutas, métodos y códigos de estado, incluidos los de error.',
			'Escribe petición y respuesta con un ejemplo real de cada una.',
			'Di cómo se autentica, qué se valida y qué se responde cuando la validación falla.',
			'Trata paginación, filtros y orden si la colección puede crecer.',
		],
		extra: ['Añade versionado, límites de uso e idempotencia donde tengan sentido.'],
		output: [
			'Una tabla de endpoints y, debajo, los ejemplos en JSON.',
			'Los errores con su forma exacta, no «devuelve un error».',
		],
		accept: ['Un cliente puede escribirse solo con lo que pone ahí, sin preguntar nada.'],
		hint: 'una API para gestionar reservas de salas con cancelación',
	},
	{
		id: 'arquitectura',
		label: 'Arquitectura',
		icon: 'sitemap',
		role: 'un arquitecto de software con cicatrices',
		frame: 'Hay que decidir la forma del sistema, y toda decisión se paga en algo.',
		asks: [
			'Empieza por las restricciones: escala, equipo, presupuesto y plazos.',
			'Propón dos o tres opciones, no una, y compáralas por lo que cuestan.',
			'Recomienda una y di a qué renuncias al elegirla.',
			'Describe los componentes, por dónde van los datos y qué pasa cuando cada uno se cae.',
		],
		extra: ['Di qué medir para saber si acertaste y cómo se deshace dentro de un año.'],
		output: [
			'Las opciones en una tabla y la recomendación en un párrafo.',
			'Un esquema en texto de los componentes y sus flechas.',
		],
		accept: ['La recomendación se sostiene con las restricciones y lleva sus renuncias escritas.'],
		hint: 'pasar un monolito de PHP a algo que aguante diez veces más tráfico',
	},
	{
		id: 'devops',
		label: 'DevOps',
		icon: 'server-cog',
		role: 'un ingeniero de plataforma',
		frame: 'Hay que dejarlo desplegado, repetible y con vuelta atrás.',
		asks: [
			'Da los ficheros de configuración enteros, no fragmentos sueltos.',
			'Explica cada paso del pipeline y qué lo hace fallar.',
			'Fija versiones: nada de «latest» ni de pasos a mano.',
			'Di cómo se vuelve atrás, cuánto se tarda y dónde van los secretos.',
		],
		extra: ['Añade qué monitorizar, con qué umbrales avisar y cuánto cuesta todo esto.'],
		output: [
			'Un bloque por fichero, con su ruta.',
			'Al final, los comandos en el orden en que se ejecutan.',
		],
		accept: ['Se puede repetir en una máquina limpia y la vuelta atrás está probada.'],
		hint: 'desplegar una app de Node con Docker y que el deploy no tire la web',
	},
	{
		id: 'seguridad',
		label: 'Seguridad',
		icon: 'shield-lock',
		role: 'un ingeniero de seguridad defensiva',
		frame: 'Hay que encontrar y cerrar agujeros en algo propio, no atacar a nadie.',
		asks: [
			'Repasa entradas, autenticación, autorización, sesiones y datos guardados.',
			'Por cada problema: qué permite, cómo de grave es y cómo se comprueba.',
			'Da el arreglo concreto, con el código, no el consejo genérico.',
			'Separa lo que hay que arreglar hoy de lo que puede esperar.',
		],
		extra: ['Repasa dependencias y cabeceras: CSP, CORS, cookies y cachés.'],
		output: [
			'Una lista ordenada por gravedad, con el arreglo debajo de cada punto.',
			'Sin exploits listos para usar: lo justo para reproducirlo y taparlo.',
		],
		accept: ['Cada hallazgo dice qué se rompe si no se arregla y el arreglo no inutiliza nada.'],
		hint: 'revisar el formulario de subida de ficheros de mi panel de admin',
	},
];

export const LEVELS = [
	{ id: 'corto', label: 'Corto', hint: 'Lo justo: rol, objetivo y tres encargos.' },
	{ id: 'estandar', label: 'Estándar', hint: 'El prompt completo, sin pasarse.' },
	{ id: 'detallado', label: 'Detallado', hint: 'Todo, con criterios de aceptación.' },
] as const;

export const EXTRAS = [
	{ id: 'preguntas', label: 'Que pregunte si duda', line: 'Si algo es ambiguo, pregunta antes de escribir nada.' },
	{ id: 'tests', label: 'Con tests', line: 'Incluye pruebas del camino feliz y de al menos dos casos límite.' },
	{ id: 'porque', label: 'Que explique el porqué', line: 'Justifica cada decisión en una línea, sin sermones.' },
	{ id: 'sindeps', label: 'Sin dependencias nuevas', line: 'No añadas librerías: resuélvelo con lo que ya hay.' },
	{ id: 'alternativas', label: 'Con alternativa', line: 'Propón una alternativa distinta y di cuándo la elegirías.' },
	{ id: 'pasos', label: 'Paso a paso', line: 'Numera los pasos en el orden en que hay que aplicarlos.' },
] as const;

export type ExtraId = (typeof EXTRAS)[number]['id'];

/** Los stacks que se ponen con un clic. Escribir el tuyo sigue estando ahí. */
export const STACKS = ['TypeScript', 'React', 'Astro', 'Node.js', 'Python', 'Go', 'Rust', 'PHP', 'PostgreSQL', 'Docker'];

export interface Draft {
	task: TaskId;
	request: string;
	stack: string;
	context: string;
	constraints: string;
	level: LevelId;
	extras: ExtraId[];
}

/** Un prompt es un encargo, no un adjunto: los campos van cortos. */
export const MAX_LENGTH = 1200;

const KEY = 'tuweb:prompts';

export const DEFAULT_DRAFT: Draft = {
	task: 'desarrollo',
	request: '',
	stack: '',
	context: '',
	constraints: '',
	level: 'estandar',
	extras: ['preguntas'],
};

export function getTask(id: string) {
	return TASKS.find((task) => task.id === id) ?? TASKS[0];
}

/** Una frase suelta: sin saltos, con mayúscula al principio y punto al final. */
function sentence(text: string) {
	const clean = text.trim().replace(/\s+/g, ' ');
	if (!clean) return '';
	const done = /[.!?]$/.test(clean) ? clean : `${clean}.`;
	return done.charAt(0).toLocaleUpperCase('es') + done.slice(1);
}

/** Un campo de varias líneas se convierte en viñetas, quitando las que ya trae. */
function bullets(text: string, max = 10) {
	return text
		.split('\n')
		.map((line) => line.trim().replace(/^[-*•]\s+/, ''))
		.filter(Boolean)
		.slice(0, max);
}

function block(title: string, lines: string[], numbered = false) {
	if (lines.length === 0) return '';
	const body = lines.map((line, index) => (numbered ? `${index + 1}. ${line}` : `- ${line}`));
	return `## ${title}\n${body.join('\n')}`;
}

/**
 * El prompt entero a partir de lo que hay en el formulario. Sin petición no hay
 * nada que montar: devuelve cadena vacía y la interfaz enseña la ayuda.
 */
export function buildPrompt(draft: Draft): string {
	const request = draft.request.trim();
	if (!request) return '';

	const task = getTask(draft.task);
	const stack = draft.stack.trim().replace(/\s+/g, ' ');
	const detailed = draft.level === 'detallado';
	const short = draft.level === 'corto';

	const role = stack ? `${task.role} con experiencia en ${stack}` : task.role;

	const context = [
		stack ? `Stack: ${stack}.` : 'Stack: sin decidir, elígelo tú y dilo en la primera línea.',
		...bullets(draft.context),
	];

	const asks = [
		...(short ? task.asks.slice(0, 3) : task.asks),
		...(detailed ? task.extra : []),
		...EXTRAS.filter((extra) => draft.extras.includes(extra.id)).map((extra) => extra.line),
	];

	const parts = [
		`Actúa como ${role}. ${task.frame}`,
		`## Objetivo\n${sentence(request)}`,
		block('Contexto', context),
		block('Qué espero de ti', asks, true),
		block('Restricciones', bullets(draft.constraints)),
		block('Formato de la respuesta', short ? task.output.slice(0, 1) : task.output),
		detailed ? block('Criterios de aceptación', task.accept) : '',
	];

	return parts.filter(Boolean).join('\n\n');
}

function field(value: unknown) {
	return typeof value === 'string' ? value.slice(0, MAX_LENGTH) : '';
}

export function readDraft(): Draft {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return DEFAULT_DRAFT;

		const parsed = JSON.parse(saved) as Partial<Record<keyof Draft, unknown>>;
		if (!parsed || typeof parsed !== 'object') return DEFAULT_DRAFT;

		const extras = Array.isArray(parsed.extras) ? parsed.extras : [];

		return {
			task: getTask(String(parsed.task)).id,
			request: field(parsed.request),
			stack: field(parsed.stack),
			context: field(parsed.context),
			constraints: field(parsed.constraints),
			level: LEVELS.some((level) => level.id === parsed.level)
				? (parsed.level as LevelId)
				: DEFAULT_DRAFT.level,
			extras: EXTRAS.filter((extra) => extras.includes(extra.id)).map((extra) => extra.id),
		};
	} catch {
		// Sin almacenamiento, o con basura dentro: se empieza en blanco.
		return DEFAULT_DRAFT;
	}
}

export function saveDraft(draft: Draft) {
	try {
		localStorage.setItem(KEY, JSON.stringify(draft));
	} catch {
		// Si no deja guardar, lo escrito dura lo que dure la pestaña.
	}
}
