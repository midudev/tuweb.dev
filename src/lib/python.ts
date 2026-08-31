/*
 * El juego de Python: cuatro niveles de retos para aprender el lenguaje sin
 * escribir una línea. Aquí no se ejecuta Python ni nada parecido; los retos y
 * sus respuestas están escritos a mano y todo se resuelve en el navegador. Lo
 * que avanzas vive en tu localStorage y no sale de ahí.
 */

/** Las tres formas que tiene un reto de preguntar. */
export type Kind = 'salida' | 'hueco' | 'error';

export interface Challenge {
	/** El enunciado, corto. */
	ask: string;
	kind: Kind;
	/** El código del reto, línea a línea. */
	code: string[];
	/** Las opciones. En los de «error» no hay: se pulsa la línea que falla. */
	options?: string[];
	/** La buena: el índice de la opción, o el de la línea en los de «error». */
	answer: number;
	/** El empujón, si te atascas. Cuesta la mitad de los puntos. */
	hint: string;
	/** Por qué es esa y no otra. Sale siempre, aciertes o no. */
	why: string;
}

export interface Level {
	id: string;
	title: string;
	/** Un icono de Tabler para el botón del nivel. */
	icon: string;
	/** Lo que se aprende aquí, en una línea. */
	blurb: string;
	challenges: Challenge[];
}

export const LEVELS: readonly Level[] = [
	{
		id: 'basico',
		title: 'Lo básico',
		icon: 'letter-case',
		blurb: 'Variables, tipos, cadenas y los dos puntos que se te olvidan.',
		challenges: [
			{
				ask: '¿Qué imprime?',
				kind: 'salida',
				code: ['print(7 // 2, 7 / 2)'],
				options: ['3 3.5', '3.5 3.5', '3 3', '4 3.5'],
				answer: 0,
				hint: 'Son dos divisiones distintas: una se queda corta a propósito.',
				why: '// divide y se queda con la parte entera; / siempre devuelve un float, aunque la división sea exacta.',
			},
			{
				ask: 'Queremos que imprima 32. ¿Qué va en el hueco?',
				kind: 'hueco',
				code: ['edad = "31"', 'print(___(edad) + 1)'],
				options: ['int', 'str', 'len', 'bool'],
				answer: 0,
				hint: 'Fíjate en las comillas de "31": eso no es un número todavía.',
				why: 'int() convierte la cadena en número entero. Sumarle 1 a una cadena revienta, y len() contaría caracteres, no valores.',
			},
			{
				ask: 'Este código no arranca. ¿Qué línea falla?',
				kind: 'error',
				code: ['edad = 18', 'if edad >= 18', '    print("puede pasar")'],
				answer: 1,
				hint: 'Le falta un signo al final, y es el mismo que llevan def y for.',
				why: 'La cabecera de un if termina en dos puntos: if edad >= 18:. Sin ellos, Python no sabe dónde empieza el bloque.',
			},
			{
				ask: 'Queremos que imprima «hola, midu». ¿Qué va en el hueco?',
				kind: 'hueco',
				code: ['nombre = "midu"', 'print(f"hola, ___")'],
				options: ['{nombre}', 'nombre', '$nombre', '[nombre]'],
				answer: 0,
				hint: 'La f de delante de las comillas está ahí por algo.',
				why: 'En una f-string lo que va entre llaves se sustituye por su valor. Sin llaves saldría la palabra tal cual.',
			},
		],
	},
	{
		id: 'listas',
		title: 'Listas y bucles',
		icon: 'list-numbers',
		blurb: 'Índices, range, append y la indentación que lo decide todo.',
		challenges: [
			{
				ask: '¿Qué imprime?',
				kind: 'salida',
				code: ['numeros = [1, 2, 3, 4]', 'print(numeros[1], numeros[-1])'],
				options: ['2 4', '1 4', '2 3', '1 3'],
				answer: 0,
				hint: 'El primer elemento no es el 1: es el 0.',
				why: 'Se empieza a contar en 0, así que [1] es el segundo. Los índices negativos cuentan desde el final: [-1] es el último.',
			},
			{
				ask: '¿Qué imprime?',
				kind: 'salida',
				code: ['for i in range(3):', '    print(i, end=" ")'],
				options: ['0 1 2', '1 2 3', '0 1 2 3', '3'],
				answer: 0,
				hint: 'range no incluye el número que le pasas.',
				why: 'range(3) va de 0 a 2: son tres vueltas y el final nunca entra. El end=" " separa con espacios en vez de saltar de línea.',
			},
			{
				ask: 'Queremos que salga ["ana", "leo", "sam"]. ¿Qué va en el hueco?',
				kind: 'hueco',
				code: ['nombres = ["ana", "leo"]', 'nombres.___("sam")', 'print(nombres)'],
				options: ['append', 'add', 'push', 'insert'],
				answer: 0,
				hint: 'Hay uno que es de los conjuntos y otro que ni existe en Python.',
				why: 'En las listas se añade al final con append. add es de los conjuntos, push no existe e insert pediría además la posición.',
			},
			{
				ask: 'Este código no arranca. ¿Qué línea falla?',
				kind: 'error',
				code: ['numeros = [1, 2, 3]', 'total = 0', 'for n in numeros:', 'total += n', 'print(total)'],
				answer: 3,
				hint: 'En Python los bloques no llevan llaves. Llevan otra cosa.',
				why: 'El cuerpo del bucle va indentado. Sin la sangría, Python no sabe qué hay que repetir y corta con un IndentationError.',
			},
		],
	},
	{
		id: 'funciones',
		title: 'Funciones',
		icon: 'function',
		blurb: 'return, argumentos por defecto y el None que aparece sin avisar.',
		challenges: [
			{
				ask: '¿Qué imprime?',
				kind: 'salida',
				code: ['def suma(a, b=10):', '    return a + b', '', 'print(suma(5))'],
				options: ['15', '5', '10', 'Da error'],
				answer: 0,
				hint: 'A b ya le han dado un valor en la definición.',
				why: 'b tiene valor por defecto: si no se pasa, vale 10. Los argumentos con defecto van siempre al final.',
			},
			{
				ask: 'Queremos que imprima 9. ¿Qué va en el hueco?',
				kind: 'hueco',
				code: ['def cuadrado(n):', '    ___ n * n', '', 'print(cuadrado(3))'],
				options: ['return', 'print', 'yield', 'pass'],
				answer: 0,
				hint: 'La función tiene que entregar el número, no enseñarlo ella.',
				why: 'return devuelve el valor a quien llama. Con print se vería el 9, pero la función devolvería None y el print de fuera lo imprimiría.',
			},
			{
				ask: 'Este código revienta al ejecutarlo. ¿Qué línea falla?',
				kind: 'error',
				code: ['def area(base, altura):', '    return base * altura / 2', '', 'print(area(10))'],
				answer: 3,
				hint: 'Cuenta lo que pide la función y lo que le llega.',
				why: 'area pide dos argumentos y solo se le pasa uno: falta la altura. Python corta con un TypeError al llamarla.',
			},
			{
				ask: '¿Qué imprime?',
				kind: 'salida',
				code: ['def saluda(nombre):', '    print("hola", nombre)', '', 'resultado = saluda("midu")', 'print(resultado)'],
				options: [
					'hola midu y después None',
					'hola midu y después una línea vacía',
					'solo hola midu',
					'Da error: la función no devuelve nada',
				],
				answer: 0,
				hint: 'La función imprime, pero ¿qué guarda resultado?',
				why: 'Una función sin return devuelve None. Imprimir no es devolver: son dos cosas distintas.',
			},
		],
	},
	{
		id: 'diccionarios',
		title: 'Diccionarios y clases',
		icon: 'braces',
		blurb: 'Claves, get, self y los métodos que se dejan el primer parámetro.',
		challenges: [
			{
				ask: '¿Qué imprime?',
				kind: 'salida',
				code: ['edades = {"ana": 30}', 'print(edades.get("leo", 0))'],
				options: ['0', 'None', 'Da error: la clave no existe', '30'],
				answer: 0,
				hint: 'El segundo argumento de get está ahí para cuando no hay clave.',
				why: 'get devuelve el valor por defecto si la clave no está, en vez de reventar. Con edades["leo"] sí saltaría un KeyError.',
			},
			{
				ask: '¿Qué imprime?',
				kind: 'salida',
				code: ['datos = {"a": 1, "b": 2}', 'for clave in datos:', '    print(clave, end="")'],
				options: ['ab', '12', 'a1b2', "('a', 1)('b', 2)"],
				answer: 0,
				hint: 'Recorrer un diccionario a pelo no da los dos lados.',
				why: 'Recorrer un diccionario da sus claves. Para los valores está .values() y para los dos a la vez, .items().',
			},
			{
				ask: 'Queremos que imprima «michi». ¿Qué va en el hueco?',
				kind: 'hueco',
				code: [
					'class Gato:',
					'    def __init__(self, nombre):',
					'        ___.nombre = nombre',
					'',
					'michi = Gato("michi")',
					'print(michi.nombre)',
				],
				options: ['self', 'this', 'cls', 'Gato'],
				answer: 0,
				hint: 'Ya está escrito ahí arriba, entre los paréntesis.',
				why: 'El primer parámetro de un método es el propio objeto y por costumbre se llama self. Guardar algo en self.nombre lo deja en esa instancia.',
			},
			{
				ask: 'Este código revienta al ejecutarlo. ¿Qué línea falla?',
				kind: 'error',
				code: [
					'class Perro:',
					'    def __init__(self, nombre):',
					'        self.nombre = nombre',
					'',
					'    def ladra():',
					'        print(self.nombre, "guau")',
					'',
					'toby = Perro("toby")',
					'toby.ladra()',
				],
				answer: 4,
				hint: 'Compara esa cabecera con la del método de arriba.',
				why: 'A ladra le falta self. Los métodos reciben el objeto como primer parámetro: def ladra(self):.',
			},
		],
	},
];

/** Las vidas de cada intento. Tres fallos y el nivel se repite. */
export const LIVES = 3;
/** Lo que vale un acierto a la primera, antes de la racha. */
export const POINTS = 10;
/** Con pista pedida vale la mitad: la ayuda se paga. */
export const HINT_POINTS = 5;
/** Cada acierto seguido suma esto de más, sin tope. */
export const STREAK_BONUS = 2;

const KEY = 'tuweb:python';

export interface Progress {
	/** Los niveles pasados, por id. De aquí sale lo que está abierto. */
	done: string[];
	/** La mejor puntuación de cada nivel, por id. */
	best: Record<string, number>;
}

/** Uno nuevo cada vez: quien lo recibe lo va tocando según juega. */
function empty(): Progress {
	return { done: [], best: {} };
}

/** Un nivel está abierto si es el primero o si pasaste el de antes. */
export function isOpen(index: number, progress: Progress) {
	return index === 0 || progress.done.includes(LEVELS[index - 1].id);
}

/** Lo que se guarda puede venir tocado a mano: se deja solo lo que cuadra. */
function toProgress(value: unknown): Progress {
	if (!value || typeof value !== 'object') return empty();

	const raw = value as Partial<Progress>;
	const ids = LEVELS.map((level) => level.id);

	const done = Array.isArray(raw.done)
		? ids.filter((id) => (raw.done as unknown[]).includes(id))
		: [];

	const best: Record<string, number> = {};
	if (raw.best && typeof raw.best === 'object') {
		for (const id of ids) {
			const score = (raw.best as Record<string, unknown>)[id];
			if (typeof score === 'number' && Number.isFinite(score) && score > 0) {
				best[id] = Math.floor(score);
			}
		}
	}

	return { done, best };
}

export function readProgress(): Progress {
	try {
		const saved = localStorage.getItem(KEY);
		return saved ? toProgress(JSON.parse(saved) as unknown) : empty();
	} catch {
		// Sin almacenamiento, o con basura dentro: se empieza de cero.
		return empty();
	}
}

export function saveProgress(progress: Progress) {
	try {
		localStorage.setItem(KEY, JSON.stringify(progress));
	} catch {
		// Si no deja guardar, lo avanzado dura lo que dure la visita.
	}
}
