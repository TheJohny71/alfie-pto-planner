import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Set base to the repository name for GitHub Pages
  base: '/alfie-pto-planner/',
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets/css', // Ensuring CSS ends up in 'assets/css' folder
    rollupOptions: {
      output: {
        // Ensure proper folder structure for assets
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').pop();
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';  // Put images in an 'img' folder within 'assets'
          } else if (/css/i.test(extType)) {
            extType = 'css';  // Put CSS files in a 'css' folder within 'assets'
          } else {
            extType = 'misc'; // Default for other file types
          }
          return `assets/${extType}/${assetInfo.name}`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
});
