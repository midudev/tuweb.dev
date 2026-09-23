/**
 * Lo fijo del mural de píxeles: la paleta, el tamaño del lienzo y los temas.
 * Cada día sale un tema de la lista; el mismo para todo el mundo que ese día
 * tenga la misma fecha, sin servidor de por medio.
 */

/** Lado del lienzo, en píxeles del dibujo. */
export const LADO = 32;

/**
 * Dieciséis colores y ni uno más: cada píxel se guarda como una cifra
 * hexadecimal. El primero es el papel, el que pone la goma.
 */
export const PALETA = [
	{ color: '#fdf6ef', nombre: 'Papel' },
	{ color: '#3b2d24', nombre: 'Tinta' },
	{ color: '#7a6152', nombre: 'Tierra' },
	{ color: '#e8d9c8', nombre: 'Arena' },
	{ color: '#c2410c', nombre: 'Naranja' },
	{ color: '#fc784b', nombre: 'Salmón' },
	{ color: '#e8b04a', nombre: 'Mostaza' },
	{ color: '#8a5a00', nombre: 'Tostado' },
	{ color: '#b91c3c', nombre: 'Rojo' },
	{ color: '#f2758c', nombre: 'Rosa' },
	{ color: '#2f7a3b', nombre: 'Verde' },
	{ color: '#6fbf7d', nombre: 'Menta' },
	{ color: '#1e4e79', nombre: 'Azul' },
	{ color: '#5b9bd5', nombre: 'Cielo' },
	{ color: '#6b3fa0', nombre: 'Morado' },
	{ color: '#17110d', nombre: 'Noche' },
];

export const TEMAS = [
	'Un gato en la ventana',
	'Un bug con patas',
	'El café de la mañana',
	'Un cohete despegando',
	'Un robot que saluda',
	'Un fantasma',
	'La luna llena',
	'Un castillo',
	'Un teclado',
	'Una seta',
	'Un pez en su pecera',
	'Un corazón',
	'Tu casa',
	'Un dinosaurio',
	'Una planta en maceta',
	'Un atardecer',
	'Un helado',
	'Una calavera',
	'Un barco de vela',
	'Un pulpo',
	'Una llave',
	'Un mando de consola',
	'Una pizza',
	'Un perrito caliente',
	'Una nube con lluvia',
	'Un rayo',
	'Tu cara',
	'Un invasor del espacio',
	'Una espada',
	'Una flor',
	'Un búho',
	'Un semáforo',
	'Un disquete',
	'Una bombilla',
	'Un faro',
	'Una montaña nevada',
	'Tu lenguaje favorito',
	'Un árbol en otoño',
	'Una tortuga',
	'Un cactus',
];

/** La fecha local, AAAA-MM-DD: es la llave del día. */
export function fechaDe(dia: Date) {
	const y = dia.getFullYear();
	const m = String(dia.getMonth() + 1).padStart(2, '0');
	const d = String(dia.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** El tema de una fecha AAAA-MM-DD. Salta de siete en siete para no ir en orden. */
export function temaDe(fecha: string) {
	const [y, m, d] = fecha.split('-').map(Number);
	const dia = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
	const i = (((dia * 7) % TEMAS.length) + TEMAS.length) % TEMAS.length;
	return TEMAS[i];
}
