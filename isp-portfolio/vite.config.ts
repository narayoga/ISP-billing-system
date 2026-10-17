import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [reactRouter()],
  server: {
    // 5173 dipakai isp-frontend
    port: 5174,
  },
})
