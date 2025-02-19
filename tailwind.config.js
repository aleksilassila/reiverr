import scrollbarHide from 'tailwind-scrollbar-hide';

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
					50: 'hsl(40, 60%, 95%)', //''#fcf9ea',
					100: 'hsl(40, 60%, 90%)', //''#faefc7',
					200: 'hsl(40, 60%, 80%)', //''#f6dc92',
					300: 'hsl(40, 60%, 70%)', //''#f0c254',
					400: 'hsl(40, 60%, 65%)', //''#ebab2e',
					500: 'hsl(40, 60%, 55%)', //'#da9018',
					600: 'hsl(40, 30%, 24%)', //'#bc6e12',
					700: 'hsl(40, 30%, 18%)', //'#964e12',
					800: 'hsl(40, 20%, 12%)', //'#7d3f16',
					900: 'hsl(40, 20%, 8%)', //'#6a3419',
					950: 'hsl(40, 20%, 4%)' //'#3e1a0a'
				},
				secondary: {
					50: 'hsl(40, 12%, 95%)',
					100: 'hsl(40, 12%, 90%)',
					200: 'hsl(40, 12%, 80%)',
					300: 'hsl(40, 12%, 70%)',
					400: 'hsl(40, 12%, 65%)',
					500: 'hsl(40, 12%, 55%)', // #0a0807
					600: 'hsl(40, 8%, 30%)',
					700: 'hsl(40, 8%, 20%)',
					800: 'hsl(40, 8%, 12%)', //'#1a1814', //'#171310',
					900: 'hsl(40, 8%, 7%)', //'#14130f',
					950: 'hsl(40, 8%, 4%)' //'#020303'
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
	plugins: [scrollbarHide]
};
