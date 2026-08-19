import {
	buildAndRestart,
	currentSha,
	lastLiveSha,
	log,
	report,
	rollbackTo,
	run,
	smoke,
	stampSha,
} from './lib/release-utils.mjs';

const previousSha = currentSha();

if (process.argv.includes('--pull')) {
	run('git pull --ff-only');
}

const commitSha = currentSha();
log(`Desplegando ${commitSha} (antes ${previousSha})`);

async function fallbackSha() {
	if (previousSha !== commitSha) return previousSha;
	return lastLiveSha(commitSha);
}

async function giveUp(reason) {
	const target = await fallbackSha();
	if (!target) {
		log(`${reason} · no hay ninguna versión anterior conocida a la que volver.`);
		await report({ commitSha, previousSha, status: 'failed', error: reason });
		process.exit(1);
	}
	await rollbackTo(target, reason, { commitSha });
	process.exit(1);
}

stampSha(commitSha);

try {
	buildAndRestart();
} catch (error) {
	await giveUp(`no compila: ${error.message}`);
}

const failure = await smoke();
if (failure) {
	await giveUp(`no pasa las comprobaciones: ${failure}`);
}

await report({ commitSha, previousSha, status: 'live', error: null });
log('Desplegado. La web responde.');
