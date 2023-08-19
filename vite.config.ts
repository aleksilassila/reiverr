import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
// import * as pkg from './package.json';

export default defineConfig({
	plugins: [sveltekit()],
	// define: {
	// 	PKG: pkg
	// },
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	ssr: {
		external: ['reflect-metadata']
	}
});
