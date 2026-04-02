/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,jsx}'],
	theme: {
		extend: {
			colors: {
				/* Law book palette - aged, warm, sophisticated */
				/* Core backgrounds - deep browns and blacks */
				surface: '#1a1410',
				'surface-secondary': '#2d2620',
				'surface-tertiary': '#3d3630',
				/* Text - warm cream and ivory */
				foreground: '#f5f0e8',
				'foreground-secondary': '#d4cfc7',
				'foreground-muted': '#a89f97',
				/* Accent - muted gold for legal/manuscript feel */
				accent: '#b8956a',
				'accent-light': '#d4a574',
				'accent-muted': '#8b7d6b',
				/* Secondary colors */
				success: '#7cb342',
				warning: '#c9a961',
				error: '#c65555',
				/* For backward compatibility */
				ink: '#1a1410',
				'ink-light': '#2d2620',
				'ink-lighter': '#3d3630',
				primary: '#b8956a',
				'primary-dark': '#8b7d6b',
				'primary-light': '#d4a574',
				'neutral-50': '#f5f0e8',
				'neutral-100': '#eae5dd',
				'neutral-200': '#d4cfc7',
				'neutral-300': '#a89f97',
				'neutral-600': '#6b6560',
				dusk: '#1a1410',
				blaze: '#d4a574',
				mint: '#7cb342',
				parchment: '#eae5dd',
			},
			fontFamily: {
				display: ['"Georgia"', '"Cambria"', 'serif'],
				body: ['"Georgia"', '"Cambria"', 'serif'],
				mono: ['"Courier New"', 'monospace'],
			},
			spacing: {
				0: '0',
				0.5: '4px',
				1: '8px',
				1.5: '12px',
				2: '16px',
				2.5: '20px',
				3: '24px',
				3.5: '28px',
				4: '32px',
				5: '40px',
				6: '48px',
				8: '64px',
			},
			borderRadius: {
				xs: '6px',
				sm: '8px',
				md: '10px',
				lg: '12px',
				xl: '16px',
				full: '9999px',
			},
			boxShadow: {
				xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
				sm: '0 2px 4px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
				base: '0 4px 8px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
				md: '0 8px 16px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
				lg: '0 12px 24px -6px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
				'chat-bubble':
					'0 2px 6px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
				inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.05)',
			},
			backgroundImage: {
				'paper-texture': `
					repeating-linear-gradient(90deg, rgba(139, 125, 107, 0.02) 0%, transparent 1%),
					repeating-linear-gradient(0deg, rgba(139, 125, 107, 0.01) 0%, transparent 1%)
				`,
				'subtle-grain': `
					url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" seed="2" /></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.03"/></svg>')
				`,
			},
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				'2xl': '1.5rem',
				'3xl': '1.875rem',
				'4xl': '2.25rem',
			},
			letterSpacing: {
				normal: '0',
				legal: '0.025em',
				wide: '0.05em',
			},
		},
	},
	plugins: [],
};
