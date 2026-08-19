/**
 * Borra las ideas de la base de datos: la tabla prompts entera, pendientes y
 * descartadas. Lo demás (usuarios, ciclos, funcionalidades y despliegues) se
 * queda como está.
 *
 * Pide confirmación. Con --si va directo, para cuando lo llama otro script.
 */
import { DatabaseSync } from 'node:sqlite';
import { createInterface } from 'node:readline/promises';

const file = (process.env.DATABASE_URL || 'file:local.db').replace(/^file:/, '');
const sinPreguntar = process.argv.includes('--si') || process.argv.includes('--yes');

const db = new DatabaseSync(file);
// La web puede estar escribiendo en este mismo momento.
db.exec('PRAGMA busy_timeout = 5000');

const counts = db.prepare('SELECT status, count(*) AS total FROM prompts GROUP BY status').all();
const total = counts.reduce((suma, row) => suma + Number(row.total), 0);

console.log(`Base de datos: ${file}`);

if (total === 0) {
	console.log('No hay ideas que borrar.');
	process.exit(0);
}

for (const row of counts) {
	console.log(`  ${row.status}: ${row.total}`);
}

if (!sinPreguntar) {
	if (!process.stdin.isTTY) {
		console.error('Esto borra ideas y nadie puede confirmarlo. Repite con --si.');
		process.exit(1);
	}

	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const respuesta = await rl.question(`Se borran ${total} ideas y no hay vuelta atrás. ¿Seguro? (si/NO) `);
	rl.close();

	if (!/^s[ií]$/i.test(respuesta.trim())) {
		console.log('No he borrado nada.');
		process.exit(0);
	}
}

const { changes } = db.prepare('DELETE FROM prompts').run();
console.log(`Borradas ${Number(changes)} ideas.`);
