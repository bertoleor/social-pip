import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		testMatch: ['**/*.test.ts'],
		exclude: ['node_modules', 'dist'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'json'],
			exclude: [
				'node_modules/',
				'test-utils/',
				'__tests__/',
				'prisma/',
				'vitest.config.ts',
			],
			thresholds: {
				lines: 85,
				functions: 90,
				branches: 80,
				statements: 85,
			},
		},
		setupFiles: ['./test/setup.ts'],
	},
})
