import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                carapita: {
                    dark: '#1a1a1a',
                    gold: '#c5a059', // Dourado requintado (Casa da Calçada style)
                    bg: '#ffffff', // Fundo branco mais puro e limpo
                    text: '#4a4a4a',
                    muted: '#999999',
                    border: '#e5e5e5'
                }
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
                sans: ['"Montserrat"', 'sans-serif'],
            },
            letterSpacing: {
                widest: '.2em',
                mega: '.3em',
            }
        },
    },
    plugins: [],
};
export default config;
