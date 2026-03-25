import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-pdf-worker',
      resolveId(id) {
        if (id === 'virtual-pdf-worker') {
          return id
        }
      },
      load(id) {
        if (id === 'virtual-pdf-worker') {
          const source = resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
          const dest = resolve(__dirname, 'public/pdf.worker.min.js')
          
          if (!existsSync(resolve(__dirname, 'public'))) {
            mkdirSync(resolve(__dirname, 'public'), { recursive: true })
          }
          
          if (existsSync(source)) {
            copyFileSync(source, dest)
          }
          
          return ''
        }
      }
    }
  ],
})
