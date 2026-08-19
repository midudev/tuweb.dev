// pm2 start ecosystem.config.cjs
module.exports = {
	apps: [
		{
			name: 'tuweb',
			cwd: '/opt/tuweb',
			script: 'dist/server/entry.mjs',
			node_args: '--env-file=/opt/tuweb/.env',
			exec_mode: 'fork',
			instances: 1,
			max_memory_restart: '400M',
			restart_delay: 3000,
			max_restarts: 10,
			env: { NODE_ENV: 'production' },
		},
		{
			// Una iteración entera: cierra la ventana, la IA implementa la idea
			// ganadora, se comprueba y se sube a git.
			// Debe coincidir con WINDOW_MINUTES de src/lib/window.ts.
			name: 'tuweb-cron',
			cwd: '/opt/tuweb',
			script: 'scripts/iterate.mjs',
			node_args: '--env-file=/opt/tuweb/.env',
			autorestart: false,
			cron_restart: '*/30 * * * *',
			env: { NODE_ENV: 'production' },
		},
	],
};
