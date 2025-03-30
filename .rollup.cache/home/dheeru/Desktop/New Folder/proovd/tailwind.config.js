const config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                    950: '#082f49',
                },
            },
        },
    },
    plugins: [require('daisyui')],
    daisyui: {
        themes: [
            {
                light: Object.assign(Object.assign({}, require('daisyui/src/theming/themes')['[data-theme=light]']), { 'neutral-content': '#4b5563', '--rounded-btn': '0.5rem' }),
            },
        ],
    },
};
export default config;
