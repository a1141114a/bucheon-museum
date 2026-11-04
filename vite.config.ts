import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Relative assets work at / and /repository/. HashRouter avoids Pages 404s.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || './',
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
  build: { rollupOptions: { output: { manualChunks: {
    three: ['three'], renderer: ['@react-three/fiber', '@react-three/drei'],
  } } } },
})
