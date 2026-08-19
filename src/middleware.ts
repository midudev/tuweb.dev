import { defineMiddleware } from 'astro:middleware';

// Todo el contenido sale de esta web. No hay CDN, ni scripts de terceros, ni
// nada que llamar fuera: por eso la política puede ser tan cerrada.
const CSP = [
	"default-src 'self'",
	"script-src 'self'",
	// Astro puede meter estilos en línea al construir la página.
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: https://avatars.githubusercontent.com",
	"font-src 'self'",
	"connect-src 'self'",
	"form-action 'self'",
	"base-uri 'self'",
	"frame-ancestors 'none'",
	"object-src 'none'",
].join('; ');

export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next();

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

	// En desarrollo, Astro inyecta scripts en línea para recargar en caliente.
	if (import.meta.env.PROD) {
		response.headers.set('Content-Security-Policy', CSP);
	}

	return response;
});
