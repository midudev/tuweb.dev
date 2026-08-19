import { currentSha, lastLiveSha, log, rollbackTo, SHA_RE } from './lib/release-utils.mjs';

const current = currentSha();
const asked = process.argv[2];

if (asked && !SHA_RE.test(asked)) {
	log(`Uso: pnpm rollback [commit]. "${asked}" no es un commit.`);
	process.exit(1);
}

const target = asked ?? (await lastLiveSha(current));

if (!target) {
	log('No hay ninguna versión anterior registrada como buena.');
	process.exit(1);
}

if (target === current) {
	log('Ya estás en esa versión.');
	process.exit(0);
}

await rollbackTo(target, 'vuelta atrás manual', { commitSha: current });
