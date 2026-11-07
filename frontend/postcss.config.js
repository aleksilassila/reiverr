import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

// Svelte 5 scopes the other compound selectors of a rule with `:where(.svelte-xyz)`, which
// Chromium 69 (Tizen 5.5) does not know and drops with the whole rule; the plain class is what
// Svelte 3 wrote, at one class more of specificity
const stripSvelteWhere = {
	postcssPlugin: 'strip-svelte-where',
	Rule(rule) {
		rule.selector = rule.selector.replace(/:where\((\.svelte-[a-z0-9]+)\)/g, '$1');
	}
};

export default {
	plugins: [tailwindcss, autoprefixer, stripSvelteWhere]
};
