import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
	plugins: [sveltekit()],
	server: {
		port: Number(process.env.PORT || 9494)
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	ssr: {
		external: ['reflect-metadata']
	},
}));
