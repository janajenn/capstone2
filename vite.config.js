import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react({
            // Add these babel configs for optimal Framer Motion bundling
            babel: {
                plugins: [
                    [
                        '@babel/plugin-transform-react-jsx',
                        {
                            runtime: 'automatic',
                            importSource: '@emotion/react',
                        },
                    ],
                ],
            },
        }),
    ],
    optimizeDeps: {
        include: [
            'framer-motion',
            '@emotion/react',
            '@emotion/styled',
        ],
        esbuildOptions: {
            // Additional esbuild options
            loader: {
                '.js': 'jsx',
            },
        },
    },
    build: {
        chunkSizeWarningLimit: 1600, // Adjust chunk size warning limit (in kB)
    },
});
