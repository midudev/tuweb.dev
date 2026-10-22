// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, passthroughImageService } from 'astro/config';

// El experimento está parado: la web se compila una vez contra una copia de la
// base de producción y se sirve como ficheros estáticos desde Cloudflare.
export default defineConfig({
	site: 'https://tuweb.dev',
	output: 'static',
	// La web no optimiza imágenes: con passthrough, /_image no procesa nada y
	// sobra sharp.
	image: { service: passthroughImageService() },
	vite: {
		plugins: [tailwindcss()],
		// Sin scripts en línea: así la CSP puede ser script-src 'self' a secas.
		build: { assetsInlineLimit: 0 },
	},
});
