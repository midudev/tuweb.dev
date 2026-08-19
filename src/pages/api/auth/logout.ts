import type { APIRoute } from 'astro';
import { sameOrigin } from '../../../lib/http';

export const POST: APIRoute = async ({ request, session, redirect }) => {
	// Cerrar la sesión de otro desde otra web es una faena tonta, pero gratis
	// si no se comprueba de dónde viene el formulario.
	if (!sameOrigin(request)) {
		return redirect('/?error=origin');
	}

	await session?.destroy();
	return redirect('/');
};
