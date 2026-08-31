/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                zemoOrange: "#F9A825",
                zemoCyan: "#00BCD4",
                zemoBlue: "#0277BD",
                zemoYellow: "#FACC15",
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                heading: ['"Outfit"', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                marquee: 'marquee var(--duration, 30s) linear infinite',
                'marquee-reverse': 'marquee-reverse var(--duration, 30s) linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                marquee: {
                    to: { transform: 'translateX(-50%)' },
                },
                'marquee-reverse': {
                    from: { transform: 'translateX(-50%)' },
                    to: { transform: 'translateX(0)' },
                },
            }
        },
    },
    plugins: [],
}
