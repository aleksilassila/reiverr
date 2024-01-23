import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';
import viteLegacyPlugin from '@vitejs/plugin-legacy';

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
	optimizeDeps: { exclude: ['svelte-navigator'] }

	// base: '/dist',
	//     experimental: {
	//       renderBuiltUrl() {
	//           return { relative: true }
	//       }
	//   },
});
