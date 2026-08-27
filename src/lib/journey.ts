/**
 * La evolución de tus ideas: por dónde va cada una de las que has mandado.
 *
 * No hay tabla nueva ni nada que apuntar aparte. Los pasos salen de lo que ya
 * está guardado: el estado de la idea, el grupo en el que cayó al cerrar la
 * ventana y la versión que salió de aquella ventana.
 */
import { all, get } from './db/client';
import { DISCARD_LABELS } from './window';

/** Los pasos por los que pasa una idea, en orden. */
export const STEPS = [
	{
		key: 'sent',
		label: 'Enviada',
		icon: 'send',
		detail: 'La escribes y entra en la ventana abierta.',
	},
	{
		key: 'kept',
		label: 'Pasa el filtro',
		icon: 'circle-check',
		detail: 'Al cerrar la ventana la IA la repasa y la da por buena.',
	},
	{
		key: 'grouped',
		label: 'Agrupada',
		icon: 'users',
		detail: 'Se junta con las demás que piden lo mismo.',
	},
	{
		key: 'won',
		label: 'Gana la ventana',
		icon: 'trophy',
		detail: 'Su grupo es el elegido y pasa a construirse.',
	},
	{
		key: 'shipped',
		label: 'Publicada',
		icon: 'rocket',
		detail: 'Ya está en la web, con su número de versión.',
	},
] as const;

/** Dónde acabó una idea. Es lo que decide el color y el resumen de su ficha. */
export type IdeaStage = 'open' | 'discarded' | 'lost' | 'building' | 'shipped';

export const STAGES: Record<IdeaStage, { label: string; icon: string }> = {
	open: { label: 'En juego', icon: 'hourglass' },
	discarded: { label: 'Descartada', icon: 'circle-x' },
	lost: { label: 'No ganó', icon: 'flag' },
	building: { label: 'Ganó su ventana', icon: 'hammer' },
	shipped: { label: 'Publicada', icon: 'rocket' },
};

export interface IdeaJourney {
	id: number;
	body: string;
	createdAt: string;
	stage: IdeaStage;
	/** Hasta qué paso llegó, de 1 a 5. */
	reached: number;
	/** Por qué la tumbó la IA, si la tumbó. */
	discardReason: string | null;
	/** El grupo en el que cayó: cómo lo tituló la IA y cuánta gente pidió eso. */
	clusterTitle: string | null;
	people: number;
	/** Cuándo cerró la ventana en la que entró. */
	closedAt: string | null;
	/** Lo que ganó aquella ventana, cuando no fue esta idea. */
	windowWinner: string | null;
	/** Cómo se construyó, solo si la ganadora fue esta. */
	featureTitle: string | null;
	version: number | null;
	shippedAt: string | null;
	/** Cambios que ya ha gastado en su ventana. */
	edits: number;
}

export interface JourneyTotals {
	sent: number;
	open: number;
	discarded: number;
	kept: number;
	wins: number;
	shipped: number;
}

interface PromptRow {
	id: number;
	body: string;
	status: string;
	discardReason: string | null;
	edits: number;
	createdAt: string;
	clusterTitle: string | null;
	clusterPeople: number | null;
	cycleId: number | null;
	closedAt: string | null;
	winnerTitle: string | null;
}

interface FeatureRow {
	id: number;
	cycleId: number | null;
	title: string;
	status: string;
	shippedAt: string | null;
}

/** Lo que salió de cada ventana, ya con su número de versión. */
interface CycleFeature {
	title: string;
	shipped: boolean;
	version: number | null;
	shippedAt: string | null;
}

const EMPTY: JourneyTotals = { sent: 0, open: 0, discarded: 0, kept: 0, wins: 0, shipped: 0 };

export function getJourneyData(userId?: number) {
	if (!userId) return { ideas: [] as IdeaJourney[], totals: EMPTY, current: null };

	const rows = all<PromptRow>(
		`SELECT p.id, p.body, p.status, p.discard_reason AS discardReason, p.edits,
			p.created_at AS createdAt, c.title AS clusterTitle, c.prompt_count AS clusterPeople,
			c.cycle_id AS cycleId, cy.processed_at AS closedAt, cy.winner_title AS winnerTitle
		 FROM prompts p
		 LEFT JOIN clusters c ON c.id = p.cluster_id
		 LEFT JOIN cycles cy ON cy.id = c.cycle_id
		 WHERE p.user_id = ?
		 ORDER BY p.id DESC`,
		userId,
	);

	// La v1 es la más antigua, igual que en el changelog: se cuentan las
	// publicadas por orden de llegada y cada ventana se queda con la suya.
	const features = all<FeatureRow>(
		`SELECT id, cycle_id AS cycleId, title, status, shipped_at AS shippedAt
		 FROM features ORDER BY id ASC`,
	);

	const byCycle = new Map<number, CycleFeature>();
	let version = 0;
	for (const feature of features) {
		const shipped = feature.status === 'shipped';
		if (shipped) version += 1;
		if (feature.cycleId === null) continue;
		byCycle.set(feature.cycleId, {
			title: feature.title,
			shipped,
			version: shipped ? version : null,
			shippedAt: feature.shippedAt,
		});
	}

	const ideas: IdeaJourney[] = rows.map((row) => {
		// La versión de aquella ventana solo es suya si su grupo fue el ganador; a
		// las demás del mismo ciclo no se les cuelga lo que construyó otro.
		const won = row.status === 'selected';
		const feature = won && row.cycleId !== null ? (byCycle.get(row.cycleId) ?? null) : null;

		// 'pending' es la ventana abierta; 'grouped' pasó el filtro pero ganó otro
		// grupo, y 'selected' es la que ganó. Lo demás es que la IA la tumbó.
		let stage: IdeaStage = 'discarded';
		let reached = 1;

		if (row.status === 'pending') {
			stage = 'open';
		} else if (row.status === 'selected') {
			stage = feature?.shipped ? 'shipped' : 'building';
			reached = feature?.shipped ? 5 : 4;
		} else if (row.status === 'grouped') {
			stage = 'lost';
			reached = 3;
		}

		return {
			id: row.id,
			body: row.body,
			createdAt: row.createdAt,
			stage,
			reached,
			discardReason: row.discardReason,
			clusterTitle: row.clusterTitle,
			people: row.clusterPeople ?? 0,
			closedAt: row.closedAt,
			windowWinner: won ? null : row.winnerTitle,
			featureTitle: feature?.title ?? null,
			version: feature?.version ?? null,
			shippedAt: feature?.shippedAt ?? null,
			edits: row.edits,
		};
	});

	const count = (stage: IdeaStage) => ideas.filter((idea) => idea.stage === stage).length;
	const totals: JourneyTotals = {
		sent: ideas.length,
		open: count('open'),
		discarded: count('discarded'),
		kept: count('lost') + count('building') + count('shipped'),
		wins: count('building') + count('shipped'),
		shipped: count('shipped'),
	};

	// La idea de la ventana abierta es la última que mandaste después del último
	// cierre. Puede estar en juego o descartada de entrada, y en los dos casos es
	// la que toca mirar arriba del todo.
	const lastCycle = get<{ processedAt: string }>(
		'SELECT processed_at AS processedAt FROM cycles ORDER BY id DESC LIMIT 1',
	);
	const newest = ideas[0] ?? null;
	const current =
		newest && newest.createdAt >= (lastCycle?.processedAt ?? '') && !newest.closedAt ? newest : null;

	return { ideas, totals, current };
}

/** El desenlace de una idea en una línea. */
export function outcomeLabel(idea: IdeaJourney) {
	switch (idea.stage) {
		case 'open':
			return 'En juego: la ventana sigue abierta.';
		case 'discarded':
			return `La IA la descartó: ${DISCARD_LABELS[idea.discardReason ?? 'spam'] ?? 'no encaja'}.`;
		case 'lost':
			return 'Pasó el filtro, pero aquella ventana la ganó otro grupo.';
		case 'building':
			return 'Ganó su ventana. La IA la está construyendo.';
		case 'shipped':
			return `Publicada en la v${idea.version}.`;
	}
}

/** Lo que se escribe en el paso donde se paró, cuando se paró. */
export function stopLabel(idea: IdeaJourney) {
	if (idea.stage === 'discarded') {
		return `Aquí se paró: ${DISCARD_LABELS[idea.discardReason ?? 'spam'] ?? 'no encaja'}.`;
	}
	if (idea.stage === 'lost') return 'Aquí se paró: la ventana la ganó otro grupo.';
	return null;
}
