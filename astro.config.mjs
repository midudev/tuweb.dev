// @ts-check
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	security: {
		// Detrás de nginx, el servidor solo ve http://localhost:4321. Sin esta
		// lista, Astro ignora Host y X-Forwarded-Proto, y el POST del formulario
		// choca con el Origin real (https://tuweb.dev) y se bloquea por CSRF.
		allowedDomains: [
			{ hostname: 'tuweb.dev', protocol: 'https' },
			{ hostname: 'www.tuweb.dev', protocol: 'https' },
		],
	},
	vite: {
		plugins: [tailwindcss()],
		// Sin scripts en línea: así la CSP puede ser script-src 'self' a secas.
		// Sin borrar dist/: el servidor que está vivo carga sus rutas cuando se
		// piden, y si el build de al lado se lleva por delante los chunks viejos,
		// esas rutas devuelven 500 hasta que alguien reinicie.
		build: { assetsInlineLimit: 0, emptyOutDir: false },
	},
});
