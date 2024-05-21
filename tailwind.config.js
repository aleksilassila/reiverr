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
			},
			keyframes: {
				timer: {
					'0%': { width: '0%' },
					'100%': { width: '100%' }
				}
			},
			animation: {
				timer: 'timer 1s linear'
			}
		}
	},
	future: {
		hoverOnlyWhenSupported: true
	},
	plugins: [require('tailwind-scrollbar-hide')]
};
