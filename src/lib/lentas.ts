/*
 * La función de la casa para cada problema de la semana: la que da la respuesta
 * buena, pero a lo bruto. Es la que hay que optimizar. Va como texto para leerla;
 * aquí no se ejecuta nada. El coste se apunta con los índices de la liga.
 */

export interface Lenta {
	/** La función en JavaScript, tal cual se enseña. */
	codigo: string;
	/** Índice en TIEMPOS de la liga. */
	tiempo: number;
	/** Índice en MEMORIAS de la liga. */
	memoria: number;
}

export const LENTAS: Record<string, Lenta> = {
	subarray: {
		tiempo: 5,
		memoria: 0,
		codigo: `function racha(dias) {
  let mejor = -Infinity;
  for (let i = 0; i < dias.length; i++)
    for (let j = i; j < dias.length; j++) {
      let suma = 0;
      for (let k = i; k <= j; k++) suma += dias[k];
      mejor = Math.max(mejor, suma);
    }
  return mejor;
}`,
	},
	parejas: {
		tiempo: 4,
		memoria: 0,
		codigo: `function parejas(k, nums) {
  let total = 0;
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++)
      if (nums[i] + nums[j] === k) total++;
  return total;
}`,
	},
	creciente: {
		tiempo: 6,
		memoria: 2,
		codigo: `function escalera(nums, i = 0, ultimo = -Infinity) {
  if (i === nums.length) return 0;
  const sin = escalera(nums, i + 1, ultimo);
  if (nums[i] <= ultimo) return sin;
  return Math.max(sin, 1 + escalera(nums, i + 1, nums[i]));
}`,
	},
	parentesis: {
		tiempo: 5,
		memoria: 2,
		codigo: `function cierran(s) {
  let mejor = 0;
  for (let i = 0; i < s.length; i++)
    for (let j = i + 2; j <= s.length; j += 2) {
      let abiertos = 0;
      for (const c of s.slice(i, j)) {
        abiertos += c === '(' ? 1 : -1;
        if (abiertos < 0) break;
      }
      if (abiertos === 0) mejor = Math.max(mejor, j - i);
    }
  return mejor;
}`,
	},
	islas: {
		tiempo: 4,
		memoria: 2,
		codigo: `function islas(mapa) {
  const id = mapa.map((fila, y) =>
    [...fila].map((c, x) => (c === '#' ? y * 100 + x : -1)));
  let cambia = true;
  while (cambia) {
    cambia = false;
    id.forEach((fila, y) => fila.forEach((v, x) => {
      if (v < 0) return;
      for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const w = id[y + dy]?.[x + dx] ?? -1;
        if (w >= 0 && w < id[y][x]) { id[y][x] = w; cambia = true; }
      }
    }));
  }
  return new Set(id.flat().filter((v) => v >= 0)).size;
}`,
	},
	escalera: {
		tiempo: 6,
		memoria: 2,
		codigo: `function formas(n) {
  if (n < 0) return 0;
  if (n === 0) return 1;
  return (formas(n - 1) + formas(n - 2) + formas(n - 3)) % 1000000007;
}`,
	},
	intervalos: {
		tiempo: 4,
		memoria: 2,
		codigo: `function tapado(toldos) {
  // Metro a metro: los toldos por lo que mide cada uno.
  const metros = new Set();
  for (const [a, b] of toldos)
    for (let m = a; m < b; m++) metros.add(m);
  return metros.size;
}`,
	},
};
