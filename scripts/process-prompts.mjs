const port = process.env.PORT || '4321';
const url = process.env.CRON_URL || `http://127.0.0.1:${port}/api/cron/process`;
const secret = process.env.CRON_SECRET;

if (!secret) {
	console.error('Falta CRON_SECRET');
	process.exit(1);
}

const response = await fetch(url, {
	headers: { Authorization: `Bearer ${secret}` },
});

const body = await response.text();

if (!response.ok) {
	console.error(body || `Cron falló con ${response.status}`);
	process.exit(1);
}

console.log(body);
