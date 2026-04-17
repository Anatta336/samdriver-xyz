import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/main.js',
            formats: ['iife'],
            name: 'app',
            fileName: () => 'index.js',
        },
        outDir: '.',
        emptyOutDir: false,
    },
});
