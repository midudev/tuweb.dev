/**
 * El historial de cambios: cada versión publicada de esta web, agrupada por el
 * mes en que salió y con lo justo para poder enlazarla y buscarla.
 *
 * No hay tabla nueva ni consulta nueva: todo sale de getChangelogData(), que es
 * lo que ya pintaba la lista. Aquí solo se agrupa, se cuenta y se le pone
 * fecha en cristiano. El historial de /historial cuenta también lo que salió
 * mal; esto son las versiones que quedaron en pie.
 */
import { getChangelogData } from './db/queries';

export interface ChangeEntry {
	version: number;
	title: string;
	/** El resumen, si dice algo más que el título. */
	summary: string | null;
	shippedAt: string | null;
	commitSha: string | null;
	/** Horas desde la versión anterior. null en la v1 o si falta la fecha. */
	gapHours: number | null;
	/** Todo lo buscable de la entrada, en minúsculas y sin acentos. */
	search: string;
}

export interface ChangeMonth {
	key: string;
	label: string;
	entries: ChangeEntry[];
}

export interface ChangeTotals {
	versions: number;
	/** Cuándo salió la primera, si quedó apuntado. */
	since: string | null;
	last: string | null;
	/** Horas de media entre versión y versión. null con menos de dos fechadas. */
	pace: number | null;
}

const HOUR_MS = 3_600_000;

/**
 * Minúsculas y sin acentos: buscar «diseno» tiene que encontrar «diseño». La
 * misma cuenta la repite el navegador con lo que se escribe en el buscador.
 */
export function normalize(text: string) {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '');
}

/** El día y la hora en que salió, tal cual se enseñaba antes. */
export function dateLabel(iso: string) {
	return new Date(iso).toLocaleDateString('es-ES', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/** Solo el día, para el resumen de arriba. */
export function dayLabel(iso: string) {
	return new Date(iso).toLocaleDateString('es-ES', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

/** «Agosto de 2026», que es el título de cada grupo. */
export function monthLabel(iso: string) {
	const text = new Date(iso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * El cajón del mes. Sale del día de aquí, no del de Greenwich: las fechas se
 * guardan en UTC y el título se escribe en hora local, así que un cambio de mes
 * a medianoche partiría el grupo en dos con el mismo nombre.
 */
function monthKey(iso: string) {
	const date = new Date(iso);
	return `${date.getFullYear()}-${date.getMonth()}`;
}

/** Cuánto hace, en gordo: lo fino ya está en la fecha de al lado. */
export function relative(iso: string, now = Date.now()) {
	const diff = now - new Date(iso).getTime();
	if (!Number.isFinite(diff) || diff < 0) return 'ahora mismo';

	const minutes = Math.floor(diff / 60_000);
	if (minutes < 1) return 'ahora mismo';
	if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;

	const days = Math.floor(hours / 24);
	if (days < 31) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;

	const months = Math.floor(days / 30);
	if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;

	const years = Math.floor(days / 365);
	return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
}

/**
 * El hueco con la versión anterior. Aquí las ventanas son cortas y pueden salir
 * varias versiones el mismo día, así que por debajo del día se cuenta en horas.
 */
export function gapLabel(hours: number, version: number) {
	const previous = `v${version - 1}`;
	if (hours < 1) return `justo después de la ${previous}`;
	if (hours < 24) return `${hours} ${hours === 1 ? 'hora' : 'horas'} después de la ${previous}`;

	const days = Math.round(hours / 24);
	return `${days} ${days === 1 ? 'día' : 'días'} después de la ${previous}`;
}

/** El ritmo, en la unidad en la que se entiende. */
export function paceLabel(hours: number) {
	if (hours < 24) {
		const rounded = Math.max(1, Math.round(hours));
		return `una cada ${rounded} ${rounded === 1 ? 'hora' : 'horas'}`;
	}

	const days = Math.round((hours / 24) * 10) / 10;
	return `una cada ${days} ${days === 1 ? 'día' : 'días'}`;
}

/** Horas enteras entre dos momentos, sin decimales ni signos raros. */
function hoursBetween(from: string, to: string) {
	const diff = new Date(to).getTime() - new Date(from).getTime();
	if (!Number.isFinite(diff)) return null;
	return Math.max(0, Math.round(diff / HOUR_MS));
}

export function getChangelog() {
	const data = getChangelogData();
	// De la última a la primera, que es como llega y como se enseña.
	const rows = data.entries;

	const entries: ChangeEntry[] = rows.map((row, index) => {
		// La anterior es la siguiente del array: la lista baja hacia el pasado.
		const previous = rows[index + 1];
		const gapHours =
			previous?.shippedAt && row.shippedAt ? hoursBetween(previous.shippedAt, row.shippedAt) : null;

		const summary = row.summary && row.summary !== row.title ? row.summary : null;

		return {
			version: row.version,
			title: row.title,
			summary,
			shippedAt: row.shippedAt,
			commitSha: row.commitSha,
			gapHours,
			search: normalize([`v${row.version}`, row.title, summary ?? ''].join(' ')),
		};
	});

	// Las versiones que vinieron con la web no tienen fecha: caen todas juntas
	// en un grupo al final, que sigue siendo su sitio en la línea de tiempo.
	const months: ChangeMonth[] = [];
	for (const entry of entries) {
		const key = entry.shippedAt ? monthKey(entry.shippedAt) : 'sin-fecha';
		const last = months.at(-1);

		if (last?.key === key) last.entries.push(entry);
		else {
			months.push({
				key,
				label: entry.shippedAt ? monthLabel(entry.shippedAt) : 'Antes de que se apuntaran las fechas',
				entries: [entry],
			});
		}
	}

	const dated = entries.filter((entry) => entry.shippedAt).map((entry) => entry.shippedAt as string);
	const since = dated.at(-1) ?? null;
	const last = dated[0] ?? null;
	const pace =
		since && last && dated.length > 1 ? (hoursBetween(since, last) ?? 0) / (dated.length - 1) : null;

	const totals: ChangeTotals = { versions: data.version, since, last, pace };

	return { entries, months, totals, queued: data.queued };
}
