import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';
import viteLegacyPlugin from '@vitejs/plugin-legacy';
import { svelteTesting } from '@testing-library/svelte/vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		viteLegacyPlugin({
			// targets: ['chrome >= 64', 'edge >= 79', 'safari >= 11.1', 'firefox >= 67'],
			// ignoreBrowserslistConfig: true,
			renderLegacyChunks: true,
			// modernPolyfills: ['es/global-this']
			modernPolyfills: true
		}),
		svelte(),
		viteSingleFile(),
		svelteTesting()
	],
	define: {
		REIVERR_VERSION: `"${pkg.version}"`
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			$components: path.resolve(__dirname, './src/lib/components'),
			$pages: path.resolve(__dirname, './src/lib/pages')
		}
	},
	test: {
		environment: 'jsdom',
		include: ['src/**/*.spec.ts'],
		// The focus tree logs every move
		silent: 'passed-only'
	}

	// base: '/dist',
	//     experimental: {
	//       renderBuiltUrl() {
	//           return { relative: true }
	//       }
	//   },
});
