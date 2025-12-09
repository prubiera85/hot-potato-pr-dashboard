import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Inject Netlify environment variables at build time
    '__BRANCH__': JSON.stringify(process.env.BRANCH || 'local'),
    '__CONTEXT__': JSON.stringify(process.env.CONTEXT || 'local'),
  },
})
