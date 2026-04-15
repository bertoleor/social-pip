import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
	plugins: [
		react(),
		visualizer({
			filename: 'stats.html',
			open: false,
			gzipSize: true,
			brotliSize: true,
		}),
	],
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
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		watch: {
			ignored: ['**/src-tauri/**'],
		},
	},
	build: {
		target: 'esnext',
		minify: 'esbuild',
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: {
					// Vendor chunk for React ecosystem
					react: ['react', 'react-dom', 'react-router-dom'],
					// State management
					state: ['zustand', '@tanstack/react-query'],
					// UI utilities
					ui: ['clsx', 'tailwind-merge', 'lucide-react'],
					// Data visualization
					charts: ['recharts'],
					// Date utilities
					date: ['date-fns'],
					// Form validation
					validation: ['zod'],
				},
			},
		},
	},
})
