import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';
import viteLegacyPlugin from '@vitejs/plugin-legacy';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

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
		viteSingleFile()
	],
	optimizeDeps: { exclude: ['svelte-navigator'] },
	define: {
		REIVERR_VERSION: `"${pkg.version}"`
	},
	server: {
		port: Number(process.env.PORT || 4173)
	},
	preview: {
		port: Number(process.env.PORT || 9494)
	},

	// base: '/dist',
	//     experimental: {
	//       renderBuiltUrl() {
	//           return { relative: true }
	//       }
	//   },
});
