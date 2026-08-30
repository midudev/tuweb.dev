/*
 * El generador de chistes. Aquí está lo que no es interfaz: los chistes, cómo
 * se elige el siguiente sin repetir y lo que se guarda entre visitas.
 *
 * No hay servidor detrás. Los chistes salen de esta lista y la voz la pone el
 * propio navegador, así que nada de esto viaja a ninguna parte.
 */

export interface Joke {
	/** Categoría e índice: `dev-3`. Es lo que se guarda en favoritos. */
	id: string;
	/** El planteamiento, lo que se lee primero. */
	setup: string;
	/** El remate, que se tapa hasta que lo pides o hasta que la voz llega. */
	punch: string;
}

interface RawCategory {
	id: string;
	label: string;
	/** Un icono de Tabler. */
	icon: string;
	jokes: [string, string][];
}

const RAW: RawCategory[] = [
	{
		id: 'dev',
		label: 'Programadores',
		icon: 'code',
		jokes: [
			['¿Por qué los de backend no juegan al escondite?', 'Porque siempre acaban devolviendo un 404.'],
			['¿Cuántos programadores hacen falta para cambiar una bombilla?', 'Ninguno: eso es un problema de hardware.'],
			[
				'Le dicen a un programador: baja al súper, trae una barra de pan y si hay huevos, doce.',
				'Volvió con doce barras de pan.',
			],
			['¿Por qué el CSS fue al psicólogo?', 'Porque no encontraba su sitio y todo le venía heredado.'],
			['¿Por qué los programadores confunden Halloween con Navidad?', 'Porque OCT 31 es DEC 25.'],
			['Tengo un chiste buenísimo sobre programación asíncrona.', 'Pero no sé cuándo te va a llegar.'],
			[
				'Entra un tester en un bar. Pide una cerveza. Pide cero cervezas. Pide menos una cerveza. Pide un lagarto.',
				'El bar arde. El primer cliente de verdad entra y pregunta dónde está el baño.',
			],
			['¿Cómo se llama un bug que llega a producción y nadie arregla?', 'Funcionalidad.'],
			['¿Por qué aquel desarrollador se quedó sin compañeros?', 'Por hacer git push --force un viernes a las siete.'],
		],
	},
	{
		id: 'malos',
		label: 'Malos',
		icon: 'mood-happy',
		jokes: [
			['¿Qué hace una abeja en el gimnasio?', 'Zum-ba.'],
			['¿Cómo se despiden los químicos?', 'Ácido un placer.'],
			['¿Cuál fue el último animal en subir al arca de Noé?', 'El del-fin.'],
			['¿Qué le dice un techo a otro techo?', 'Techo de menos.'],
			['¿Qué hace un pez dentro de un ordenador?', 'Nada.'],
			['¿Qué le dice el número tres al número treinta?', 'Para ser como yo tienes que ser sincero.'],
			['¿Por qué el libro de matemáticas estaba tan triste?', 'Porque tenía demasiados problemas.'],
			['¿Qué le dijo una impresora a otra impresora?', 'Esa hoja es tuya o son imaginaciones mías.'],
			['¿Qué le dice un semáforo a otro?', 'No me mires, que me estoy cambiando.'],
		],
	},
	{
		id: 'animales',
		label: 'Animales',
		icon: 'cat',
		jokes: [
			['¿Qué le dice una iguana a su hermana gemela?', 'Somos iguanitas.'],
			['¿Qué hace un perro con un taladro?', 'Taladrando.'],
			['¿Por qué las focas del circo miran siempre para arriba?', 'Porque ahí están los focos.'],
			['¿Qué le dice un gusano a otro gusano?', 'Me voy a dar una vuelta a la manzana.'],
			['¿Cómo se llama el pez más negativo del mar?', 'Pesimista.'],
			['¿Qué hace un caracol subido en la espalda de una tortuga?', 'Gritar: qué velocidad.'],
			['¿Qué le dice un cocodrilo a otro cuando se despiden?', 'Nos vemos a lagarto plazo.'],
			['¿Por qué la vaca no usa despertador?', 'Porque siempre se levanta con el mú de las seis.'],
		],
	},
	{
		id: 'oficina',
		label: 'Oficina',
		icon: 'briefcase',
		jokes: [
			['¿Por qué terminó tan pronto la reunión?', 'Porque alguien se dio cuenta de que podía haber sido un correo.'],
			['Jefe, ¿me sube el sueldo?', 'Claro: hasta el segundo piso te lo subo.'],
			['¿Qué tienen en común el café y la impresora de la oficina?', 'Que los dos se atascan los lunes.'],
			['¿Cuál es la parte más rápida de un proyecto?', 'La estimación.'],
			['¿Por qué el becario apagó el servidor de producción?', 'Porque le dijeron que cerrara todo al salir.'],
			['¿Qué es un consultor?', 'Alguien que te pide el reloj para decirte la hora y luego te factura el reloj.'],
			['¿Qué le dice el viernes a la bandeja de entrada?', 'Ahí te quedas.'],
			['¿Por qué la reunión de quince minutos duró una hora?', 'Porque a los diez minutos alguien dijo: una cosa rápida.'],
		],
	},
	{
		id: 'colegio',
		label: 'Colegio',
		icon: 'school',
		jokes: [
			['Mamá, en el colegio me llaman despistado.', 'Niño, que esta es la panadería.'],
			['Jaimito, dime dos pronombres.', '¿Quién, yo? Muy bien, Jaimito.'],
			['¿Cuál es el colmo de un profesor de geografía?', 'Perder el norte.'],
			['Papá, ¿me haces los deberes?', 'No estaría bien, hijo. Ya, pero inténtalo.'],
			['¿Qué le dice el cero al ocho?', 'Bonito cinturón.'],
			['¿Cuál es el animal más antiguo del mundo?', 'La cebra, que todavía va en blanco y negro.'],
			['Jaimito, ¿por qué has entregado el examen en blanco?', 'Para que no diga que copio.'],
			['¿Por qué el libro de historia no duerme por las noches?', 'Porque no para de darle vueltas al pasado.'],
		],
	},
	{
		id: 'bar',
		label: 'De bar',
		icon: 'beer',
		jokes: [
			['Camarero, este filete tiene muchos nervios.', 'Normal, es la primera vez que lo sirven.'],
			['Camarero, hay una mosca en mi sopa.', 'Tranquilo, la araña del pan se encarga.'],
			['Camarero, ¿el pescado está fresco?', 'Tanto que todavía no se ha enterado.'],
			['Entra un caballo en un bar y el camarero le pregunta: ¿por qué esa cara tan larga?', 'Por la hipoteca.'],
			['Camarero, póngame lo mismo que a aquel señor.', 'Señor, aquel está pagando la cuenta.'],
			['Camarero, ¿me pone un café solo?', 'Puedo, pero me quedo aquí al lado por si necesita algo.'],
			['Camarero, póngame algo fresco y cargadito.', 'Le pongo un ventilador y una batería.'],
			['¿Qué le dice un vaso a otro en la barra?', 'Estamos a rebosar.'],
		],
	},
];

export interface Category {
	id: string;
	label: string;
	icon: string;
	jokes: Joke[];
}

export const CATEGORIES: Category[] = RAW.map((category) => ({
	id: category.id,
	label: category.label,
	icon: category.icon,
	jokes: category.jokes.map(([setup, punch], index) => ({
		id: `${category.id}-${index}`,
		setup,
		punch,
	})),
}));

export const JOKES: Joke[] = CATEGORIES.flatMap((category) => category.jokes);

export function getCategory(id: string) {
	return CATEGORIES.find((category) => category.id === id);
}

export function getJoke(id: string) {
	return JOKES.find((joke) => joke.id === id);
}

/** De qué categoría es un chiste, para enseñarlo bajo el texto. */
export function labelOf(joke: Joke) {
	return getCategory(joke.id.split('-')[0])?.label ?? '';
}

/**
 * El siguiente chiste: de la categoría elegida —o de todas— y nunca el que ya
 * está puesto. Cuando se acaban los que no se han visto, se vuelve a empezar:
 * más vale repetir que quedarse en blanco.
 */
export function pickJoke(categoryId: string, seen: string[], current?: string): Joke {
	const pool = getCategory(categoryId)?.jokes ?? JOKES;
	const fresh = pool.filter((joke) => !seen.includes(joke.id));
	const options = (fresh.length > 0 ? fresh : pool).filter((joke) => joke.id !== current);
	const list = options.length > 0 ? options : pool;

	return list[Math.floor(Math.random() * list.length)];
}

/** El chiste tal cual se copia y tal cual se lee. */
export function fullText(joke: Joke) {
	return `${joke.setup}\n${joke.punch}`;
}

export interface Settings {
	/** El id de la categoría, o «todos». */
	category: string;
	/** El voiceURI de la voz elegida; vacío es la que ponga el navegador. */
	voice: string;
	rate: number;
	pitch: number;
	/** Los ids guardados, del último al primero. */
	saved: string[];
}

export const ALL = 'todos';

export const DEFAULT_SETTINGS: Settings = {
	category: ALL,
	voice: '',
	rate: 1,
	pitch: 1,
	saved: [],
};

/** Ni tan lento que aburra ni tan rápido que no se entienda el remate. */
export const RATE = { min: 0.6, max: 1.6, step: 0.1 };
export const PITCH = { min: 0.6, max: 1.6, step: 0.1 };

/** Los guardados son un cajón, no un archivo. */
const MAX_SAVED = 30;

const KEY = 'tuweb:chistes';

function number(value: unknown, fallback: number, min: number, max: number) {
	const parsed = typeof value === 'number' ? value : Number.NaN;
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(max, Math.max(min, Math.round(parsed * 10) / 10));
}

export function readSettings(): Settings {
	try {
		const saved = localStorage.getItem(KEY);
		if (!saved) return { ...DEFAULT_SETTINGS };

		const parsed = JSON.parse(saved) as Partial<Record<keyof Settings, unknown>>;
		if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS };

		const ids = Array.isArray(parsed.saved) ? parsed.saved : [];

		return {
			category: getCategory(String(parsed.category)) ? String(parsed.category) : ALL,
			voice: typeof parsed.voice === 'string' ? parsed.voice.slice(0, 200) : '',
			rate: number(parsed.rate, DEFAULT_SETTINGS.rate, RATE.min, RATE.max),
			pitch: number(parsed.pitch, DEFAULT_SETTINGS.pitch, PITCH.min, PITCH.max),
			saved: ids.filter((id): id is string => typeof id === 'string' && Boolean(getJoke(id))).slice(0, MAX_SAVED),
		};
	} catch {
		// Sin almacenamiento, o con basura dentro: se empieza de cero.
		return { ...DEFAULT_SETTINGS };
	}
}

export function saveSettings(settings: Settings) {
	try {
		localStorage.setItem(KEY, JSON.stringify({ ...settings, saved: settings.saved.slice(0, MAX_SAVED) }));
	} catch {
		// Si no deja guardar, los ajustes duran lo que dure la pestaña.
	}
}

/** Una voz en español, y si no la hay, la primera que ofrezca el navegador. */
export function pickVoice(voices: SpeechSynthesisVoice[], wanted: string) {
	return (
		voices.find((voice) => voice.voiceURI === wanted) ??
		voices.find((voice) => voice.lang.toLowerCase().startsWith('es')) ??
		voices[0]
	);
}

/** Las de español delante: son las que van a sonar bien con este texto. */
export function sortVoices(voices: SpeechSynthesisVoice[]) {
	return [...voices].sort((a, b) => {
		const es = Number(b.lang.toLowerCase().startsWith('es')) - Number(a.lang.toLowerCase().startsWith('es'));
		return es !== 0 ? es : a.name.localeCompare(b.name, 'es');
	});
}
