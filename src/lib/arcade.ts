/**
 * El salón recreativo: las cuatro máquinas que hay y las preguntas de la
 * trivia. Aquí solo están los datos; la partida entera pasa en el navegador y
 * el récord se queda en él.
 */

export interface Juego {
	/** El identificador, que es también el de su tablero en el HTML. */
	id: string;
	title: string;
	/** Un icono de Tabler para la tarjeta del menú. */
	icon: string;
	/** La línea que lo presenta en el menú. */
	card: string;
	/** Cómo se juega, para la cabecera del juego abierto. */
	how: string;
}

export const JUEGOS: Juego[] = [
	{
		id: 'esquiva',
		title: 'Esquiva',
		icon: 'meteor',
		card: 'Caen cosas y tú estás abajo. Cada una que se te escapa suma.',
		how: 'Muévete con las flechas o con A y D; con el dedo, toca a un lado o al otro del tablero. Cada obstáculo que pasa de largo suma un punto, y cuantos más lleves, más rápido cae todo.',
	},
	{
		id: 'memoria',
		title: 'Memoria',
		icon: 'cards',
		card: 'Ocho parejas tapadas. Menos movimientos y menos tiempo, más puntos.',
		how: 'Destapa dos cartas: si son iguales se quedan, si no vuelven a taparse. Puntúa lo que sobra de novecientos: cada movimiento y cada segundo restan.',
	},
	{
		id: 'trivia',
		title: 'Trivia',
		icon: 'bulb',
		card: 'Seis preguntas de programación y doce segundos para cada una.',
		how: 'Seis preguntas al azar. Cada acierto son cien puntos más lo que quede en el reloj; si se acaba el tiempo, esa pregunta se va a cero.',
	},
	{
		id: 'reaccion',
		title: 'Reacción',
		icon: 'hand-click',
		card: 'Cinco rondas. Cuando el panel se encienda, pulsa.',
		how: 'El panel tarda lo que le da la gana en encenderse. Cuando lo haga, pulsa: cuanto antes, más puntos. Si te adelantas, esa ronda se va a cero.',
	},
];

/** Las ocho parejas del juego de memoria, cada una con su icono. */
export const SIMBOLOS = ['bolt', 'ghost', 'flame', 'star', 'rocket', 'bug', 'git-commit', 'droplet'];

/** La primera opción es siempre la buena; se barajan al empezar la partida. */
export interface Pregunta {
	texto: string;
	opciones: string[];
}

export const PREGUNTAS: Pregunta[] = [
	{ texto: '¿Qué devuelve typeof null en JavaScript?', opciones: ['"object"', '"null"', '"undefined"'] },
	{ texto: '¿Qué operador compara valor y tipo en JavaScript?', opciones: ['===', '==', '='] },
	{ texto: '¿Qué método de array devuelve otro con los que cumplen algo?', opciones: ['filter', 'forEach', 'push'] },
	{ texto: 'En CSS, ¿qué unidad va contra el tamaño de la raíz?', opciones: ['rem', 'em', 'vh'] },
	{ texto: '¿Qué código HTTP dice que no se ha encontrado?', opciones: ['404', '500', '301'] },
	{ texto: '¿Qué comando de Git deshace un commit haciendo otro encima?', opciones: ['revert', 'reset', 'stash'] },
	{ texto: '¿Qué puerto usa HTTPS por defecto?', opciones: ['443', '80', '8080'] },
	{ texto: 'En SQL, ¿qué palabras ordenan los resultados?', opciones: ['ORDER BY', 'GROUP BY', 'HAVING'] },
	{ texto: '¿Qué etiqueta marca el contenido principal de la página?', opciones: ['<main>', '<section>', '<article>'] },
	{ texto: '¿Qué propiedad de CSS reparte el contenido en filas y columnas?', opciones: ['grid', 'float', 'position'] },
];
