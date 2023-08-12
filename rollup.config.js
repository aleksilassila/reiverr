import json from '@rollup/plugin-json';
import svelte from 'rollup-plugin-svelte';

export default {
	plugins: [json(), svelte({})]
};
