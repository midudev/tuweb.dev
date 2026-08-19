export type DiscardReason =
	| 'injection'
	| 'vulnerability'
	| 'spam'
	| 'off_topic'
	| 'harmful'
	| 'external';

export type PromptReview = {
	id: number;
	verdict: 'keep' | 'discard';
	reason?: DiscardReason;
};

export type ClusterDraft = {
	title: string;
	summary: string;
	promptIds: number[];
};

export type CycleDecision = {
	reviews: PromptReview[];
	clusters: ClusterDraft[];
	winnerPromptIds: number[];
	winnerTitle: string;
	winnerSummary: string;
	rationale: string;
};

type PromptInput = { id: number; body: string };

const INJECTION_RE =
	/\b(ignore (all|any|previous|prior) (instructions|prompts)|disregard (all|any|previous)|olvid(a|e|ate de) (tus |las |todas )?(instrucciones|reglas)|salt(a|ate) (tus |las )?(reglas|instrucciones)|you are now|act as|act(u|ú)a como|haz de|finge (ser|que)|a partir de ahora eres|nuevas instrucciones|jailbreak|system prompt|prompt del sistema|developer message|mensaje del sistema|reveal (your )?(system|hidden) prompt|muestra (tu|el) (prompt|system)|exfiltrat)/i;

/** Intentos de que el código que se escriba luego saque secretos fuera. */
const EXFIL_RE =
	/(process\.env|import\.meta\.env|\.env\b|variables? de entorno|environment variables?|CRON_SECRET|GITHUB_CLIENT_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY|DATABASE_URL|claves? (de |del )?api|api keys?|credenciales|secretos?\b|tokens? de acceso|access tokens?|volcar? (la )?base de datos|dump (the )?(database|db)|select .+ from )/i;

const VULN_RE =
	/\b(xss|csrf|ssrf|rce|sqli|sql injection|path traversal|remote code|reverse shell|exploit|0-day|0day|malware|keylogger|steal (cookies?|tokens?|secrets?)|dump (secrets?|credentials|env)|child_process|webshell)\b/i;

/**
 * El servidor y su reloj no se tocan desde una idea. Va por intención, no por
 * palabra suelta: en la caja de herramientas hay un "Cron en cristiano", y una
 * idea que lo nombre habla de la utilidad, no de la tarea programada.
 */
const SERVER_RE = [
	/\b(crontab|cron[_-]?restart|systemctl|pm2\s+\w+)\b/i,
	/\b(apt(-get)?\s+install|npm\s+(i|install)\b|pnpm\s+(add|install)\b|yarn\s+add)/i,
	/\b(cambia\w*|modific\w*|ajust\w*|configur\w*|pon\w*|baja\w*|sub\w*|reduc\w*|aument\w*)\s+(el\s+|la\s+|los\s+)?(cron\b|ventana|frecuencia|intervalo|periodicidad)/i,
	/\b(cada\s+cu(a|á)nto\s+(se\s+)?(cierra|abre|itera|publica))/i,
	/\b(duraci(o|ó)n|frecuencia)\s+de\s+(la\s+)?ventana/i,
	/\binstal\w+\s+(\S+\s+){0,3}(en\s+el\s+servidor|como\s+dependencia)/i,
	/\bejecut\w+\s+(\S+\s+){0,2}(comandos?|c(o|ó)digo\s+arbitrario|scripts?\s+del\s+servidor)/i,
];

/**
 * Todo se sirve desde esta web: sin CDNs, sin APIs de terceros y sin nada
 * incrustado de fuera. La CSP lo bloquearía en el navegador, así que aceptarlo
 * sería publicar algo roto.
 */
const EXTERNAL_RE = [
	// Sitios que solo salen cuando alguien quiere traerse algo de fuera.
	/\b(jsdelivr|unpkg|cdnjs|googleapis|google\s+(analytics|fonts|maps)|tag\s+manager|font\s?awesome)\b/i,
	// Y lo demás, solo si se pide traerlo o llamarlo. Nombrar YouTube en una
	// idea no es lo mismo que pedir que se incruste un vídeo de YouTube.
	/\b(carg\w+|us\w+|trae\w*|import\w+|enlaz\w+|integr\w+|conect\w+|llam\w+|consult\w+|incrust\w+|inserta\w*|embeb\w+)\s+(\S+\s+){0,4}\b(cdn|api\s+(externa|de\s+terceros|de\s+\w+)|webhook|iframe|youtube|spotify|twitter|discord|openai|chatgpt|servicio\s+externo)\b/i,
];

const REPEAT_RE = /(.)\1{9,}/i;
const URL_RE = /https?:\/\//gi;

function normalize(text: string) {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[^\p{L}\p{N}\s]+/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function tokens(text: string) {
	return new Set(normalize(text).split(' ').filter((word) => word.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>) {
	if (a.size === 0 || b.size === 0) return 0;
	let inter = 0;
	for (const token of a) {
		if (b.has(token)) inter += 1;
	}
	return inter / (a.size + b.size - inter);
}

export function heuristicReview(prompt: PromptInput): PromptReview {
	const body = prompt.body.trim();
	if (body.length < 12) {
		return { id: prompt.id, verdict: 'discard', reason: 'spam' };
	}
	if (INJECTION_RE.test(body)) {
		return { id: prompt.id, verdict: 'discard', reason: 'injection' };
	}
	if (EXFIL_RE.test(body)) {
		return { id: prompt.id, verdict: 'discard', reason: 'injection' };
	}
	if (VULN_RE.test(body) || SERVER_RE.some((rule) => rule.test(body))) {
		return { id: prompt.id, verdict: 'discard', reason: 'vulnerability' };
	}
	if (EXTERNAL_RE.some((rule) => rule.test(body))) {
		return { id: prompt.id, verdict: 'discard', reason: 'external' };
	}
	if (REPEAT_RE.test(body) || (body.match(URL_RE) ?? []).length >= 3) {
		return { id: prompt.id, verdict: 'discard', reason: 'spam' };
	}
	return { id: prompt.id, verdict: 'keep' };
}

export function heuristicDecision(prompts: PromptInput[]): CycleDecision {
	const reviews = prompts.map(heuristicReview);
	const kept = prompts.filter((prompt) => reviews.find((review) => review.id === prompt.id)?.verdict === 'keep');

	const groups: PromptInput[][] = [];
	for (const prompt of kept) {
		const promptTokens = tokens(prompt.body);
		const match = groups.find((group) => jaccard(promptTokens, tokens(group[0].body)) >= 0.32);
		if (match) match.push(prompt);
		else groups.push([prompt]);
	}

	const clusters: ClusterDraft[] = groups.map((group) => {
		const title = group[0].body.replace(/\s+/g, ' ').trim().slice(0, 72);
		return {
			title,
			summary:
				group.length === 1
					? group[0].body
					: `${group.length} personas pidieron algo parecido: ${title}`,
			promptIds: group.map((item) => item.id),
		};
	});

	clusters.sort((a, b) => b.promptIds.length - a.promptIds.length);
	const winner = clusters[0];

	return {
		reviews,
		clusters,
		winnerPromptIds: winner?.promptIds ?? [],
		winnerTitle: winner?.title ?? '',
		winnerSummary: winner?.summary ?? '',
		rationale: winner
			? winner.promptIds.length > 1
				? `Gana lo más repetido de la ventana: ${winner.promptIds.length} personas pidieron lo mismo.`
				: `Se elige la idea más clara y viable de las ${kept.length} propuestas válidas.`
			: 'No quedó ninguna propuesta usable en esta ventana.',
	};
}
