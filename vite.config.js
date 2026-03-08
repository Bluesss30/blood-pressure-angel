import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'
import os from 'os'

export default defineConfig({
  base: '/blood-pressure-angel/',
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile()
  ],
  build: {
    target: 'es2015', // Older browsers compatibility
    assetsInlineLimit: 100000000, // Inline everything
    chunkSizeWarningLimit: 10000,
  },
  cacheDir: path.join(os.tmpdir(), 'vite-clutchguard'),
})
