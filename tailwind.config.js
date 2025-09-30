import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: {
                    blue: '#102a71',
                    yellow: '#f5c400',
                },
                dept: {
                    dark: '#273631',
                    green: '#375f45',
                }
            },
            backgroundColor: {
                'brand-blue': '#102a71',
                'brand-yellow': '#f5c400',
                'dept-dark': '#273631',
                'dept-green': '#375f45',
            },
            textColor: {
                'brand-blue': '#102a71',
                'brand-yellow': '#f5c400',
                'dept-dark': '#273631',
                'dept-green': '#375f45',
            },
            borderColor: {
                'brand-blue': '#102a71',
                'brand-yellow': '#f5c400',
                'dept-dark': '#273631',
                'dept-green': '#375f45',
            }
        },
    },

    plugins: [forms],
};