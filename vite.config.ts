import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/alfie-pto-planner/',  // Add this line for GitHub Pages
  plugins: [react()],
})
