/**
 * @fileoverview Tests for Vite build configuration
 * Tests bundle optimization settings including visualizer plugin
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read the vite.config.ts as text and parse it
// Path: src -> ../vite.config.ts
const viteConfigPath = resolve(__dirname, '../vite.config.ts')
const viteConfigContent = readFileSync(viteConfigPath, 'utf-8')

describe('Vite Build Configuration', () => {
	describe('Bundle Analysis', () => {
		it('imports rollup-plugin-visualizer', () => {
			expect(viteConfigContent).toContain('visualizer')
		})

		it('configures visualizer plugin for bundle analysis', () => {
			// Should have visualizer in plugins array
			expect(viteConfigContent).toMatch(/visualizer\s*\(/)
		})

		it('configures visualizer to output stats.html', () => {
			// Should output to stats.html for analysis
			expect(viteConfigContent).toContain('stats.html')
		})

		it('configures visualizer to open on build', () => {
			// Should have open option configured
			expect(viteConfigContent).toMatch(/open:\s*(true|false)/)
		})

		it('configures visualizer gzip size reporting', () => {
			// Should have gzipSize option for accurate size reporting
			expect(viteConfigContent).toMatch(/gzipSize:\s*(true|false)/)
		})

		it('configures brotli size reporting', () => {
			// Should have brotliSize option for additional compression metrics
			expect(viteConfigContent).toMatch(/brotliSize:\s*(true|false)/)
		})
	})

	describe('Build Optimization', () => {
		it('targets esnext for modern bundling', () => {
			expect(viteConfigContent).toContain("target: 'esnext'")
		})

		it('uses esbuild for minification', () => {
			expect(viteConfigContent).toContain("minify: 'esbuild'")
		})

		it('disables sourcemaps in production', () => {
			expect(viteConfigContent).toContain('sourcemap: false')
		})

		it('configures manual chunk splitting for vendor modules', () => {
			// Should have rollupOptions with output manualChunks
			expect(viteConfigContent).toMatch(/manualChunks|splitVendorChunk/)
		})

		it('separates React into its own chunk', () => {
			// React should be in a separate chunk for optimal caching
			expect(viteConfigContent).toContain('react:')
			expect(viteConfigContent).toMatch(/\['react',\s*'react-dom'/)
		})

		it('separates state management into its own chunk', () => {
			// Zustand and react-query should be chunked together
			expect(viteConfigContent).toContain('state:')
			expect(viteConfigContent).toContain('zustand')
		})

		it('separates UI utilities into their own chunk', () => {
			// UI utilities should be chunked separately
			expect(viteConfigContent).toContain('ui:')
			expect(viteConfigContent).toContain('clsx')
		})
	})

	describe('Code Splitting Configuration', () => {
		it('has rollupOptions configured', () => {
			expect(viteConfigContent).toContain('rollupOptions')
		})

		it('has output configuration in rollupOptions', () => {
			expect(viteConfigContent).toMatch(/output:\s*\{/)
		})

		it('separates charts library for lazy loading', () => {
			// Charts should be loaded only when needed
			expect(viteConfigContent).toContain('charts:')
		})

		it('separates date utilities for on-demand loading', () => {
			// Date-fns should be loaded only when needed
			expect(viteConfigContent).toContain('date:')
		})
	})
})
