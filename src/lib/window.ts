export const WINDOW_MINUTES = 30;
export const WINDOW_MS = WINDOW_MINUTES * 60 * 1000;

export function windowEndFrom(startedAt: string) {
	return new Date(new Date(startedAt).getTime() + WINDOW_MS).toISOString();
}

export function formatCountdown(ms: number) {
	const total = Math.max(0, Math.floor(ms / 1000));
	const minutes = String(Math.floor(total / 60)).padStart(2, '0');
	const seconds = String(total % 60).padStart(2, '0');
	return `${minutes}:${seconds}`;
}

export const DISCARD_LABELS: Record<string, string> = {
	injection: 'intento de colarse en el prompt',
	vulnerability: 'pedía algo peligroso',
	spam: 'spam o vacía',
	off_topic: 'no es una funcionalidad',
	harmful: 'dañina',
	duplicate: 'repetida',
};

export function agoLabel(iso: string) {
	const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
	if (minutes < 1) return 'ahora mismo';
	if (minutes < 60) return `hace ${minutes} min`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `hace ${hours} h`;
	const days = Math.round(hours / 24);
	return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}
