import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    crx({
      manifestXmlPath: './public/manifest.xml',
    }),
  ],
  build: {
    outDir: 'dist',
    emptyDirFirst: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})