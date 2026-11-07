import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

export default {
	// Consult https://svelte.dev/docs#compile-time-svelte-preprocess
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	compilerOptions: {
		// Every flagged read is one that ran once on Svelte 3 too: the query options built from route
		// props (closures once svelte-query 6 takes accessors), form fields seeded from props, the
		// Selectable a parent passes. Revisit after the svelte-query 6 pass.
		warningFilter: (warning) => warning.code !== 'state_referenced_locally'
	},
	vitePlugin: {
		inspector: {
			// toggleKeyCombo: 'meta',
			holdMode: true
		}
	}
};
