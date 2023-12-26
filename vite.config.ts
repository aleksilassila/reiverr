import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';
import viteLegacyPlugin from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [viteLegacyPlugin(), svelte(), viteSingleFile()]

	// base: '/dist',
	//     experimental: {
	//       renderBuiltUrl() {
	//           return { relative: true }
	//       }
	//   },
});
