/*
 * La guía de trabajar con IA y con Spec Driven Development. Aquí está el
 * contenido —principios, ciclo, prompts, plantilla, checklist y señales de
 * alarma—; el componente solo lo pinta.
 *
 * No hay modelo detrás ni se envía nada: los prompts se copian y se pegan
 * donde los uses, y lo que marcas en la checklist se queda en tu navegador.
 */

export interface Principle {
	/** Un icono de Tabler. */
	icon: string;
	title: string;
	body: string;
}

export const PRINCIPLES: Principle[] = [
	{
		icon: 'file-text',
		title: 'La spec manda',
		body: 'Lo que se escribe primero es qué tiene que pasar, no cómo. El código es la salida; si la spec está torcida, el código sale torcido más rápido.',
	},
	{
		icon: 'stack-2',
		title: 'Un encargo, una tarea',
		body: 'Pedir tres cosas a la vez sale barato y se paga en el diff. Una tarea por vuelta, y que el proyecto siga funcionando al acabarla.',
	},
	{
		icon: 'eye-check',
		title: 'Tú lees el diff',
		body: 'El resumen que te escribe la IA no es el cambio. Lo que se mergea es lo que pone en las líneas, y esas las lees tú, enteras.',
	},
	{
		icon: 'clipboard-check',
		title: 'El criterio, antes del código',
		body: 'Si no sabes cómo vas a comprobar que está bien, todavía no se puede pedir. Primero cómo se verifica, después quién lo escribe.',
	},
	{
		icon: 'search',
		title: 'Contexto corto y fresco',
		body: 'Una conversación de cien vueltas se acuerda de todo menos de lo que importa. Cuando se enrede, abre otra con la spec y el estado de ahora.',
	},
	{
		icon: 'shield-check',
		title: 'Sin explicación no se mergea',
		body: 'Si no sabes contar por qué cada línea está ahí, no es tuyo y no lo mantienes. Preguntar hasta entenderlo forma parte del trabajo.',
	},
];

export interface Phase {
	id: string;
	title: string;
	/** Un icono de Tabler. */
	icon: string;
	/** Qué se busca en esta fase, en una línea. */
	goal: string;
	/** Lo que se hace aquí. */
	does: string[];
	/** Lo que no toca todavía. */
	avoid: string[];
	/** El prompt de la fase, para copiar y pegar. */
	prompt: string;
	/** Cuándo se puede pasar a la siguiente. */
	gate: string;
}

export const PHASES: Phase[] = [
	{
		id: 'especificar',
		title: 'Especificar',
		icon: 'file-text',
		goal: 'Escribir qué tiene que pasar y para quién, sin decidir todavía cómo.',
		does: [
			'El problema en dos frases, sin solución dentro.',
			'El comportamiento en frases «cuando… entonces…».',
			'Los casos límite y lo que queda fuera.',
		],
		avoid: ['Nombres de ficheros', 'Elegir librería', 'Cualquier línea de código'],
		prompt: `Antes de escribir código, escribe la especificación de este cambio.

Qué quiero: <una línea>
Dónde: <la zona del proyecto que toca>

Devuélvemelo en este orden:
1. El problema en dos frases, sin solución dentro.
2. El comportamiento esperado, en frases «cuando… entonces…».
3. Los casos límite, y qué debe pasar en cada uno.
4. Lo que queda fuera de este cambio.
5. Las preguntas que no puedes responder tú solo.

No propongas implementación todavía. Si algo es ambiguo, pregunta en vez de suponer.`,
		gate: 'Pasas cuando la spec cabe en una pantalla y la entiende alguien que no eres tú.',
	},
	{
		id: 'plan',
		title: 'Planificar',
		icon: 'sitemap',
		goal: 'Decidir el cómo por escrito, mientras todavía es barato cambiarlo.',
		does: [
			'Qué ficheros se tocan y qué cambia en cada uno.',
			'Qué se reutiliza de lo que ya existe.',
			'Por dónde puede romperse algo que hoy funciona.',
		],
		avoid: ['Empezar a escribir «ya que estamos»', 'Aceptar el primer plan sin ver otro'],
		prompt: `Esta es la spec aprobada:
<pega aquí la spec>

Hazme el plan técnico, todavía sin código:
- Los ficheros que tocas y qué cambia en cada uno.
- Lo que reutilizas de lo que ya existe, con su ruta.
- El orden de los cambios, y por qué ese orden.
- Los tres sitios por donde esto puede romper algo que ya funciona.
- Una alternativa más simple que hayas descartado, y por qué.

Párate en el plan. No escribas código hasta que te lo apruebe.`,
		gate: 'Pasas cuando puedes contar el plan de memoria y no hay ningún fichero ahí «por si acaso».',
	},
	{
		id: 'tareas',
		title: 'Trocear',
		icon: 'list-check',
		goal: 'Partir el plan en cambios que se leen de una sentada.',
		does: [
			'Cada tarea deja el proyecto funcionando.',
			'Cada tarea lleva su criterio de aceptación.',
			'El orden está claro y las dependencias, marcadas.',
		],
		avoid: ['Tareas de «y además»', 'Dejar cosas a medias para la siguiente'],
		prompt: `Del plan aprobado, sácame la lista de tareas.

Cada tarea tiene que:
- Caber en un diff que se lee de una sentada.
- Dejar el proyecto funcionando; nada de «esto se arregla en la siguiente».
- Llevar su criterio de aceptación: cómo compruebo yo que está hecha.

Numéralas en el orden en que hay que hacerlas y marca cuáles dependen de otra.
No las implementes.`,
		gate: 'Pasas cuando ninguna tarea necesita explicación aparte para entenderse.',
	},
	{
		id: 'implementar',
		title: 'Implementar',
		icon: 'code',
		goal: 'Una tarea, un diff. Después se vuelve a mirar.',
		does: [
			'Se pide solo la tarea que toca.',
			'Se sigue lo que ya hay: convenciones, nombres, estilo.',
			'Lo que no estaba en la spec no entra.',
		],
		avoid: ['Dependencias nuevas', 'Refactors de propina', 'Opciones que no pidió nadie'],
		prompt: `Haz solo la tarea 1. Nada más.

Reglas:
- Mira antes el código que ya hay y sigue sus convenciones.
- Sin dependencias nuevas.
- Sin código muerto, sin TODO y sin opciones que no pidió nadie.
- Si la spec se queda corta, párate y pregunta en vez de inventar.

Al terminar, dame el diff y debajo una línea por fichero: qué cambia y por qué.`,
		gate: 'Pasas cuando el diff hace lo de la tarea y nada más.',
	},
	{
		id: 'revisar',
		title: 'Revisar',
		icon: 'eye-check',
		goal: 'La parte que no se delega. Lo lees tú y lo ejecutas tú.',
		does: [
			'Se lee el diff entero, línea a línea.',
			'Se comprueba contra la spec: lo que sobra y lo que falta.',
			'Se ejecuta, no solo se lee.',
		],
		avoid: ['Fiarte del resumen', 'Aprobar lo que no sabrías explicar'],
		prompt: `Repasa tu propio cambio antes de que lo mire yo.

- ¿Qué hace el diff que la spec no pedía? Quítalo.
- ¿Qué pide la spec que el diff no hace? Dímelo.
- ¿Qué caso límite no está cubierto? Enséñame la línea que lo cubre o admite que falta.
- ¿Qué has supuesto sin confirmarlo?
- ¿Cuál es la parte del cambio de la que menos seguro estás?

Sin adornos: si algo está a medias, dilo.`,
		gate: 'Pasas cuando sabes explicar cada línea sin volver a preguntar.',
	},
];

export interface Extra {
	id: string;
	title: string;
	/** Cuándo se usa. */
	when: string;
	prompt: string;
}

/** Prompts sueltos para los ratos que no son una fase del ciclo. */
export const EXTRAS: Extra[] = [
	{
		id: 'entender',
		title: 'Entender antes de tocar',
		when: 'Cuando el código es de otro, o tuyo de hace un año.',
		prompt: `Explícame este módulo antes de que lo toquemos:
<pega el fichero o dime la ruta>

- Qué hace, en tres frases.
- Quién lo llama y a quién llama.
- Qué invariantes da por supuestas y dónde se rompen si las cambio.
- Qué parte tiene pinta de haberse escrito con prisa.

Solo lectura: no propongas cambios todavía.`,
	},
	{
		id: 'bug',
		title: 'Reproducir antes de arreglar',
		when: 'Cuando hay un fallo y la tentación es parchear a ciegas.',
		prompt: `Hay un bug. Antes de arreglarlo, quiero reproducirlo.

Síntoma: <qué ves>
Cuándo pasa: <pasos>

- Dame el test más pequeño que falle por este motivo y por ningún otro.
- Dime qué hipótesis descarta ese test si pasa.
- No arregles nada todavía: primero quiero verlo fallar.`,
	},
	{
		id: 'contraria',
		title: 'Revisión a la contra',
		when: 'Antes de mergear algo que te da un poco de miedo.',
		prompt: `Ponte a romper este cambio, no a defenderlo:
<pega el diff>

- Tres entradas con las que se comporta mal.
- Qué pasa con concurrencia, con datos vacíos y con datos enormes.
- Qué falla en silencio en vez de dar error.
- Si tuvieras que revertirlo en producción a las tres de la mañana, ¿qué se te complica?

No me digas que está bien: dime por dónde se rompe.`,
	},
];

/** El esqueleto de una spec, para empezar sin folio en blanco. */
export const SPEC_TEMPLATE = `# <título del cambio>

## Problema
Qué duele hoy y a quién. Sin solución dentro.

## Fuera de alcance
Lo que este cambio no toca.

## Comportamiento
- Cuando <situación>, entonces <resultado>.
- Cuando <situación>, entonces <resultado>.

## Casos límite
- <caso> → <qué pasa>

## Criterios de aceptación
- [ ] <cómo se comprueba>
- [ ] <cómo se comprueba>

## Riesgos
- <qué puede romper> → <cómo nos enteramos a tiempo>

## Decidido
- <decisión>, porque <motivo>`;

export interface CheckGroup {
	title: string;
	items: { id: string; text: string }[];
}

/** La revisión manual: lo que no delegas, en el orden en que toca. */
export const CHECKS: CheckGroup[] = [
	{
		title: 'Antes de pedir',
		items: [
			{ id: 'spec', text: 'La spec cabe en una pantalla y la entiende alguien que no eres tú.' },
			{ id: 'criterio', text: 'Sabes cómo comprobarás que está bien antes de que exista el código.' },
			{ id: 'una', text: 'El encargo es una tarea, no cinco disfrazadas de una.' },
		],
	},
	{
		title: 'Al leer el diff',
		items: [
			{ id: 'entero', text: 'Has leído el diff entero, línea a línea, no el resumen.' },
			{ id: 'motivo', text: 'Cada fichero tocado tiene su motivo en la spec.' },
			{ id: 'sobra', text: 'No hay nada que no pidió nadie: opciones, abstracciones, «por si acaso».' },
			{ id: 'nombres', text: 'Los nombres dicen lo que hacen las cosas.' },
			{ id: 'limites', text: 'Los casos límite están cubiertos y has visto dónde.' },
			{ id: 'explicar', text: 'Sabes explicar cada línea sin volver a preguntar.' },
		],
	},
	{
		title: 'Antes de mergear',
		items: [
			{ id: 'ejecutado', text: 'Lo has ejecutado tú, no solo leído.' },
			{ id: 'tests', text: 'Los tests fallan si quitas el arreglo.' },
			{ id: 'secretos', text: 'No hay claves, secretos ni rutas de tu máquina en el diff.' },
			{ id: 'vuelta', text: 'Si esto rompe algo, sabes cómo volver atrás.' },
		],
	},
];

export const CHECK_IDS = CHECKS.flatMap((group) => group.items.map((item) => item.id));

export interface Smell {
	sign: string;
	fix: string;
}

/** Las señales de que se te está yendo el foco, y qué hacer con cada una. */
export const SMELLS: Smell[] = [
	{
		sign: 'Apruebas un diff que no has leído entero.',
		fix: 'Pídelo en trozos hasta que quepa en tu cabeza. Si no cabe, la tarea era demasiado grande.',
	},
	{
		sign: 'Llevas cinco vueltas con el mismo fallo.',
		fix: 'Para. Escribe a mano el caso que falla, tira la conversación y empieza con eso delante.',
	},
	{
		sign: 'El chat es más largo que el fichero.',
		fix: 'Contexto quemado. Abre uno nuevo con la spec y el estado de ahora, no con el histórico.',
	},
	{
		sign: 'No sabes por qué funciona.',
		fix: 'Entonces no funciona. Que te lo explique, y compruébalo tú en el código.',
	},
	{
		sign: 'Te proponen una librería nueva para tres líneas.',
		fix: 'Di que no. Con lo que ya hay, o no se hace.',
	},
	{
		sign: 'El cambio hace más de lo que pediste.',
		fix: 'Vuelve a la spec. Lo que sobra se queda fuera, aunque esté bien escrito.',
	},
];

const KEY = 'tuweb:sdd';

/** Lo marcado se queda en tu navegador; si hay basura dentro, se ignora. */
export function readChecked(): string[] {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return [];

		const parsed = JSON.parse(saved) as unknown;
		if (!Array.isArray(parsed)) return [];

		return parsed.filter((id): id is string => typeof id === 'string' && CHECK_IDS.includes(id));
	} catch {
		// Sin localStorage, o con algo que no es nuestro: la lista en blanco.
		return [];
	}
}

export function saveChecked(ids: string[]) {
	try {
		if (ids.length === 0) localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, JSON.stringify(ids));
	} catch {
		// Si no deja guardar, lo marcado dura la visita.
	}
}
