/**
 * Paletas de obras de arte famosas, sacadas a ojo y escritas a mano. No hay
 * imágenes: cada obra es su nombre, su autor y sus colores dominantes, del que
 * más pesa al que menos. El peso es el trozo aproximado del cuadro que ocupa.
 */

export interface ColorObra {
	hex: string;
	nombre: string;
	peso: number;
}

export interface Obra {
	id: string;
	titulo: string;
	autor: string;
	anio: string;
	colores: ColorObra[];
}

export const OBRAS: Obra[] = [
	{
		id: 'noche-estrellada',
		titulo: 'La noche estrellada',
		autor: 'Vincent van Gogh',
		anio: '1889',
		colores: [
			{ hex: '#1f3f73', nombre: 'Azul noche', peso: 34 },
			{ hex: '#0f1c33', nombre: 'Azul tinta', peso: 20 },
			{ hex: '#5f86b3', nombre: 'Remolino', peso: 16 },
			{ hex: '#1d2a1c', nombre: 'Ciprés', peso: 12 },
			{ hex: '#e9d67a', nombre: 'Estrella', peso: 10 },
			{ hex: '#f0a93a', nombre: 'Luna', peso: 8 },
		],
	},
	{
		id: 'gran-ola',
		titulo: 'La gran ola de Kanagawa',
		autor: 'Katsushika Hokusai',
		anio: 'c. 1831',
		colores: [
			{ hex: '#e8dcc0', nombre: 'Cielo papel', peso: 30 },
			{ hex: '#1c2d4f', nombre: 'Azul de Prusia', peso: 26 },
			{ hex: '#3f6a93', nombre: 'Ola', peso: 18 },
			{ hex: '#f4efe2', nombre: 'Espuma', peso: 12 },
			{ hex: '#c6ae83', nombre: 'Barca', peso: 8 },
			{ hex: '#7d8b94', nombre: 'Fuji', peso: 6 },
		],
	},
	{
		id: 'joven-perla',
		titulo: 'La joven de la perla',
		autor: 'Johannes Vermeer',
		anio: 'c. 1665',
		colores: [
			{ hex: '#0f0e0b', nombre: 'Fondo', peso: 44 },
			{ hex: '#2d4f82', nombre: 'Ultramar', peso: 16 },
			{ hex: '#e0c48a', nombre: 'Turbante', peso: 14 },
			{ hex: '#c89d74', nombre: 'Piel', peso: 12 },
			{ hex: '#6e5236', nombre: 'Chaqueta', peso: 9 },
			{ hex: '#f2ece0', nombre: 'Perla', peso: 5 },
		],
	},
	{
		id: 'grito',
		titulo: 'El grito',
		autor: 'Edvard Munch',
		anio: '1893',
		colores: [
			{ hex: '#dd6a2a', nombre: 'Cielo', peso: 26 },
			{ hex: '#2f4a68', nombre: 'Fiordo', peso: 22 },
			{ hex: '#8a5a32', nombre: 'Puente', peso: 18 },
			{ hex: '#efa63f', nombre: 'Atardecer', peso: 14 },
			{ hex: '#5d8187', nombre: 'Agua', peso: 12 },
			{ hex: '#2b211a', nombre: 'Figura', peso: 8 },
		],
	},
	{
		id: 'girasoles',
		titulo: 'Los girasoles',
		autor: 'Vincent van Gogh',
		anio: '1888',
		colores: [
			{ hex: '#e9c34a', nombre: 'Fondo', peso: 34 },
			{ hex: '#d68d1f', nombre: 'Pétalo', peso: 22 },
			{ hex: '#c9b36a', nombre: 'Jarrón', peso: 16 },
			{ hex: '#7f6620', nombre: 'Semilla', peso: 12 },
			{ hex: '#5f7a3a', nombre: 'Tallo', peso: 9 },
			{ hex: '#3a2914', nombre: 'Corazón', peso: 7 },
		],
	},
	{
		id: 'persistencia-memoria',
		titulo: 'La persistencia de la memoria',
		autor: 'Salvador Dalí',
		anio: '1931',
		colores: [
			{ hex: '#d8a55c', nombre: 'Horizonte', peso: 28 },
			{ hex: '#2b2923', nombre: 'Sombra', peso: 24 },
			{ hex: '#5f80a1', nombre: 'Cielo', peso: 18 },
			{ hex: '#c9c2a3', nombre: 'Reloj', peso: 12 },
			{ hex: '#8b6a3e', nombre: 'Roca', peso: 10 },
			{ hex: '#b8452c', nombre: 'Hormigas', peso: 8 },
		],
	},
	{
		id: 'meninas',
		titulo: 'Las meninas',
		autor: 'Diego Velázquez',
		anio: '1656',
		colores: [
			{ hex: '#2a2119', nombre: 'Penumbra', peso: 40 },
			{ hex: '#5a4631', nombre: 'Estudio', peso: 20 },
			{ hex: '#a88a62', nombre: 'Luz', peso: 14 },
			{ hex: '#dccaa8', nombre: 'Guardainfante', peso: 12 },
			{ hex: '#43473c', nombre: 'Verdín', peso: 8 },
			{ hex: '#7b2e22', nombre: 'Lazo', peso: 6 },
		],
	},
	{
		id: 'guernica',
		titulo: 'Guernica',
		autor: 'Pablo Picasso',
		anio: '1937',
		colores: [
			{ hex: '#141414', nombre: 'Negro', peso: 32 },
			{ hex: '#3d3d3b', nombre: 'Carbón', peso: 22 },
			{ hex: '#7b7b77', nombre: 'Gris', peso: 18 },
			{ hex: '#b9b8b2', nombre: 'Ceniza', peso: 16 },
			{ hex: '#ecebe6', nombre: 'Luz', peso: 12 },
		],
	},
	{
		id: 'beso',
		titulo: 'El beso',
		autor: 'Gustav Klimt',
		anio: '1908',
		colores: [
			{ hex: '#c9a03a', nombre: 'Oro', peso: 34 },
			{ hex: '#8a6a1e', nombre: 'Bronce', peso: 20 },
			{ hex: '#3a3222', nombre: 'Manto', peso: 16 },
			{ hex: '#d9c98c', nombre: 'Polvo de oro', peso: 12 },
			{ hex: '#6b7a3a', nombre: 'Prado', peso: 10 },
			{ hex: '#b6462f', nombre: 'Flor', peso: 8 },
		],
	},
	{
		id: 'impresion-sol-naciente',
		titulo: 'Impresión, sol naciente',
		autor: 'Claude Monet',
		anio: '1872',
		colores: [
			{ hex: '#8aa3a6', nombre: 'Bruma', peso: 32 },
			{ hex: '#5b7f8e', nombre: 'Puerto', peso: 24 },
			{ hex: '#3e5566', nombre: 'Barca', peso: 16 },
			{ hex: '#c4b79f', nombre: 'Humo', peso: 14 },
			{ hex: '#2b3943', nombre: 'Grúa', peso: 8 },
			{ hex: '#e2652c', nombre: 'Sol', peso: 6 },
		],
	},
	{
		id: 'mondrian',
		titulo: 'Composición con rojo, amarillo y azul',
		autor: 'Piet Mondrian',
		anio: '1930',
		colores: [
			{ hex: '#f2efe6', nombre: 'Blanco', peso: 46 },
			{ hex: '#d42b1e', nombre: 'Rojo', peso: 24 },
			{ hex: '#111111', nombre: 'Línea', peso: 14 },
			{ hex: '#1f3f8f', nombre: 'Azul', peso: 9 },
			{ hex: '#f3cd1f', nombre: 'Amarillo', peso: 7 },
		],
	},
	{
		id: 'jardin-delicias',
		titulo: 'El jardín de las delicias',
		autor: 'El Bosco',
		anio: 'c. 1500',
		colores: [
			{ hex: '#6f8a4f', nombre: 'Jardín', peso: 28 },
			{ hex: '#e6dccd', nombre: 'Carne', peso: 20 },
			{ hex: '#8fa9b8', nombre: 'Lejanía', peso: 16 },
			{ hex: '#c9b88f', nombre: 'Arena', peso: 14 },
			{ hex: '#d69c9a', nombre: 'Fuente', peso: 12 },
			{ hex: '#8a3a2a', nombre: 'Fruto', peso: 10 },
		],
	},
	{
		id: 'libertad-pueblo',
		titulo: 'La libertad guiando al pueblo',
		autor: 'Eugène Delacroix',
		anio: '1830',
		colores: [
			{ hex: '#3a2e22', nombre: 'Barricada', peso: 32 },
			{ hex: '#8a6a45', nombre: 'Humo', peso: 22 },
			{ hex: '#cdb58a', nombre: 'Cielo', peso: 18 },
			{ hex: '#e8dcc2', nombre: 'Túnica', peso: 12 },
			{ hex: '#2b4a7a', nombre: 'Azul', peso: 8 },
			{ hex: '#b3312a', nombre: 'Rojo', peso: 8 },
		],
	},
	{
		id: 'dos-fridas',
		titulo: 'Las dos Fridas',
		autor: 'Frida Kahlo',
		anio: '1939',
		colores: [
			{ hex: '#6f8199', nombre: 'Tormenta', peso: 34 },
			{ hex: '#3a4658', nombre: 'Nube', peso: 18 },
			{ hex: '#ece5d8', nombre: 'Encaje', peso: 16 },
			{ hex: '#b3262a', nombre: 'Corazón', peso: 12 },
			{ hex: '#6b7a3a', nombre: 'Falda', peso: 10 },
			{ hex: '#3b2a22', nombre: 'Pelo', peso: 10 },
		],
	},
	{
		id: 'caminante',
		titulo: 'El caminante sobre el mar de nubes',
		autor: 'Caspar David Friedrich',
		anio: '1818',
		colores: [
			{ hex: '#b9bcb8', nombre: 'Niebla', peso: 30 },
			{ hex: '#6d7478', nombre: 'Montaña', peso: 22 },
			{ hex: '#d8d2c3', nombre: 'Cielo', peso: 18 },
			{ hex: '#2a2622', nombre: 'Levita', peso: 14 },
			{ hex: '#4a4f52', nombre: 'Roca', peso: 10 },
			{ hex: '#8a8f8a', nombre: 'Valle', peso: 6 },
		],
	},
	{
		id: 'gioconda',
		titulo: 'La Gioconda',
		autor: 'Leonardo da Vinci',
		anio: 'c. 1503',
		colores: [
			{ hex: '#2a2a1e', nombre: 'Vestido', peso: 30 },
			{ hex: '#5b5a36', nombre: 'Paisaje', peso: 22 },
			{ hex: '#c2a36b', nombre: 'Piel', peso: 18 },
			{ hex: '#8a7a4a', nombre: 'Veladura', peso: 14 },
			{ hex: '#3e4a3a', nombre: 'Río', peso: 10 },
			{ hex: '#15120d', nombre: 'Sombra', peso: 6 },
		],
	},
];

/** Tinta que se lee encima de un color: oscura sobre claros y clara sobre oscuros. */
export function tinta(hex: string) {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	const luz = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	return luz > 0.18 ? '#1a1410' : '#fbf5ee';
}

/** Las variables CSS de una obra, listas para pegar en un :root. */
export function cssDe(obra: Obra) {
	const lineas = obra.colores.map((color, i) => `  --${obra.id}-${i + 1}: ${color.hex}; /* ${color.nombre} */`);
	return `/* ${obra.titulo} · ${obra.autor}, ${obra.anio} */\n:root {\n${lineas.join('\n')}\n}\n`;
}
