import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export async function githubUserFromCli() {
	const { stdout } = await exec('gh', ['api', 'user'], {
		timeout: 8000,
	});
	const profile = JSON.parse(stdout) as {
		id: number;
		login: string;
		name: string | null;
		avatar_url: string;
	};

	if (!profile?.id || !profile.login) {
		throw new Error('gh no devolvió un usuario de GitHub');
	}

	return profile;
}
