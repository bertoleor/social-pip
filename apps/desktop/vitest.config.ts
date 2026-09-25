import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		pool: 'threads',
		minWorkers: 2,
		maxWorkers: 4,
		clearMocks: true,
		restoreMocks: true,
		mockReset: true,
		snapshotFormat: {
			escapeString: true,
			printBasicPrototype: false,
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'json', 'lcov', 'json-summary'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'node_modules/**',
				'src/test/**',
				'src/**/*.d.ts',
				'src/**/*.config.*',
				'src/main.tsx',
				'src/e2e/**',
			],
			thresholds: {
				lines: 80,
				branches: 75,
				functions: 85,
				statements: 80,
				perFile: true,
				autoUpdate: false,
			},
			reportOnFailure: true,
		},
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@components': fileURLToPath(new URL('./src/components', import.meta.url)),
			'@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
			'@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
			'@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
			'@types': fileURLToPath(new URL('./src/types', import.meta.url)),
		},
	},
})