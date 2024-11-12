import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/alfie-pto-planner/', // This should match your GitHub repository name
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "/src/styles/base/_variables.scss";`
      }
    }
  }
})
