// @ts-check
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	vite: {
		plugins: [tailwindcss()],
		// Sin scripts en línea: así la CSP puede ser script-src 'self' a secas.
		build: { assetsInlineLimit: 0 },
	},
});
