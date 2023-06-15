/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				display: ['Inter', 'system', 'sans-serif']
			},
			colors: {
				darken: '#070501bf',
				'highlight-dim': '#fde68a20'
			}
		}
	},
	plugins: []
};
