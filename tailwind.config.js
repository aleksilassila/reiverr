/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Montserrat', 'sans-serif'],
				display: ['Montserrat', 'system', 'sans-serif']
			},
			colors: {
				darken: '#07050166',
				lighten: '#fde68a20'
			}
		}
	},
	future: {
		hoverOnlyWhenSupported: true
	},
	plugins: [require('tailwind-scrollbar-hide')]
};
