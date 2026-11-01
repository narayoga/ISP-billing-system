import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  // Halaman review komponen; sengaja tidak masuk daftar prerender.
  route('ui-kit', 'routes/ui-kit.tsx'),
] satisfies RouteConfig
