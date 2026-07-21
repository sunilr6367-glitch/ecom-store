import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        fileParallelism: false,
        setupFiles: ['./src/setupTests.ts'],
        include: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
});
