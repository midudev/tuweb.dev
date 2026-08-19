import type { APIRoute } from 'astro';
import { getSessionUser } from '../../lib/auth';
import { createPrompt, getMyPromptInWindow, MAX_EDITS, updatePrompt } from '../../lib/db/queries';
import { sameOrigin } from '../../lib/http';
import { heuristicReview } from '../../lib/moderation';
import { reviewWithLlm } from '../../lib/moderation-llm';

const MIN = 16;
const MAX = 280;

// Controles C0 y C1.
const CONTROL = new RegExp('[\\u0000-\\u001F\\u007F-\\u009F]', 'g');
// Anchos cero, marcas de dirección del texto y separadores invisibles.
const INVISIBLE = new RegExp('[\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF]', 'g');

/** Quita lo que no se ve, que es por donde se cuelan las instrucciones ocultas. */
function sanitize(raw: string) {
	return raw.normalize('NFC').replace(CONTROL, '').replace(INVISIBLE, '').replace(/\s+/g, ' ').trim();
}

export const POST: APIRoute = async (context) => {
	const user = await getSessionUser(context);
	if (!user) {
		return context.redirect('/?error=login');
	}

	if (!sameOrigin(context.request)) {
		return context.redirect('/?error=origin');
	}

	// Una idea por persona y ventana, aunque se puede cambiar unas cuantas
	// veces. Se mira antes de gastar una llamada al modelo: es el freno de mano
	// contra el spam.
	const mine = await getMyPromptInWindow(user.id);
	if (mine && mine.edits >= MAX_EDITS) {
		return context.redirect('/?error=cambios');
	}

	const form = await context.request.formData();
	const body = sanitize(String(form.get('body') ?? ''));

	if (body.length < MIN || body.length > MAX) {
		return context.redirect('/?error=length');
	}

	// Cambiarla por la misma no gasta un cambio.
	if (mine && mine.body === body) {
		return context.redirect('/?ok=prompt');
	}

	const heuristic = heuristicReview({ id: 0, body });
	const llm = heuristic.verdict === 'keep' ? await reviewWithLlm(body) : null;
	const review = llm?.verdict === 'discard' ? llm : heuristic;
	const veredicto = {
		keep: review.verdict === 'keep',
		reason: review.reason,
	};

	try {
		if (mine) {
			updatePrompt(mine.id, body, veredicto);
			return context.redirect(review.verdict === 'discard' ? '/?error=filtro' : '/?ok=cambio');
		}

		createPrompt(user.id, body, veredicto);
	} catch (error) {
		// El índice único corta el caso de dos envíos simultáneos del mismo
		// usuario, que la comprobación de arriba no puede ver.
		if (String(error).includes('UNIQUE')) {
			return context.redirect('/?error=enviada');
		}
		throw error;
	}

	if (review.verdict === 'discard') {
		return context.redirect('/?error=filtro');
	}

	return context.redirect('/?ok=prompt');
};
