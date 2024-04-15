/**
 * https://huemint.com/website-monochrome/#palette=353633-fbfdff
 * https://huemint.com/website-monochrome/#palette=161718-dfd1a3 Very Nice
 * https://huemint.com/website-monochrome/#palette=151a1a-ebab2e
 */

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
				lighten: '#fde68a20',
				// 'highlight-foreground': '#E7E5E4'
				'highlight-foreground': '#f6c304',
				'highlight-background': '#161517',
				primary: {
					50: '#FDF8EC',
					100: '#FBEED5',
					200: '#F7DEAB',
					300: '#F3CD81',
					400: '#EFBC57',
					500: '#EBAB2E',
					600: '#CD8F14',
					700: '#9A6B0F',
					800: '#66480A',
					900: '#332405',
					950: '#1C1403'
				},
				secondary: {
					50: '#E6EAEA',
					100: '#CCD6D6',
					200: '#99ADAD',
					300: '#698282',
					400: '#3E4C4C',
					500: '#0a0807',
					600: '#101414',
					700: '#211a17',
					800: '#171310',
					900: '#0a0807',
					950: '#020303'
				}
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
